import { stat } from "node:fs/promises";
import type { GateEntry } from "../schemas/gate.js";
import type { SystemEvent } from "../schemas/events.js";
import type { ScorecardDimension, ScorecardEntry } from "../schemas/metrics.js";

// --- Types ---

export interface SpeckitAnalysisResult {
	severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
	finding: string;
	location?: string;
}

export interface SpeckitPhaseCompletion {
	phase: "specify" | "clarify" | "plan" | "tasks" | "implement";
	featureName: string;
	completedAt: string; // ISO 8601
	qualityScore?: number; // 0-100
}

export interface SpeckitQualityScores {
	codeQuality?: number; // 0-100
	productQuality?: number; // 0-100
}

// --- Functions ---

/**
 * Map a speckit analysis finding to a GateEntry.
 * CRITICAL/HIGH → fail, MEDIUM → blocked, LOW → pass.
 */
export function mapAnalysisToGateEntry(
	result: SpeckitAnalysisResult,
	sourceItemId: string,
): GateEntry {
	const resultMap: Record<SpeckitAnalysisResult["severity"], GateEntry["result"]> = {
		CRITICAL: "fail",
		HIGH: "fail",
		MEDIUM: "blocked",
		LOW: "pass",
	};

	return {
		name: `speckit-analysis: ${result.finding}`,
		date: new Date().toISOString(),
		executedBy: "agent",
		result: resultMap[result.severity],
		reason: result.location
			? `${result.finding} (at ${result.location})`
			: result.finding,
		sourceItemId,
		sourceSystem: "speckit",
		context: "work",
		role: "maintainer",
	};
}

/**
 * Track a speckit phase completion as a SystemEvent.
 */
export function trackPhaseCompletion(phase: SpeckitPhaseCompletion): SystemEvent {
	return {
		id: crypto.randomUUID(),
		source: "speckit",
		context: "work",
		role: "maintainer",
		eventType: `speckit.${phase.phase}.completed`,
		timestamp: phase.completedAt,
		metadata: {
			featureName: phase.featureName,
			...(phase.qualityScore !== undefined ? { qualityScore: phase.qualityScore } : {}),
		},
	};
}

/**
 * Convert a 0-100 quality score to a 1-5 scorecard score.
 * 0-20 → 1, 21-40 → 2, 41-60 → 3, 61-80 → 4, 81-100 → 5.
 */
function qualityToScore(value: number): number {
	if (value <= 20) return 1;
	if (value <= 40) return 2;
	if (value <= 60) return 3;
	if (value <= 80) return 4;
	return 5;
}

/**
 * Map speckit quality scores to partial ScorecardEntry dimensions.
 */
export function mapQualityToScorecard(
	scores: SpeckitQualityScores,
	period: string,
): Partial<ScorecardEntry> {
	const dimensions: Record<string, ScorecardDimension> = {};

	if (scores.codeQuality !== undefined) {
		dimensions["codeQuality"] = {
			score: qualityToScore(scores.codeQuality),
			evidence: `Speckit code quality: ${scores.codeQuality}/100`,
			trend: "stable",
		};
	}

	if (scores.productQuality !== undefined) {
		dimensions["productQuality"] = {
			score: qualityToScore(scores.productQuality),
			evidence: `Speckit product quality: ${scores.productQuality}/100`,
			trend: "stable",
		};
	}

	return {
		date: new Date().toISOString(),
		context: "work",
		dimensions,
		notes: `Speckit quality scores for period ${period}`,
	};
}

/**
 * Detect spec drift: returns true if spec file is older than implementation file.
 * Stub implementation using file modification times.
 */
export async function detectSpecDrift(
	specPath: string,
	implementationPath: string,
): Promise<boolean> {
	const [specStat, implStat] = await Promise.all([
		stat(specPath),
		stat(implementationPath),
	]);

	return specStat.mtimeMs < implStat.mtimeMs;
}
