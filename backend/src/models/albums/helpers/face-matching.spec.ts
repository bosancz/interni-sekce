import { PhotoFaceAssignment } from "../schema/detected-faces";
import {
	decideFaceMatches,
	FACE_MATCH_MIN_DETECTION_SCORE,
	FACE_MATCH_SETTINGS,
	FACE_SUGGESTION_MIN_SCORE,
	FaceCandidate,
	MatchFace,
	pickFaceSuggestions,
} from "./face-matching";

const DESCRIPTOR = Buffer.alloc(8);

function face(id: number, overrides: Partial<MatchFace> = {}): MatchFace {
	return {
		id,
		memberId: null,
		assignment: null,
		matchScore: null,
		detectionScore: null,
		descriptor: DESCRIPTOR,
		...overrides,
	};
}

function candidates(entries: [number, number, number, number | null][]) {
	return new Map<number, FaceCandidate | null>(
		entries.map(([faceId, memberId, score, secondScore]) => [faceId, { memberId, score, secondScore }]),
	);
}

describe("decideFaceMatches", () => {
	it("assigns the candidate above the threshold with a clear lead", () => {
		const result = decideFaceMatches([face(10)], candidates([[10, 1, 0.7, 0.2]]));

		expect(result.get(10)?.match).toEqual({ memberId: 1, score: 0.7 });
	});

	it("leaves faces below the threshold unassigned but keeps the candidate", () => {
		const result = decideFaceMatches([face(10)], candidates([[10, 1, 0.4, 0.1]]));

		expect(result.get(10)?.match).toBeNull();
		expect(result.get(10)?.candidate).toEqual({ memberId: 1, score: 0.4, secondScore: 0.1 });
	});

	it("leaves ambiguous faces unassigned", () => {
		const result = decideFaceMatches([face(10)], candidates([[10, 1, 0.7, 0.68]]));

		expect(result.get(10)?.match).toBeNull();
	});

	it("assigns a member at most once per photo, to the better face", () => {
		const result = decideFaceMatches(
			[face(10), face(11)],
			candidates([
				[10, 1, 0.6, 0.1],
				[11, 1, 0.8, 0.1],
			]),
		);

		expect(result.get(11)?.match?.memberId).toBe(1);
		expect(result.get(10)?.match).toBeNull();
	});

	it("never touches manual faces and faces without a descriptor", () => {
		const result = decideFaceMatches(
			[face(10, { assignment: PhotoFaceAssignment.manual }), face(11, { descriptor: null })],
			candidates([
				[10, 1, 0.9, null],
				[11, 2, 0.9, null],
			]),
		);

		expect(result.size).toBe(0);
	});

	it("clears an auto face without a candidate", () => {
		const result = decideFaceMatches([face(10, { memberId: 1, assignment: PhotoFaceAssignment.auto })], new Map());

		expect(result.get(10)).toEqual({ candidate: null, match: null });
	});

	it("leaves faces with a low detection score unassigned", () => {
		const result = decideFaceMatches(
			[face(10, { detectionScore: FACE_MATCH_MIN_DETECTION_SCORE - 0.01 })],
			candidates([[10, 1, 0.9, 0.1]]),
		);

		expect(result.get(10)?.match).toBeNull();
	});

	it("respects the configured threshold", () => {
		const faces = [face(10)];
		const found = candidates([[10, 1, 0.8, 0.76]]);

		expect(decideFaceMatches(faces, found, { ...FACE_MATCH_SETTINGS, threshold: 0.9 }).get(10)?.match).toBeNull();
		expect(
			decideFaceMatches(faces, found, { ...FACE_MATCH_SETTINGS, threshold: 0.7, margin: 0 }).get(10)?.match
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
