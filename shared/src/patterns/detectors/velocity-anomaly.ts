import type { MetricsSnapshot } from "../../schemas/metrics.js";
import type { PatternEntry } from "../types.js";

export function detectVelocityAnomaly(snapshots: MetricsSnapshot[]): PatternEntry[] {
	if (snapshots.length < 2) {
		return [];
	}

	const nowIso = new Date().toISOString();
	const anomalies: PatternEntry[] = [];

	for (let index = 1; index < snapshots.length; index += 1) {
		const previous = snapshots[index - 1];
		const current = snapshots[index];

		if (previous === undefined || current === undefined) {
			continue;
		}

		if (!Number.isFinite(previous.velocity) || !Number.isFinite(current.velocity)) {
			continue;
		}

		if (previous.velocity <= 0) {
			continue;
		}

		const dropRatio = (previous.velocity - current.velocity) / previous.velocity;
		if (!Number.isFinite(dropRatio) || dropRatio <= 0.3) {
			continue;
		}

		anomalies.push({
			type: "velocity-anomaly",
			severity: "warning",
			description: `Velocity dropped more than 30% from ${previous.period} to ${current.period}.`,
			evidence: `Previous velocity ${previous.velocity.toFixed(2)}, current velocity ${current.velocity.toFixed(2)} (${(dropRatio * 100).toFixed(1)}% decrease).`,
			suggestedAction:
				"Review recent blockers and WIP limits to recover throughput in the next period.",
			detectedAt: nowIso,
		});
	}

	return anomalies;
}
