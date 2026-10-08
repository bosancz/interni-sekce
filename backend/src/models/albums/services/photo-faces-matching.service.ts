import { Injectable, Logger } from "@nestjs/common";
import { setImmediate } from "timers/promises";
import { Member } from "src/models/members/entities/member.entity";
import { FaceMatchingSettingsRepository } from "src/models/settings/repositories/face-matching-settings.repository";
import { DataSource, In } from "typeorm";
import { PhotoFace } from "../entities/photo-face.entity";
import { Photo } from "../entities/photo.entity";
import {
	FACE_MATCH_SETTINGS,
	FaceMatch,
	FaceMatchSettings,
	FaceReference,
	FacesMatchStats,
	MatchFace,
	matchPhotoFaces,
	pickFaceSuggestions,
	prepareReferences,
	toDescriptor,
} from "../helpers/face-matching";
import { analyzeFaceMatching, FaceMatchDecision } from "../helpers/face-matching-analysis";
import { FacesMatchTrigger, PhotoFaceAssignment } from "../schema/detected-faces";

const PHOTOS_CHUNK = 500;
const FACE_CHANGES_DEBOUNCE_MS = 2000;
const EVENT_LOOP_SLICE_MS = 20;

interface FaceMatchUpdate {
	id: number;
	memberId: number | null;
	score: number | null;
	candidateMemberId: number | null;
	candidateScore: number | null;
	candidateSecondScore: number | null;
	change: "assigned" | "cleared" | null;
}

type MatchFaceRow = Omit<MatchFace, "descriptor"> & {
	photoId: number;
	descriptor: unknown;
	candidateMemberId: number | null;
	candidateScore: number | null;
	candidateSecondScore: number | null;
};

export interface FacesMatchProgress extends FacesMatchStats {
	trigger: FacesMatchTrigger;
	startedAt: Date;
	processed: number;
}

export interface FacesMatchRun extends FacesMatchProgress {
	finishedAt: Date;
	error: string | null;
}

interface PendingChanges {
	faceIds: Set<number>;
	photoIds: Set<number>;
	memberIds: Set<number>;
}

@Injectable()
export class PhotoFacesMatchingService {
	private logger = new Logger(PhotoFacesMatchingService.name);

	private running: Promise<unknown> = Promise.resolve();

	private pending: PendingChanges = { faceIds: new Set(), photoIds: new Set(), memberIds: new Set() };
	private pendingTimer?: NodeJS.Timeout;

	private current: FacesMatchProgress | null = null;
	private lastRun: FacesMatchRun | null = null;
	private queuedAll?: Promise<FacesMatchStats>;

	constructor(
		private dataSource: DataSource,
		private faceMatchingSettings: FaceMatchingSettingsRepository,
	) {}

	async getSettings(): Promise<FaceMatchSettings> {
		const stored = await this.faceMatchingSettings.getFaceMatchingSettings();
		return { ...FACE_MATCH_SETTINGS, threshold: stored?.threshold ?? FACE_MATCH_SETTINGS.threshold };
	}

	async updateSettings(data: Pick<FaceMatchSettings, "threshold">): Promise<FaceMatchSettings> {
		await this.faceMatchingSettings.updateFaceMatchingSettings({
			threshold: Math.round(data.threshold * 100) / 100,
		});
		return this.getSettings();
	}

	getStatus() {
		return { current: this.current, queued: !!this.queuedAll, lastRun: this.lastRun };
	}

	async getAnalysis() {
		const decisions: FaceMatchDecision[] = await this.dataSource.query(
			`SELECT candidate_score AS "score", candidate_second_score AS "secondScore", score AS "detectionScore",
				member_id IS NOT NULL AND member_id = candidate_member_id AS "correct"
			FROM photo_faces
			WHERE assignment = $1 AND candidate_member_id IS NOT NULL AND candidate_score IS NOT NULL`,
			[PhotoFaceAssignment.manual],
		);

		return analyzeFaceMatching(decisions, await this.getSettings());
	}

	async getFacesStats() {
		const [stats]: { total: number; manual: number; rejected: number; auto: number; unassigned: number }[] =
			await this.dataSource.query(
				`SELECT count(*)::int AS "total",
					count(*) FILTER (WHERE assignment = $1 AND member_id IS NOT NULL)::int AS "manual",
					count(*) FILTER (WHERE assignment = $1 AND member_id IS NULL)::int AS "rejected",
					count(*) FILTER (WHERE assignment = $2)::int AS "auto",
					count(*) FILTER (WHERE assignment IS NULL)::int AS "unassigned"
				FROM photo_faces`,
				[PhotoFaceAssignment.manual, PhotoFaceAssignment.auto],
			);

		return stats;
	}

	async getSuggestions(face: Pick<PhotoFace, "id">): Promise<{ member: Member; score: number }[]> {
		const candidates: FaceMatch[] = await this.dataSource.query(
			`SELECT r.member_id AS "memberId", -min(r.descriptor <#> f.descriptor) AS "score"
			FROM photo_faces f
			JOIN photo_faces r ON r.assignment = $2 AND r.member_id IS NOT NULL AND r.descriptor IS NOT NULL
				AND r.id <> f.id
			WHERE f.id = $1 AND f.descriptor IS NOT NULL
				AND NOT EXISTS (
					SELECT 1 FROM photo_faces o
					WHERE o.photo_id = f.photo_id AND o.id <> f.id AND o.member_id = r.member_id
				)
			GROUP BY r.member_id
			ORDER BY min(r.descriptor <#> f.descriptor), r.member_id
			LIMIT 2`,
			[face.id, PhotoFaceAssignment.manual],
		);

		const suggestions = pickFaceSuggestions(candidates);
		if (!suggestions.length) return [];

		const members = await this.dataSource
			.getRepository(Member)
			.findBy({ id: In(suggestions.map((suggestion) => suggestion.memberId)) });
		const membersById = new Map(members.map((member) => [member.id, member]));

		return suggestions.flatMap((suggestion) => {
			const member = membersById.get(suggestion.memberId);
			return member ? [{ member, score: suggestion.score }] : [];
		});
	}

	matchAll() {
		if (this.queuedAll) return this.queuedAll;

		const run = this.serialize(() => {
			this.queuedAll = undefined;

			return this.track(FacesMatchTrigger.all, async (progress) => {
				const rows: { photoId: number }[] = await this.dataSource.query(
					`SELECT DISTINCT photo_id AS "photoId" FROM photo_faces
					WHERE descriptor IS NOT NULL AND (assignment IS NULL OR assignment = $1)`,
					[PhotoFaceAssignment.auto],
				);

				const stats = await this.matchPhotos(
					rows.map((row) => row.photoId),
					progress,
				);
				this.logger.log(
					`Matched faces on ${stats.photos} photos: ${stats.assigned} assigned, ${stats.cleared} cleared.`,
				);
				return stats;
			});
		});

		this.queuedAll = run;
		return run;
	}

	matchPhoto(photoId: Photo["id"]) {
		return this.matchPhotos([photoId]);
	}

	onFaceChanged(face: { id: PhotoFace["id"]; photoId: Photo["id"] }, previousMemberId: Member["id"] | null) {
		this.pending.faceIds.add(face.id);
		this.pending.photoIds.add(face.photoId);
		if (previousMemberId !== null) this.pending.memberIds.add(previousMemberId);

		clearTimeout(this.pendingTimer);
		this.pendingTimer = setTimeout(() => this.flushChanges(), FACE_CHANGES_DEBOUNCE_MS);
	}

	private flushChanges() {
		const changes = this.pending;
		this.pending = { faceIds: new Set(), photoIds: new Set(), memberIds: new Set() };

		this.serialize(() =>
			this.track(FacesMatchTrigger.changes, (progress) => this.matchChanges(changes, progress)),
		).catch((err) => this.logger.error(`Matching faces after manual changes failed: ${err}`));
	}

	private async matchChanges(changes: PendingChanges, progress: FacesMatchProgress) {
		const photoIds = new Set(changes.photoIds);
		const settings = await this.getSettings();

		const similar: { photoId: number }[] = await this.dataSource.query(
			`SELECT DISTINCT f.photo_id AS "photoId" FROM photo_faces f
			WHERE f.descriptor IS NOT NULL AND (f.assignment IS NULL OR f.assignment = $1)
			AND EXISTS (
				SELECT 1 FROM photo_faces r
				WHERE r.id = ANY($2) AND r.assignment = $3 AND r.member_id IS NOT NULL AND r.descriptor IS NOT NULL
				AND -(f.descriptor <#> r.descriptor) >= $4
			)`,
			[PhotoFaceAssignment.auto, [...changes.faceIds], PhotoFaceAssignment.manual, settings.threshold],
		);
		similar.forEach((row) => photoIds.add(row.photoId));

		if (changes.memberIds.size) {
			const orphaned: { photoId: number }[] = await this.dataSource.query(
				`SELECT DISTINCT photo_id AS "photoId" FROM photo_faces WHERE assignment = $1 AND member_id = ANY($2)`,
				[PhotoFaceAssignment.auto, [...changes.memberIds]],
			);
			orphaned.forEach((row) => photoIds.add(row.photoId));
		}

		const stats = await this.matchPhotos([...photoIds], progress);
		this.logger.log(
			`Matched faces after ${changes.faceIds.size} manual changes on ${stats.photos} photos: ${stats.assigned} assigned, ${stats.cleared} cleared.`,
		);
		return stats;
	}

	private async track(trigger: FacesMatchTrigger, fn: (progress: FacesMatchProgress) => Promise<FacesMatchStats>) {
		const progress: FacesMatchProgress = {
			trigger,
			startedAt: new Date(),
			photos: 0,
			processed: 0,
			assigned: 0,
			cleared: 0,
		};
		this.current = progress;

		let error: string | null = null;
		try {
			return await fn(progress);
		} catch (err) {
			error = String(err);
			throw err;
		} finally {
			this.current = null;
			this.lastRun = { ...progress, finishedAt: new Date(), error };
		}
	}

	private serialize<T>(fn: () => Promise<T>): Promise<T> {
		const run = this.running.then(fn, fn);
		this.running = run.catch(() => undefined);
		return run;
	}

	private async loadReferences(): Promise<FaceReference[]> {
		const rows: { memberId: number; descriptor: unknown }[] = await this.dataSource.query(
			`SELECT member_id AS "memberId", descriptor::real[] AS "descriptor" FROM photo_faces
			WHERE assignment = $1 AND member_id IS NOT NULL AND descriptor IS NOT NULL`,
			[PhotoFaceAssignment.manual],
		);

		return rows
			.map((row) => ({ memberId: row.memberId, descriptor: toDescriptor(row.descriptor) }))
			.filter((row): row is FaceReference => !!row.descriptor);
	}

	private async matchPhotos(photoIds: number[], progress?: FacesMatchProgress): Promise<FacesMatchStats> {
		const stats: FacesMatchStats = progress ?? { photos: 0, assigned: 0, cleared: 0 };
		stats.photos = photoIds.length;
		if (!photoIds.length) return stats;

		const settings = await this.getSettings();
		const references = prepareReferences(await this.loadReferences());

		for (let i = 0; i < photoIds.length; i += PHOTOS_CHUNK) {
			const rows: MatchFaceRow[] = await this.dataSource.query(
				`SELECT id, photo_id AS "photoId", member_id AS "memberId", assignment,
					match_score AS "matchScore", score AS "detectionScore", descriptor::real[] AS "descriptor",
					candidate_member_id AS "candidateMemberId", candidate_score AS "candidateScore",
					candidate_second_score AS "candidateSecondScore"
				FROM photo_faces WHERE photo_id = ANY($1)`,
				[photoIds.slice(i, i + PHOTOS_CHUNK)],
			);

			const byPhoto = new Map<number, (MatchFaceRow & MatchFace)[]>();
			for (const row of rows) {
				const faces = byPhoto.get(row.photoId) ?? [];
				faces.push({ ...row, descriptor: toDescriptor(row.descriptor) });
				byPhoto.set(row.photoId, faces);
			}

			const updates: FaceMatchUpdate[] = [];

			let yieldedAt = Date.now();

			for (const faces of byPhoto.values()) {
				if (Date.now() - yieldedAt > EVENT_LOOP_SLICE_MS) {
					await setImmediate();
					yieldedAt = Date.now();
				}

				const results = matchPhotoFaces(faces, references, settings);

				for (const face of faces) {
					const result = results.get(face.id);
					if (!result) continue;

					const update = this.getUpdate(face, result.candidate, result.match);
					if (update) updates.push(update);
				}
			}

			const updated = await this.saveMatches(updates);
			for (const update of updates) {
				if (update.change && updated.has(update.id)) stats[update.change]++;
			}

			if (progress) progress.processed = Math.min(photoIds.length, i + PHOTOS_CHUNK);
		}

		return stats;
	}

	private getUpdate(
		face: MatchFaceRow,
		candidate: { memberId: number; score: number; secondScore: number | null } | null,
		match: { memberId: number; score: number } | null,
	): FaceMatchUpdate | null {
		const memberId = match?.memberId ?? null;
		const score = match?.score ?? null;

		let change: FaceMatchUpdate["change"] = null;
		if (face.assignment === PhotoFaceAssignment.auto) {
			if (memberId === null) change = "cleared";
			else if (memberId !== face.memberId) change = "assigned";
		} else if (memberId !== null) {
			change = "assigned";
		}

		const changed =
			change !== null ||
			(memberId !== null && scoreDiffers(face.matchScore, score)) ||
			face.candidateMemberId !== (candidate?.memberId ?? null) ||
			scoreDiffers(face.candidateScore, candidate?.score ?? null) ||
			scoreDiffers(face.candidateSecondScore, candidate?.secondScore ?? null);
		if (!changed) return null;

		return {
			id: face.id,
			memberId,
			score,
			candidateMemberId: candidate?.memberId ?? null,
			candidateScore: candidate?.score ?? null,
			candidateSecondScore: candidate?.secondScore ?? null,
			change,
		};
	}

	private async saveMatches(updates: FaceMatchUpdate[]) {
		if (!updates.length) return new Set<number>();

		const [rows]: [{ id: number }[], number] = await this.dataSource.query(
			`UPDATE photo_faces f SET
				member_id = v.member_id,
				assignment = CASE WHEN v.member_id IS NULL THEN NULL ELSE $5 END,
				match_score = v.match_score,
				candidate_member_id = v.candidate_member_id,
				candidate_score = v.candidate_score,
				candidate_second_score = v.candidate_second_score,
				assigned_at = CASE
					WHEN v.member_id IS NULL THEN NULL
					WHEN f.member_id IS DISTINCT FROM v.member_id OR f.assignment IS NULL THEN now()
					ELSE f.assigned_at
				END,
				assigned_by_id = NULL
			FROM unnest($1::int[], $2::int[], $3::real[], $6::int[], $7::real[], $8::real[])
				AS v(id, member_id, match_score, candidate_member_id, candidate_score, candidate_second_score)
			WHERE f.id = v.id AND (f.assignment IS NULL OR f.assignment = $4)
			RETURNING f.id`,
			[
				updates.map((update) => update.id),
				updates.map((update) => update.memberId),
				updates.map((update) => update.score),
				PhotoFaceAssignment.auto,
				PhotoFaceAssignment.auto,
				updates.map((update) => update.candidateMemberId),
				updates.map((update) => update.candidateScore),
				updates.map((update) => update.candidateSecondScore),
			],
		);

		return new Set(rows.map((row) => row.id));
	}
}

function scoreDiffers(a: number | null, b: number | null) {
	if (a === null || b === null) return a !== b;
	return Math.abs(a - b) > 1e-4;
}
