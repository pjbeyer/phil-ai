import type { GateEntry } from "../schemas/gate.js";
import type { MetricsSnapshot } from "../schemas/metrics.js";
import type { SystemEvent } from "../schemas/events.js";
import { GateLog } from "../gates/log.js";
import { ingestAll } from "../ingestion/all.js";
import type { DateRange } from "../ingestion/types.js";
import {
	calculateDurations,
	calculateVelocity,
	computeScorecard,
	getAverageDuration,
	MetricsStore,
} from "../metrics/index.js";
import { pruneStale } from "./prune.js";
import type { PDCAMiss, PDCAReview, PDCASuggestion, PDCAWin } from "./types.js";

interface ReviewDataInput {
	events?: SystemEvent[];
	gateEntries?: GateEntry[];
	snapshots?: MetricsSnapshot[];
}

function parsePeriodDateRange(period: string): DateRange | undefined {
	const monthMatch = /^(\d{4})-(\d{2})$/.exec(period);
	if (monthMatch !== null) {
		const year = Number(monthMatch[1]);
		const month = Number(monthMatch[2]);
		if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
			return undefined;
		}

		const from = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
		const to = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
		return { from, to };
	}

	const dayMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(period);
	if (dayMatch !== null) {
		const year = Number(dayMatch[1]);
		const month = Number(dayMatch[2]);
		const day = Number(dayMatch[3]);
		if (
			!Number.isFinite(year) ||
			!Number.isFinite(month) ||
			!Number.isFinite(day)
		) {
			return undefined;
		}

		const from = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
		const to = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
		return { from, to };
	}

	return undefined;
}

function toPercent(value: number): string {
	return `${(value * 100).toFixed(1)}%`;
}

function collectWins(
	velocity: number,
	gateEntries: GateEntry[],
	gatePassRate: number,
	snapshots: MetricsSnapshot[],
): PDCAWin[] {
	const wins: PDCAWin[] = [];
	const passedGates = gateEntries.filter((entry) => entry.result === "pass").length;

	if (velocity > 0) {
		wins.push({
			dimension: "velocity",
			description: "Sustained completion throughput in the review window",
			evidence: `${velocity.toFixed(2)} completed items/week`,
		});
	}

	if (passedGates > 0) {
		wins.push({
			dimension: "quality",
			description: "Gates were passing consistently",
			evidence: `${passedGates} passing gates (${toPercent(gatePassRate)} pass rate)`,
		});
	}

	const snapshotWithMostCompletions = snapshots.reduce<MetricsSnapshot | null>((currentTop, item) => {
		if (currentTop === null || item.completedItems > currentTop.completedItems) {
			return item;
		}
		return currentTop;
	}, null);

	if (snapshotWithMostCompletions !== null && snapshotWithMostCompletions.completedItems > 0) {
		wins.push({
			dimension: "delivery",
			description: "Peak completion output captured in metrics snapshots",
			evidence: `${snapshotWithMostCompletions.completedItems} completed items in ${snapshotWithMostCompletions.period}`,
		});
	}

	return wins;
}

function collectMisses(
	gateEntries: GateEntry[],
	snapshots: MetricsSnapshot[],
	staleCount: number,
): PDCAMiss[] {
	const misses: PDCAMiss[] = [];
	const failedGates = gateEntries.filter((entry) => entry.result === "fail").length;

	if (failedGates > 0) {
		misses.push({
			dimension: "quality",
			description: "Gate failures interrupted delivery flow",
			evidence: `${failedGates} failed gates in the selected period`,
		});
	}

	const sortedSnapshots = [...snapshots].sort((a, b) => a.period.localeCompare(b.period));
	const first = sortedSnapshots[0];
	const last = sortedSnapshots[sortedSnapshots.length - 1];
	if (first !== undefined && last !== undefined && last.velocity < first.velocity) {
		misses.push({
			dimension: "velocity",
			description: "Delivery pace declined across the measured period",
			evidence: `Velocity dropped from ${first.velocity.toFixed(2)} to ${last.velocity.toFixed(2)}`,
		});
	}

	if (staleCount > 0) {
		misses.push({
			dimension: "freshness",
			description: "Telemetry contains stale verification artifacts",
			evidence: `${staleCount} stale gate/snapshot artifacts older than 7 days`,
		});
	}

	return misses;
}

function buildSuggestion(misses: PDCAMiss[], wins: PDCAWin[]): PDCASuggestion {
	if (misses.some((miss) => miss.dimension === "quality")) {
		return {
			action: "Run a weekly failed-gate triage and owner assignment",
			rationale: "Resolving repeated gate failures will improve reliability and flow.",
			priority: "high",
		};
	}

	if (misses.some((miss) => miss.dimension === "velocity")) {
		return {
			action: "Break larger work items into smaller deliverable slices",
			rationale: "Smaller slices reduce cycle time and help recover throughput.",
			priority: "medium",
		};
	}

	if (wins.some((win) => win.dimension === "quality")) {
		return {
			action: "Codify current gate pass patterns into a repeatable checklist",
			rationale: "Standardizing what is working keeps quality outcomes stable.",
			priority: "medium",
		};
	}

	return {
		action: "Capture one explicit process improvement experiment for next month",
		rationale: "A focused experiment ensures continuous improvement even with sparse data.",
		priority: "low",
	};
}

export async function generateReview(
	period: string,
	data?: ReviewDataInput,
): Promise<PDCAReview> {
	const dateRange = parsePeriodDateRange(period);

	const [events, gateEntries, snapshots, staleResult] = await Promise.all([
		data?.events ?? ingestAll(dateRange === undefined ? undefined : { dateRange }),
		data?.gateEntries ?? new GateLog().getEntries(dateRange),
		data?.snapshots ?? new MetricsStore().queryMetrics(dateRange),
		pruneStale(7),
	]);

	const velocity = calculateVelocity(events, { weeks: 4 });
	const durationResults = calculateDurations(events);
	const avgDuration = getAverageDuration(durationResults);
	const passingGates = gateEntries.filter((entry) => entry.result === "pass").length;
	const gatePassRate = gateEntries.length === 0 ? 1 : passingGates / gateEntries.length;

	const scorecard = computeScorecard(
		{
			events,
			gatePassRate,
			velocity,
			avgDuration,
		},
		period,
	);

	const wins = collectWins(velocity, gateEntries, gatePassRate, snapshots);
	if (wins.length === 0) {
		wins.push({
			dimension: "baseline",
			description: "Telemetry pipelines are active and producing review inputs",
			evidence: `Scorecard average ${scorecard.average.toFixed(2)} for ${period}`,
		});
	}

	const misses = collectMisses(gateEntries, snapshots, staleResult.count);
	if (misses.length === 0) {
		misses.push({
			dimension: "coverage",
			description: "Insufficient recent signals to identify concrete misses",
			evidence: "No failed gates, velocity drops, or stale artifacts detected",
		});
	}

	const suggestions = [buildSuggestion(misses, wins)];

	return {
		period,
		generatedAt: new Date().toISOString(),
		wins,
		misses,
		suggestions,
	};
}
