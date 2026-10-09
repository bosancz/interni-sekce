import { WORKER_TASK_QUEUE, WorkerTasks } from "../../worker/worker-queues";
import { MatchFacesResult } from "../schema/detected-faces";
import { FaceCandidate, getManualMembers, getMatchableFaces, MatchFace } from "./face-matching";

const VECTOR_HEADER_BYTES = 4;

export interface VectorFaceReference {
	memberId: number;
	descriptor: Buffer;
}

export interface VectorFace {
	id: number;
	descriptor: Buffer;
}

export type VectorPhotoFace = Pick<MatchFace, "id" | "memberId" | "assignment" | "descriptor">;

export interface FaceMatchingJobRunner {
	runJob(
		run: FaceMatchingWorkerRun,
		name: string,
		data: { faces: Buffer[]; excluded: [number, number][] },
	): Promise<MatchFacesResult>;
	deleteKeys(keys: string[]): Promise<void>;
}

export class FaceMatchingWorkerRun {
	private jobs = 0;

	constructor(
		private service: FaceMatchingJobRunner,
		readonly id: string,
		readonly dimensions: number,
		readonly referenceMemberIds: number[],
	) {}

	get referencesKey() {
		return `${WORKER_TASK_QUEUE(WorkerTasks.matchFaces)}:${this.id}:references`;
	}

	findPhotosCandidates(photos: Iterable<VectorPhotoFace[]>) {
		const faces: VectorFace[] = [];
		const excluded: [number, number][] = [];

		for (const photoFaces of photos) {
			const manualMembers = getManualMembers(photoFaces);
			for (const face of getMatchableFaces(photoFaces)) {
				for (const memberId of manualMembers) excluded.push([faces.length, memberId]);
				faces.push({ id: face.id, descriptor: face.descriptor! });
			}
		}

		return this.findCandidates(faces, excluded);
	}

	async findCandidates(faces: VectorFace[], excluded: [number, number][]) {
		const candidates = new Map<number, FaceCandidate | null>(faces.map((face) => [face.id, null]));

		const indexes: number[] = [];
		const sent: number[] = [];
		faces.forEach((face, index) => {
			if (vectorDimensions(face.descriptor) !== this.dimensions) return;
			indexes[index] = sent.length;
			sent.push(index);
		});
		if (!sent.length || !this.referenceMemberIds.length) return candidates;

		const result = await this.service.runJob(this, `${this.id}:faces:${this.jobs++}`, {
			faces: sent.map((index) => faces[index].descriptor),
			excluded: excluded
				.filter(([index]) => indexes[index] !== undefined)
				.map(([index, memberId]) => [indexes[index], memberId]),
		});

		sent.forEach((index, i) => {
			const memberId = result.memberIds[i];
			const score = result.scores[i];
			if (memberId === null || memberId === undefined || score === null || score === undefined) return;
			candidates.set(faces[index].id, { memberId, score, secondScore: result.secondScores[i] ?? null });
		});

		return candidates;
	}

	close() {
		return this.service.deleteKeys([this.referencesKey]);
	}
}

export function vectorDimensions(vector: Buffer) {
	return Math.max(0, (vector.length - VECTOR_HEADER_BYTES) / 4);
}

export function joinVectors(vectors: Buffer[]) {
	return Buffer.concat(vectors.map((vector) => vector.subarray(VECTOR_HEADER_BYTES)));
}
