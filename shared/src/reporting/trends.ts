import { MetricsStore } from "../metrics/store.js";

export type TrendIndicator = "↑" | "↗" | "→" | "↘" | "↓";

interface TrendPoint {
	period: string;
	value: number;
}

interface TrendComparison {
	from: string;
	to: string;
	previous: number;
	current: number;
	pctChange: number;
	indicator: TrendIndicator;
}

export interface TrendReport {
	generatedAt: string;
	periods: string[];
	velocity: {
		points: TrendPoint[];
		comparisons: TrendComparison[];
	};
	gatePassRate: {
		points: TrendPoint[];
		comparisons: TrendComparison[];
	};
	activeItems: {
		points: TrendPoint[];
		comparisons: TrendComparison[];
	};
	markdown: string;
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

function indicatorFromChange(previous: number, current: number): { pct: number; indicator: TrendIndicator } {
	if (!Number.isFinite(previous) || !Number.isFinite(current)) {
		return { pct: 0, indicator: "→" };
	}

	if (previous === 0) {
		if (current === 0) {
			return { pct: 0, indicator: "→" };
		}

		return { pct: 100, indicator: current > 0 ? "↑" : "↓" };
	}

	const pct = ((current - previous) / Math.abs(previous)) * 100;
	if (pct > 10) return { pct, indicator: "↑" };
	if (pct >= 1) return { pct, indicator: "↗" };
	if (pct < -10) return { pct, indicator: "↓" };
	if (pct <= -1) return { pct, indicator: "↘" };
	return { pct, indicator: "→" };
}

function compareSeries(points: TrendPoint[]): TrendComparison[] {
	const output: TrendComparison[] = [];

	for (let index = 1; index < points.length; index += 1) {
		const previous = points[index - 1];
		const current = points[index];
		if (previous === undefined || current === undefined) {
			continue;
		}

		const change = indicatorFromChange(previous.value, current.value);
		output.push({
			from: previous.period,
			to: current.period,
			previous: previous.value,
			current: current.value,
			pctChange: change.pct,
			indicator: change.indicator,
		});
	}

	return output;
}

function markdownLine(label: string, comparison: TrendComparison, formatValue?: (value: number) => string): string {
	const format = formatValue ?? ((value: number) => value.toFixed(2));
	return `- ${label} ${comparison.from} -> ${comparison.to}: ${comparison.indicator} (${format(comparison.previous)} -> ${format(comparison.current)}, ${comparison.pctChange.toFixed(1)}%)`;
}

export async function trendReport(periods: string[]): Promise<TrendReport> {
	const uniquePeriods = [...new Set(periods.filter((period) => period.trim().length > 0))];
	const store = new MetricsStore();

	const snapshots = await Promise.all(uniquePeriods.map(async (period) => store.getSnapshot(period)));
	const present = snapshots
		.map((snapshot, index) => ({ snapshot, period: uniquePeriods[index] }))
		.filter((entry): entry is { snapshot: NonNullable<typeof entry.snapshot>; period: string } => entry.snapshot !== null);

	const velocityPoints: TrendPoint[] = present.map((entry) => ({
		period: entry.period,
		value: safeNumber(entry.snapshot.velocity),
	}));
	const gatePoints: TrendPoint[] = present.map((entry) => ({
		period: entry.period,
		value: safeRate(entry.snapshot.gatePassRate),
	}));
	const activePoints: TrendPoint[] = present.map((entry) => ({
		period: entry.period,
		value: safeNumber(entry.snapshot.activeItems),
	}));

	const velocityComparisons = compareSeries(velocityPoints);
	const gateComparisons = compareSeries(gatePoints);
	const activeComparisons = compareSeries(activePoints);

	const markdownLines = [
		"# Workflow Trends",
		"",
		velocityComparisons.length === 0
			? "- Velocity: insufficient data"
			: velocityComparisons.map((comparison) => markdownLine("Velocity", comparison)).join("\n"),
		gateComparisons.length === 0
			? "- Gate Pass Rate: insufficient data"
			: gateComparisons
					.map((comparison) =>
						markdownLine("Gate Pass Rate", comparison, (value) => `${(value * 100).toFixed(1)}%`),
					)
					.join("\n"),
		activeComparisons.length === 0
			? "- Active Items: insufficient data"
			: activeComparisons.map((comparison) => markdownLine("Active Items", comparison)).join("\n"),
	];

	return {
		generatedAt: new Date().toISOString(),
		periods: uniquePeriods,
		velocity: {
			points: velocityPoints,
			comparisons: velocityComparisons,
		},
		gatePassRate: {
			points: gatePoints,
			comparisons: gateComparisons,
		},
		activeItems: {
			points: activePoints,
			comparisons: activeComparisons,
		},
		markdown: markdownLines.join("\n"),
	};
}
