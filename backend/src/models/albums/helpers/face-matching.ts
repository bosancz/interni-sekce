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

export interface MatchFace {
	id: number;
	memberId: number | null;
	assignment: PhotoFaceAssignment | null;
	matchScore: number | null;
	detectionScore: number | null;
	descriptor: Buffer | null;
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

export function getMatchableFaces<T extends Pick<MatchFace, "assignment" | "descriptor">>(faces: T[]): T[] {
	return faces.filter((face) => face.descriptor && face.assignment !== PhotoFaceAssignment.manual);
}

export function getManualMembers(faces: Pick<MatchFace, "memberId" | "assignment">[]): Set<number> {
	return new Set(
		faces.filter((face) => face.assignment === PhotoFaceAssignment.manual && face.memberId).map((f) => f.memberId!),
	);
}

export function decideFaceMatches(
	faces: Pick<MatchFace, "id" | "assignment" | "detectionScore" | "descriptor">[],
	candidatesByFace: Map<number, FaceCandidate | null>,
	settings: FaceMatchSettings = FACE_MATCH_SETTINGS,
): Map<number, FaceMatchResult> {
	const candidates = getMatchableFaces(faces);
	const proposals: { faceId: number; memberId: number; score: number }[] = [];

	for (const face of candidates) {
		const candidate = candidatesByFace.get(face.id);
		if (!candidate) continue;
		if (!isMatch(candidate.score, candidate.secondScore, face.detectionScore, settings)) continue;
		proposals.push({ faceId: face.id, memberId: candidate.memberId, score: candidate.score });
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
