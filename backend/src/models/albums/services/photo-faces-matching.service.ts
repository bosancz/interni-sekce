import { Injectable, Logger } from "@nestjs/common";
import { setImmediate } from "timers/promises";
import { Member } from "src/models/members/entities/member.entity";
import { DataSource } from "typeorm";
import { PhotoFace } from "../entities/photo-face.entity";
import { Photo } from "../entities/photo.entity";
import {
	FACE_MATCH_THRESHOLD,
	FaceReference,
	FacesMatchStats,
	MatchFace,
	matchPhotoFaces,
	prepareReferences,
	toDescriptor,
} from "../helpers/face-matching";
import { PhotoFaceAssignment } from "../schema/detected-faces";

const PHOTOS_CHUNK = 500;
const FACE_CHANGES_DEBOUNCE_MS = 2000;
const EVENT_LOOP_SLICE_MS = 20;

interface FaceMatchUpdate {
	id: number;
	memberId: number | null;
	score: number | null;
	change: "assigned" | "cleared" | null;
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

	constructor(private dataSource: DataSource) {}

	matchAll() {
		return this.serialize(async () => {
			const rows: { photoId: number }[] = await this.dataSource.query(
				`SELECT DISTINCT photo_id AS "photoId" FROM photo_faces
				WHERE descriptor IS NOT NULL AND (assignment IS NULL OR assignment = $1)`,
				[PhotoFaceAssignment.auto],
			);

			const stats = await this.matchPhotos(rows.map((row) => row.photoId));
			this.logger.log(
				`Matched faces on ${stats.photos} photos: ${stats.assigned} assigned, ${stats.cleared} cleared.`,
			);
			return stats;
		});
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

		this.serialize(() => this.matchChanges(changes)).catch((err) =>
			this.logger.error(`Matching faces after manual changes failed: ${err}`),
		);
	}

	private async matchChanges(changes: PendingChanges) {
		const photoIds = new Set(changes.photoIds);

		const similar: { photoId: number }[] = await this.dataSource.query(
			`SELECT DISTINCT f.photo_id AS "photoId" FROM photo_faces f
			WHERE f.descriptor IS NOT NULL AND (f.assignment IS NULL OR f.assignment = $1)
			AND EXISTS (
				SELECT 1 FROM photo_faces r
				WHERE r.id = ANY($2) AND r.assignment = $3 AND r.member_id IS NOT NULL AND r.descriptor IS NOT NULL
				AND (SELECT sum(a * b) FROM unnest(f.descriptor, r.descriptor) AS t(a, b)) >= $4
			)`,
			[PhotoFaceAssignment.auto, [...changes.faceIds], PhotoFaceAssignment.manual, FACE_MATCH_THRESHOLD],
		);
		similar.forEach((row) => photoIds.add(row.photoId));

		if (changes.memberIds.size) {
			const orphaned: { photoId: number }[] = await this.dataSource.query(
				`SELECT DISTINCT photo_id AS "photoId" FROM photo_faces WHERE assignment = $1 AND member_id = ANY($2)`,
				[PhotoFaceAssignment.auto, [...changes.memberIds]],
			);
			orphaned.forEach((row) => photoIds.add(row.photoId));
		}

		const stats = await this.matchPhotos([...photoIds]);
		this.logger.log(
			`Matched faces after ${changes.faceIds.size} manual changes on ${stats.photos} photos: ${stats.assigned} assigned, ${stats.cleared} cleared.`,
		);
		return stats;
	}

	private serialize<T>(fn: () => Promise<T>): Promise<T> {
		const run = this.running.then(fn, fn);
		this.running = run.catch(() => undefined);
		return run;
	}

	private async loadReferences(): Promise<FaceReference[]> {
		const rows: { memberId: number; descriptor: unknown }[] = await this.dataSource.query(
			`SELECT member_id AS "memberId", descriptor FROM photo_faces
			WHERE assignment = $1 AND member_id IS NOT NULL AND descriptor IS NOT NULL`,
			[PhotoFaceAssignment.manual],
		);

		return rows
			.map((row) => ({ memberId: row.memberId, descriptor: toDescriptor(row.descriptor) }))
			.filter((row): row is FaceReference => !!row.descriptor);
	}

	private async matchPhotos(photoIds: number[]): Promise<FacesMatchStats> {
		const stats: FacesMatchStats = { photos: photoIds.length, assigned: 0, cleared: 0 };
		if (!photoIds.length) return stats;

		const references = prepareReferences(await this.loadReferences());

		for (let i = 0; i < photoIds.length; i += PHOTOS_CHUNK) {
			const rows: (Omit<MatchFace, "descriptor"> & { photoId: number; descriptor: unknown })[] =
				await this.dataSource.query(
					`SELECT id, photo_id AS "photoId", member_id AS "memberId", assignment,
						match_score AS "matchScore", descriptor
					FROM photo_faces WHERE photo_id = ANY($1)`,
					[photoIds.slice(i, i + PHOTOS_CHUNK)],
				);

			const byPhoto = new Map<number, MatchFace[]>();
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

				const matches = matchPhotoFaces(faces, references);

				for (const face of faces) {
					if (!matches.has(face.id)) continue;
					const match = matches.get(face.id) ?? null;

					if (!match) {
						if (face.assignment === PhotoFaceAssignment.auto) {
							updates.push({ id: face.id, memberId: null, score: null, change: "cleared" });
						}
					} else if (face.assignment !== PhotoFaceAssignment.auto || face.memberId !== match.memberId) {
						updates.push({ id: face.id, memberId: match.memberId, score: match.score, change: "assigned" });
					} else if (Math.abs((face.matchScore ?? 0) - match.score) > 1e-4) {
						updates.push({ id: face.id, memberId: match.memberId, score: match.score, change: null });
					}
				}
			}

			const updated = await this.saveMatches(updates);
			for (const update of updates) {
				if (update.change && updated.has(update.id)) stats[update.change]++;
			}
		}

		return stats;
	}

	private async saveMatches(updates: FaceMatchUpdate[]) {
		if (!updates.length) return new Set<number>();

		const [rows]: [{ id: number }[], number] = await this.dataSource.query(
			`UPDATE photo_faces f SET
				member_id = v.member_id,
				assignment = CASE WHEN v.member_id IS NULL THEN NULL ELSE $5 END,
				match_score = v.match_score,
				assigned_at = CASE
					WHEN v.member_id IS NULL THEN NULL
					WHEN f.member_id IS DISTINCT FROM v.member_id OR f.assignment IS NULL THEN now()
					ELSE f.assigned_at
				END,
				assigned_by_id = NULL
			FROM unnest($1::int[], $2::int[], $3::real[]) AS v(id, member_id, match_score)
			WHERE f.id = v.id AND (f.assignment IS NULL OR f.assignment = $4)
			RETURNING f.id`,
			[
				updates.map((update) => update.id),
				updates.map((update) => update.memberId),
				updates.map((update) => update.score),
				PhotoFaceAssignment.auto,
				PhotoFaceAssignment.auto,
			],
		);

		return new Set(rows.map((row) => row.id));
	}
}
