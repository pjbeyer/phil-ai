import type { DurationResult } from "../metrics/types.js";
import type { SystemEvent } from "../schemas/events.js";
import type { GateEntry } from "../schemas/gate.js";
import type { MetricsSnapshot } from "../schemas/metrics.js";
import { detectBlockedAccumulation } from "./detectors/blocked-accumulation.js";
import { detectDurationOutliers } from "./detectors/duration-outlier.js";
import { detectRecurringGateFailures } from "./detectors/recurring-gate-failure.js";
import { detectTypeConcentration } from "./detectors/type-concentration.js";
import { detectVelocityAnomaly } from "./detectors/velocity-anomaly.js";
import type { PatternEntry, PatternReport } from "./types.js";

type DetectorResult = { ran: boolean; count: number; error?: string };

interface AnalyzeInput {
	gateEntries?: GateEntry[];
	metricsSnapshots?: MetricsSnapshot[];
	events?: SystemEvent[];
	durations?: DurationResult[];
}

export class PatternEngine {
	async analyze(data: AnalyzeInput): Promise<PatternReport> {
		const entries: PatternEntry[] = [];
		const detectorResults: Record<string, DetectorResult> = {};

		const runDetector = (
			name: string,
			detector: () => PatternEntry[],
		): void => {
			try {
				const detected = detector();
				entries.push(...detected);
				detectorResults[name] = { ran: true, count: detected.length };
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				detectorResults[name] = { ran: false, count: 0, error: errorMessage };
			}
		};

		runDetector("recurring-gate-failure", () =>
			detectRecurringGateFailures(data.gateEntries ?? []),
		);
		runDetector("velocity-anomaly", () =>
			detectVelocityAnomaly(data.metricsSnapshots ?? []),
		);
		runDetector("type-concentration", () =>
			detectTypeConcentration(data.events ?? []),
		);
		runDetector("duration-outlier", () =>
			detectDurationOutliers(data.durations ?? []),
		);
		runDetector("blocked-accumulation", () =>
			detectBlockedAccumulation(data.events ?? []),
		);

		return {
			generatedAt: new Date().toISOString(),
			totalPatterns: entries.length,
			entries,
			detectorResults,
		};
	}
}
