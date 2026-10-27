import { FaceMatchSettings, isMatch } from "./face-matching";

export interface FaceMatchAnalysisSettings {
	targetPrecision: number;
	minDecisions: number;
	minWrongCandidates: number;
	sweep: { from: number; to: number; step: number };
}

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

export function analyzeFaceMatching(
	decisions: FaceMatchDecision[],
	settings: FaceMatchSettings,
	analysis: FaceMatchAnalysisSettings,
): FaceMatchAnalysis {
	const correctCandidates = decisions.filter((decision) => decision.correct).length;
	const wrongCandidates = decisions.length - correctCandidates;

	const steps = Math.round((analysis.sweep.to - analysis.sweep.from) / analysis.sweep.step);
	const sweep = Array.from({ length: steps + 1 }, (_, i) =>
		evaluateFaceMatching(decisions, {
			...settings,
			threshold: Math.round((analysis.sweep.from + i * analysis.sweep.step) * 100) / 100,
		}),
	);

	const enoughData = decisions.length >= analysis.minDecisions && wrongCandidates >= analysis.minWrongCandidates;

	return {
		decisions: decisions.length,
		correctCandidates,
		wrongCandidates,
		targetPrecision: analysis.targetPrecision,
		minDecisions: analysis.minDecisions,
		minWrongCandidates: analysis.minWrongCandidates,
		enoughData,
		current: evaluateFaceMatching(decisions, settings),
		proposed: enoughData ? proposeThreshold(sweep, analysis.targetPrecision) : null,
		sweep,
	};
}

function proposeThreshold(sweep: FaceMatchEvaluation[], targetPrecision: number) {
	let proposed: FaceMatchEvaluation | null = null;

	for (let i = sweep.length - 1; i >= 0; i--) {
		const row = sweep[i];
		if (row.precision === null) continue;
		if (row.precision < targetPrecision) break;
		proposed = row;
	}

	return proposed;
}
