import type { DurationResult } from "../../metrics/types.js";
import type { PatternEntry } from "../types.js";

function getStandardDeviation(values: number[], mean: number): number {
	if (values.length === 0) {
		return 0;
	}

	const variance =
		values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;

	if (!Number.isFinite(variance) || variance <= 0) {
		return 0;
	}

	const stdDev = Math.sqrt(variance);
	return Number.isFinite(stdDev) ? stdDev : 0;
}

export function detectDurationOutliers(durations: DurationResult[]): PatternEntry[] {
	const completedDurations = durations
		.filter((result) => result.durationHours !== null)
		.map((result) => ({ ...result, durationHours: result.durationHours as number }))
		.filter((result) => Number.isFinite(result.durationHours) && result.durationHours >= 0);

	if (completedDurations.length < 2) {
		return [];
	}

	const durationValues = completedDurations.map((result) => result.durationHours);
	const mean = durationValues.reduce((sum, value) => sum + value, 0) / durationValues.length;

	if (!Number.isFinite(mean)) {
		return [];
	}

	const stdDev = getStandardDeviation(durationValues, mean);
	if (!Number.isFinite(stdDev) || stdDev === 0) {
		return [];
	}

	const threshold = mean + stdDev * 2;
	if (!Number.isFinite(threshold)) {
		return [];
	}

	const nowIso = new Date().toISOString();

	return completedDurations
		.filter((result) => result.durationHours > threshold)
		.map((result) => ({
			type: "duration-outlier",
			severity: "warning",
			description: `Issue ${result.issueId} exceeded expected completion duration.`,
			evidence: `Duration ${result.durationHours.toFixed(2)}h vs mean ${mean.toFixed(2)}h and threshold ${threshold.toFixed(2)}h.`,
			suggestedAction:
				"Inspect scope changes and dependencies on this item to reduce future long-tail work.",
			detectedAt: nowIso,
		}));
}
