import type { GateEntry } from "../../schemas/gate.js";
import type { PatternEntry } from "../types.js";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

interface GateFailureSummary {
	count: number;
	windowStart: number;
	windowEnd: number;
}

function summarizeRecurringFailures(entries: GateEntry[]): Map<string, GateFailureSummary> {
	const failuresByGate = new Map<string, number[]>();

	for (const entry of entries) {
		if (entry.result !== "fail") {
			continue;
		}

		const timestampMs = new Date(entry.date).getTime();
		if (!Number.isFinite(timestampMs)) {
			continue;
		}

		const existing = failuresByGate.get(entry.name) ?? [];
		existing.push(timestampMs);
		failuresByGate.set(entry.name, existing);
	}

	const summaries = new Map<string, GateFailureSummary>();

	for (const [gateName, timestamps] of failuresByGate) {
		const sorted = [...timestamps].sort((a, b) => a - b);
		let startIndex = 0;
		let best: GateFailureSummary | undefined;

		for (let endIndex = 0; endIndex < sorted.length; endIndex += 1) {
			const endTs = sorted[endIndex];
			if (endTs === undefined) {
				continue;
			}

			let startTs = sorted[startIndex];
			while (
				startIndex <= endIndex &&
				startTs !== undefined &&
				endTs - startTs > THIRTY_DAYS_MS
			) {
				startIndex += 1;
				startTs = sorted[startIndex];
			}

			const windowCount = endIndex - startIndex + 1;
			if (windowCount < 3) {
				continue;
			}

			if (startTs === undefined) {
				continue;
			}

			const candidate: GateFailureSummary = {
				count: windowCount,
				windowStart: startTs,
				windowEnd: endTs,
			};

			if (best === undefined || candidate.count > best.count) {
				best = candidate;
			}
		}

		if (best !== undefined) {
			summaries.set(gateName, best);
		}
	}

	return summaries;
}

export function detectRecurringGateFailures(entries: GateEntry[]): PatternEntry[] {
	if (entries.length === 0) {
		return [];
	}

	const nowIso = new Date().toISOString();
	const summaries = summarizeRecurringFailures(entries);

	return [...summaries.entries()].map(([gateName, summary]) => ({
		type: "recurring-gate-failure",
		severity: "critical",
		description: `Gate \"${gateName}\" failed repeatedly within a 30-day window.`,
		evidence: `${summary.count} failures between ${new Date(summary.windowStart).toISOString()} and ${new Date(summary.windowEnd).toISOString()}.`,
		suggestedAction:
			"Review this gate's failure reasons and add a targeted remediation checklist before rerunning.",
		detectedAt: nowIso,
	}));
}
