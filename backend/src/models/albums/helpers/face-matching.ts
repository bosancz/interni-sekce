import { PhotoFaceAssignment } from "../schema/detected-faces";

export const FACE_DESCRIPTOR_DIMENSION = 128;

export const FACE_MATCH_THRESHOLD = 0.5;
export const FACE_MATCH_MARGIN = 0.05;
export const FACE_MATCH_MIN_DETECTION_SCORE = 0.9;

export const FACE_SUGGESTION_MIN_SCORE = 0.36;
export const FACE_SUGGESTION_MARGIN = 0.1;

export interface FaceMatchSettings {
	threshold: number;
	margin: number;
	minDetectionScore: number;
}

export const FACE_MATCH_SETTINGS: FaceMatchSettings = {
	threshold: FACE_MATCH_THRESHOLD,
	margin: FACE_MATCH_MARGIN,
	minDetectionScore: FACE_MATCH_MIN_DETECTION_SCORE,
};

export interface FaceReference {
	memberId: number;
	descriptor: Float32Array;
}

export interface FaceReferences {
	members: number[];
	memberIndexes: Int32Array;
	descriptors: Float32Array;
	dimensions: number;
	count: number;
}

export interface MatchFace {
	id: number;
	memberId: number | null;
	assignment: PhotoFaceAssignment | null;
	matchScore: number | null;
	detectionScore: number | null;
	descriptor: Float32Array | null;
}

export interface FaceMatch {
	memberId: number;
	score: number;
}

export interface FaceCandidate {
	memberId: number;
	score: number;
	secondScore: number | null;
}

export interface FaceMatchResult {
	candidate: FaceCandidate | null;
	match: FaceMatch | null;
}

export interface FacesMatchStats {
	photos: number;
	assigned: number;
	cleared: number;
}

export function toDescriptor(value: unknown): Float32Array | null {
	if (!Array.isArray(value) || !value.length) return null;
	return Float32Array.from(value.map(Number));
}

export function prepareReferences(references: FaceReference[]): FaceReferences {
	const dimensions = references[0]?.descriptor.length ?? 0;
	const valid = references.filter((reference) => reference.descriptor.length === dimensions);

	const members = [...new Set(valid.map((reference) => reference.memberId))];
	const indexes = new Map(members.map((memberId, index) => [memberId, index]));

	const memberIndexes = new Int32Array(valid.length);
	const descriptors = new Float32Array(valid.length * dimensions);

	valid.forEach((reference, i) => {
		memberIndexes[i] = indexes.get(reference.memberId)!;
		descriptors.set(reference.descriptor, i * dimensions);
	});

	return { members, memberIndexes, descriptors, dimensions, count: valid.length };
}

export function matchPhotoFaces(
	faces: MatchFace[],
	references: FaceReferences,
	settings: FaceMatchSettings = FACE_MATCH_SETTINGS,
): Map<number, FaceMatchResult> {
	const { members, memberIndexes, descriptors, dimensions, count } = references;

	const manualMembers = new Set(
		faces.filter((face) => face.assignment === PhotoFaceAssignment.manual && face.memberId).map((f) => f.memberId!),
	);
	const excluded = new Uint8Array(members.length);
	members.forEach((memberId, index) => (excluded[index] = manualMembers.has(memberId) ? 1 : 0));

	const candidates = faces.filter(
		(face) => face.descriptor && face.assignment !== PhotoFaceAssignment.manual,
	) as (MatchFace & { descriptor: Float32Array })[];

	const scores = new Float64Array(members.length);
	const candidatesByFace = new Map<number, FaceCandidate | null>(candidates.map((face) => [face.id, null]));
	const proposals: { faceId: number; memberId: number; score: number }[] = [];

	for (const face of candidates) {
		if (face.descriptor.length !== dimensions) continue;

		scores.fill(-Infinity);
		const descriptor = face.descriptor;

		for (let r = 0; r < count; r++) {
			const member = memberIndexes[r];
			if (excluded[member]) continue;

			const offset = r * dimensions;
			let score = 0;
			for (let i = 0; i < dimensions; i++) score += descriptor[i] * descriptors[offset + i];

			if (score > scores[member]) scores[member] = score;
		}

		let best = -1;
		let bestScore = -Infinity;
		let secondScore = -Infinity;
		for (let m = 0; m < scores.length; m++) {
			if (scores[m] > bestScore) {
				secondScore = bestScore;
				bestScore = scores[m];
				best = m;
			} else if (scores[m] > secondScore) {
				secondScore = scores[m];
			}
		}

		if (best < 0) continue;

		candidatesByFace.set(face.id, {
			memberId: members[best],
			score: bestScore,
			secondScore: secondScore === -Infinity ? null : secondScore,
		});

		if (!isMatch(bestScore, secondScore, face.detectionScore, settings)) continue;

		proposals.push({ faceId: face.id, memberId: members[best], score: bestScore });
	}

	const result = new Map<number, FaceMatchResult>(
		candidates.map((face) => [face.id, { candidate: candidatesByFace.get(face.id) ?? null, match: null }]),
	);
	const usedMembers = new Set<number>();

	for (const proposal of proposals.sort((a, b) => b.score - a.score)) {
		if (usedMembers.has(proposal.memberId)) continue;
		usedMembers.add(proposal.memberId);
		result.get(proposal.faceId)!.match = { memberId: proposal.memberId, score: proposal.score };
	}

	return result;
}

export function isMatch(
	score: number,
	secondScore: number | null,
	detectionScore: number | null,
	settings: FaceMatchSettings = FACE_MATCH_SETTINGS,
) {
	if (score < settings.threshold) return false;
	if (secondScore !== null && score - secondScore < settings.margin) return false;
	if (detectionScore !== null && detectionScore < settings.minDetectionScore) return false;
	return true;
}

export function pickFaceSuggestions(candidates: FaceMatch[]): FaceMatch[] {
	const [first, second] = [...candidates]
		.filter((candidate) => candidate.score >= FACE_SUGGESTION_MIN_SCORE)
		.sort((a, b) => b.score - a.score);

	if (!first) return [];
	if (!second || first.score - second.score >= FACE_SUGGESTION_MARGIN) return [first];
	return [first, second];
}
