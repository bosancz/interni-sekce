import { PhotoFaceAssignment } from "../schema/detected-faces";
import {
	FACE_MATCH_MIN_DETECTION_SCORE,
	FACE_MATCH_SETTINGS,
	FACE_MATCH_THRESHOLD,
	FACE_SUGGESTION_MIN_SCORE,
	MatchFace,
	matchPhotoFaces,
	pickFaceSuggestions,
	prepareReferences,
} from "./face-matching";

function vector(...values: number[]) {
	const length = Math.hypot(...values);
	return Float32Array.from(values.map((value) => value / length));
}

function face(id: number, descriptor: Float32Array | null, overrides: Partial<MatchFace> = {}): MatchFace {
	return { id, memberId: null, assignment: null, matchScore: null, detectionScore: null, descriptor, ...overrides };
}

const alice = vector(1, 0, 0);
const bob = vector(0, 1, 0);

describe("matchPhotoFaces", () => {
	const references = prepareReferences([
		{ memberId: 1, descriptor: alice },
		{ memberId: 2, descriptor: bob },
	]);

	it("assigns the most similar member above the threshold", () => {
		const result = matchPhotoFaces([face(10, vector(1, 0.1, 0))], references);

		expect(result.get(10)?.match?.memberId).toBe(1);
		expect(result.get(10)!.match!.score).toBeGreaterThanOrEqual(FACE_MATCH_THRESHOLD);
	});

	it("leaves faces below the threshold unassigned", () => {
		const result = matchPhotoFaces([face(10, vector(0, 0, 1))], references);

		expect(result.get(10)?.match).toBeNull();
	});

	it("leaves ambiguous faces unassigned", () => {
		const result = matchPhotoFaces([face(10, vector(1, 1, 0))], references);

		expect(result.get(10)?.match).toBeNull();
	});

	it("assigns a member at most once per photo", () => {
		const result = matchPhotoFaces([face(10, vector(1, 0.2, 0)), face(11, vector(1, 0.05, 0))], references);

		expect(result.get(11)?.match?.memberId).toBe(1);
		expect(result.get(10)?.match).toBeNull();
	});

	it("skips members already assigned manually on the photo", () => {
		const result = matchPhotoFaces(
			[face(10, vector(1, 0, 0)), face(11, null, { memberId: 1, assignment: PhotoFaceAssignment.manual })],
			references,
		);

		expect(result.get(10)?.match).toBeNull();
		expect(result.has(11)).toBe(false);
	});

	it("never touches rejected faces", () => {
		const result = matchPhotoFaces([face(10, alice, { assignment: PhotoFaceAssignment.manual })], references);

		expect(result.has(10)).toBe(false);
	});

	it("reassigns an auto face when a better reference appears", () => {
		const faces = [face(10, vector(0.2, 1, 0), { memberId: 1, assignment: PhotoFaceAssignment.auto })];

		expect(matchPhotoFaces(faces, references).get(10)?.match?.memberId).toBe(2);
	});

	it("records the best candidate even below the threshold", () => {
		const result = matchPhotoFaces([face(10, vector(0.3, 0.1, 1))], references);

		expect(result.get(10)?.match).toBeNull();
		expect(result.get(10)?.candidate?.memberId).toBe(1);
		expect(result.get(10)!.candidate!.score).toBeLessThan(FACE_MATCH_THRESHOLD);
		expect(result.get(10)!.candidate!.secondScore).toBeCloseTo(0.1 / Math.hypot(0.3, 0.1, 1));
	});

	it("leaves faces with a low detection score unassigned", () => {
		const result = matchPhotoFaces(
			[face(10, vector(1, 0.1, 0), { detectionScore: FACE_MATCH_MIN_DETECTION_SCORE - 0.01 })],
			references,
		);

		expect(result.get(10)?.match).toBeNull();
		expect(result.get(10)?.candidate?.memberId).toBe(1);
	});

	it("respects the configured threshold", () => {
		const faces = [face(10, vector(1, 0.8, 0))];

		expect(
			matchPhotoFaces(faces, references, { ...FACE_MATCH_SETTINGS, threshold: 0.9 }).get(10)?.match,
		).toBeNull();
		expect(
			matchPhotoFaces(faces, references, { ...FACE_MATCH_SETTINGS, threshold: 0.7, margin: 0 }).get(10)?.match
				?.memberId,
		).toBe(1);
	});
});

describe("pickFaceSuggestions", () => {
	it("suggests only the best member when it clearly leads", () => {
		const result = pickFaceSuggestions([
			{ memberId: 2, score: 0.45 },
			{ memberId: 1, score: 0.7 },
		]);

		expect(result.map((item) => item.memberId)).toEqual([1]);
	});

	it("suggests two members when they are close", () => {
		const result = pickFaceSuggestions([
			{ memberId: 2, score: 0.5 },
			{ memberId: 1, score: 0.55 },
			{ memberId: 3, score: 0.52 },
		]);

		expect(result.map((item) => item.memberId)).toEqual([1, 3]);
	});

	it("suggests nobody below the minimum score", () => {
		expect(pickFaceSuggestions([{ memberId: 1, score: FACE_SUGGESTION_MIN_SCORE - 0.01 }])).toEqual([]);
	});

	it("drops a close second below the minimum score", () => {
		const result = pickFaceSuggestions([
			{ memberId: 1, score: FACE_SUGGESTION_MIN_SCORE + 0.02 },
			{ memberId: 2, score: FACE_SUGGESTION_MIN_SCORE - 0.02 },
		]);

		expect(result.map((item) => item.memberId)).toEqual([1]);
	});
});
