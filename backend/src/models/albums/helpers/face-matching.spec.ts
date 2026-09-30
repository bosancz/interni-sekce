import { PhotoFaceAssignment } from "../schema/detected-faces";
import { FACE_MATCH_THRESHOLD, MatchFace, matchPhotoFaces, prepareReferences } from "./face-matching";

function vector(...values: number[]) {
	const length = Math.hypot(...values);
	return Float32Array.from(values.map((value) => value / length));
}

function face(id: number, descriptor: Float32Array | null, overrides: Partial<MatchFace> = {}): MatchFace {
	return { id, memberId: null, assignment: null, matchScore: null, descriptor, ...overrides };
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

		expect(result.get(10)?.memberId).toBe(1);
		expect(result.get(10)!.score).toBeGreaterThanOrEqual(FACE_MATCH_THRESHOLD);
	});

	it("leaves faces below the threshold unassigned", () => {
		const result = matchPhotoFaces([face(10, vector(0, 0, 1))], references);

		expect(result.get(10)).toBeNull();
	});

	it("leaves ambiguous faces unassigned", () => {
		const result = matchPhotoFaces([face(10, vector(1, 1, 0))], references);

		expect(result.get(10)).toBeNull();
	});

	it("assigns a member at most once per photo", () => {
		const result = matchPhotoFaces([face(10, vector(1, 0.2, 0)), face(11, vector(1, 0.05, 0))], references);

		expect(result.get(11)?.memberId).toBe(1);
		expect(result.get(10)).toBeNull();
	});

	it("skips members already assigned manually on the photo", () => {
		const result = matchPhotoFaces(
			[face(10, vector(1, 0, 0)), face(11, null, { memberId: 1, assignment: PhotoFaceAssignment.manual })],
			references,
		);

		expect(result.get(10)).toBeNull();
		expect(result.has(11)).toBe(false);
	});

	it("never touches rejected faces", () => {
		const result = matchPhotoFaces([face(10, alice, { assignment: PhotoFaceAssignment.manual })], references);

		expect(result.has(10)).toBe(false);
	});

	it("reassigns an auto face when a better reference appears", () => {
		const faces = [face(10, vector(0.2, 1, 0), { memberId: 1, assignment: PhotoFaceAssignment.auto })];

		expect(matchPhotoFaces(faces, references).get(10)?.memberId).toBe(2);
	});
});
