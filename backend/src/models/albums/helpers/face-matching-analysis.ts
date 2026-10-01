import { FaceMatchSettings, isMatch } from "./face-matching";

export const FACE_MATCH_TARGET_PRECISION = 0.95;
export const FACE_MATCH_MIN_DECISIONS = 50;
export const FACE_MATCH_MIN_WRONG_CANDIDATES = 10;
export const FACE_MATCH_SWEEP = { from: 0.3, to: 0.8, step: 0.01 };

export interface FaceMatchDecision {
	score: number;
	secondScore: number | null;
	detectionScore: number | null;
	correct: boolean;
}

export interface FaceMatchEvaluation {
	threshold: number;
	assigned: number;
	correct: number;
	wrong: number;
	precision: number | null;
	recall: number | null;
}

export interface FaceMatchAnalysis {
	decisions: number;
	correctCandidates: number;
	wrongCandidates: number;
	targetPrecision: number;
	minDecisions: number;
	minWrongCandidates: number;
	enoughData: boolean;
	current: FaceMatchEvaluation;
	proposed: FaceMatchEvaluation | null;
	sweep: FaceMatchEvaluation[];
}

export function evaluateFaceMatching(decisions: FaceMatchDecision[], settings: FaceMatchSettings): FaceMatchEvaluation {
	let correct = 0;
	let wrong = 0;
	let positives = 0;

	for (const decision of decisions) {
		if (decision.correct) positives++;
		if (!isMatch(decision.score, decision.secondScore, decision.detectionScore, settings)) continue;
		if (decision.correct) correct++;
		else wrong++;
	}

	const assigned = correct + wrong;

	return {
		threshold: settings.threshold,
		assigned,
		correct,
		wrong,
		precision: assigned ? correct / assigned : null,
		recall: positives ? correct / positives : null,
	};
}

export function analyzeFaceMatching(decisions: FaceMatchDecision[], settings: FaceMatchSettings): FaceMatchAnalysis {
	const correctCandidates = decisions.filter((decision) => decision.correct).length;
	const wrongCandidates = decisions.length - correctCandidates;

	const steps = Math.round((FACE_MATCH_SWEEP.to - FACE_MATCH_SWEEP.from) / FACE_MATCH_SWEEP.step);
	const sweep = Array.from({ length: steps + 1 }, (_, i) =>
		evaluateFaceMatching(decisions, {
			...settings,
			threshold: Math.round((FACE_MATCH_SWEEP.from + i * FACE_MATCH_SWEEP.step) * 100) / 100,
		}),
	);

	const enoughData =
		decisions.length >= FACE_MATCH_MIN_DECISIONS && wrongCandidates >= FACE_MATCH_MIN_WRONG_CANDIDATES;

	return {
		decisions: decisions.length,
		correctCandidates,
		wrongCandidates,
		targetPrecision: FACE_MATCH_TARGET_PRECISION,
		minDecisions: FACE_MATCH_MIN_DECISIONS,
		minWrongCandidates: FACE_MATCH_MIN_WRONG_CANDIDATES,
		enoughData,
		current: evaluateFaceMatching(decisions, settings),
		proposed: enoughData ? proposeThreshold(sweep) : null,
		sweep,
	};
}

function proposeThreshold(sweep: FaceMatchEvaluation[]) {
	let proposed: FaceMatchEvaluation | null = null;

	for (let i = sweep.length - 1; i >= 0; i--) {
		const row = sweep[i];
		if (row.precision === null) continue;
		if (row.precision < FACE_MATCH_TARGET_PRECISION) break;
		proposed = row;
	}

	return proposed;
}
