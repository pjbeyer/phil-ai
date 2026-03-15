import { calculateDurations, getAverageDuration } from "../metrics/duration.js";
import { calculateVelocity } from "../metrics/velocity.js";
import { MetricsStore } from "../metrics/store.js";
import { GateLog } from "../gates/log.js";
import { ingestAll } from "../ingestion/all.js";
import type { DateRange } from "../ingestion/types.js";
import { PatternEngine } from "../patterns/engine.js";
import { sweepAll } from "../drift/sweep.js";
import type { SystemEvent } from "../schemas/events.js";
import { ScorecardEntrySchema, type ScorecardEntry } from "../schemas/metrics.js";

function toPeriodRange(period: string): DateRange | undefined {
	const match = /^(\d{4})-(\d{2})$/.exec(period);
	if (match === null) {
		return undefined;
	}

	const yearToken = match[1];
	const monthToken = match[2];
	if (yearToken === undefined || monthToken === undefined) {
		return undefined;
	}

	const year = Number.parseInt(yearToken, 10);
	const month = Number.parseInt(monthToken, 10);
	if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
		return undefined;
	}

	const from = new Date(Date.UTC(year, month - 1, 1));
	const to = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
	return { from, to };
}

function safeNumber(value: number): number {
	return Number.isFinite(value) ? value : 0;
}

function safeRate(value: number): number {
	if (!Number.isFinite(value)) {
		return 0;
	}
	if (value <= 0) {
		return 0;
	}
	if (value >= 1) {
		return 1;
	}
	return value;
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

function scoreThroughput(completedItems: number): number {
	if (completedItems <= 0) return 1;
	if (completedItems <= 2) return 2;
	if (completedItems <= 5) return 3;
	if (completedItems <= 8) return 4;
	return 5;
}

function scorePatternHealth(totalPatterns: number): number {
	if (totalPatterns >= 8) return 1;
	if (totalPatterns >= 6) return 2;
	if (totalPatterns >= 4) return 3;
	if (totalPatterns >= 2) return 4;
	return 5;
}

function scoreDriftHealth(totalIssues: number): number {
	if (totalIssues >= 8) return 1;
	if (totalIssues >= 6) return 2;
	if (totalIssues >= 4) return 3;
	if (totalIssues >= 2) return 4;
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

function countCompletedItems(events: SystemEvent[]): number {
	return events.filter((event) => event.eventType === "work_finished").length;
}

export async function generateScorecard(period: string): Promise<ScorecardEntry> {
	const range = toPeriodRange(period);
	const [snapshots, events, driftReport] = await Promise.all([
		new MetricsStore().queryMetrics(),
		ingestAll(range === undefined ? undefined : { dateRange: range }),
		sweepAll(),
	]);

	const snapshot = snapshots.find((entry) => entry.period === period) ?? null;
	const gateLog = new GateLog();
	const gatePassRate = safeRate(
		snapshot?.gatePassRate ?? (await gateLog.getPassRate(range)),
	);
	const durations = calculateDurations(events);
	const avgDuration = safeNumber(snapshot?.avgDuration ?? getAverageDuration(durations));
	const velocity = safeNumber(
		snapshot?.velocity ?? calculateVelocity(events, { weeks: 4 }),
	);
	const completedItems = Math.max(0, snapshot?.completedItems ?? countCompletedItems(events));

	const patternReport = await new PatternEngine().analyze({
		gateEntries: await gateLog.getEntries(range),
		metricsSnapshots: snapshots,
		events,
		durations,
	});

	const consistency = scoreConsistency(events);
	const dimensions: ScorecardEntry["dimensions"] = {
		velocity: {
			score: scoreVelocity(velocity),
			evidence: `${velocity.toFixed(2)} completed items per week`,
			trend: "stable",
		},
		quality: {
			score: scoreQuality(gatePassRate),
			evidence: `${(gatePassRate * 100).toFixed(1)}% gate pass rate`,
			trend: "stable",
		},
		consistency: {
			score: consistency.score,
			evidence: consistency.evidence,
			trend: "stable",
		},
		throughput: {
			score: scoreThroughput(completedItems),
			evidence: `${completedItems} completed work items in period`,
			trend: "stable",
		},
		patternHealth: {
			score: scorePatternHealth(patternReport.totalPatterns),
			evidence: `${patternReport.totalPatterns} patterns detected`,
			trend: "stable",
		},
		driftHealth: {
			score: scoreDriftHealth(driftReport.totalIssues),
			evidence: `${driftReport.totalIssues} drift issues from sweep`,
			trend: "stable",
		},
	};

	const average =
		Object.values(dimensions).reduce((sum, dimension) => sum + dimension.score, 0) /
		Object.values(dimensions).length;

	const result: ScorecardEntry = {
		date: new Date().toISOString(),
		context: snapshot?.context ?? "aggregate",
		dimensions,
		average,
		notes: `Period ${period}; average duration ${avgDuration.toFixed(2)} hours`,
	};

	return ScorecardEntrySchema.parse(result);
}
