import { FACE_MATCH_SETTINGS } from "./face-matching";
import { analyzeFaceMatching, FaceMatchDecision } from "./face-matching-analysis";

function decision(score: number, correct: boolean, overrides: Partial<FaceMatchDecision> = {}): FaceMatchDecision {
	return { score, secondScore: null, detectionScore: null, correct, ...overrides };
}

describe("analyzeFaceMatching", () => {
	const settings = { ...FACE_MATCH_SETTINGS, threshold: 0.5 };

	it("evaluates the current settings", () => {
		const analysis = analyzeFaceMatching(
			[decision(0.7, true), decision(0.55, false), decision(0.45, true), decision(0.4, false)],
			settings,
		);

		expect(analysis.current).toMatchObject({ threshold: 0.5, assigned: 2, correct: 1, wrong: 1 });
		expect(analysis.current.precision).toBeCloseTo(0.5);
		expect(analysis.current.recall).toBeCloseTo(0.5);
	});

	it("proposes nothing without enough decisions", () => {
		const analysis = analyzeFaceMatching([decision(0.7, true), decision(0.4, false)], settings);

		expect(analysis.enoughData).toBe(false);
		expect(analysis.proposed).toBeNull();
	});

	it("proposes the lowest threshold that keeps the target precision above it", () => {
		const decisions = [
			...Array.from({ length: 60 }, (_, i) => decision(0.6 + (i % 20) / 100, true)),
			...Array.from({ length: 15 }, () => decision(0.45, false)),
			...Array.from({ length: 5 }, () => decision(0.52, false)),
			decision(0.7, false),
		];

		const analysis = analyzeFaceMatching(decisions, settings);

		expect(analysis.enoughData).toBe(true);
		expect(analysis.proposed?.threshold).toBe(0.53);
		expect(analysis.proposed!.precision).toBeGreaterThanOrEqual(analysis.targetPrecision);
	});

	it("respects the margin and the detection score", () => {
		const analysis = analyzeFaceMatching(
			[decision(0.7, true, { secondScore: 0.68 }), decision(0.7, true, { detectionScore: 0.5 })],
			settings,
		);

		expect(analysis.current.assigned).toBe(0);
	});
});
