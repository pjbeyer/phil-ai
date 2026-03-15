import type { SystemEvent } from "../schemas/events.js";
import {
	ScorecardEntrySchema,
	type ScorecardDimension,
	type ScorecardEntry,
} from "../schemas/metrics.js";

interface ScorecardInput {
	events: SystemEvent[];
	gatePassRate: number;
	velocity: number;
	avgDuration: number;
}

function scoreVelocity(value: number): number {
	if (value < 1) return 1;
	if (value < 2) return 2;
	if (value < 4) return 3;
	if (value < 6) return 4;
	return 5;
}

function scoreQuality(gatePassRate: number): number {
	if (gatePassRate < 0.6) return 1;
	if (gatePassRate < 0.7) return 2;
	if (gatePassRate < 0.8) return 3;
	if (gatePassRate < 0.9) return 4;
	return 5;
}

function scoreConsistency(events: SystemEvent[]): { score: number; evidence: string } {
	const timestamps = events
		.map((event) => new Date(event.timestamp).getTime())
		.filter((ms) => Number.isFinite(ms))
		.sort((a, b) => a - b);

	if (timestamps.length < 2) {
		return {
			score: 1,
			evidence: "Insufficient event history for cadence analysis",
		};
	}

	const intervalsInDays: number[] = [];
	for (let index = 1; index < timestamps.length; index += 1) {
		const current = timestamps[index];
		const previous = timestamps[index - 1];
		if (current === undefined || previous === undefined) {
			continue;
		}

		const intervalMs = current - previous;
		if (intervalMs > 0) {
			intervalsInDays.push(intervalMs / 86_400_000);
		}
	}

	if (intervalsInDays.length === 0) {
		return {
			score: 1,
			evidence: "No spacing between events to evaluate regularity",
		};
	}

	const mean = intervalsInDays.reduce((sum, value) => sum + value, 0) / intervalsInDays.length;
	const variance =
		intervalsInDays.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
		intervalsInDays.length;
	const stdDev = Math.sqrt(variance);
	const coefficientOfVariation = mean > 0 ? stdDev / mean : Number.POSITIVE_INFINITY;

	let score = 1;
	if (coefficientOfVariation <= 0.25) score = 5;
	else if (coefficientOfVariation <= 0.5) score = 4;
	else if (coefficientOfVariation <= 0.75) score = 3;
	else if (coefficientOfVariation <= 1) score = 2;

	return {
		score,
		evidence: `Cadence variation ${coefficientOfVariation.toFixed(2)} across ${intervalsInDays.length} intervals`,
	};
}

export function computeScorecard(data: ScorecardInput, period: string): ScorecardEntry {
	const velocityDimension: ScorecardDimension = {
		score: scoreVelocity(data.velocity),
		evidence: `${data.velocity.toFixed(2)} completed items per week`,
		trend: "stable",
	};

	const qualityDimension: ScorecardDimension = {
		score: scoreQuality(data.gatePassRate),
		evidence: `${(data.gatePassRate * 100).toFixed(1)}% gate pass rate`,
		trend: "stable",
	};

	const consistency = scoreConsistency(data.events);
	const consistencyDimension: ScorecardDimension = {
		score: consistency.score,
		evidence: consistency.evidence,
		trend: "stable",
	};

	const dimensions: ScorecardEntry["dimensions"] = {
		velocity: velocityDimension,
		quality: qualityDimension,
		consistency: consistencyDimension,
	};

	const average =
		Object.values(dimensions).reduce((sum, dimension) => sum + dimension.score, 0) /
		Object.values(dimensions).length;

	const scorecard: ScorecardEntry = {
		date: new Date().toISOString(),
		context: "aggregate",
		dimensions,
		average,
		notes: `Period ${period}; average duration ${data.avgDuration.toFixed(2)} hours`,
	};

	return ScorecardEntrySchema.parse(scorecard);
}
