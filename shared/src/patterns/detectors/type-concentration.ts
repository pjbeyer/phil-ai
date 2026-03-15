import type { SystemEvent } from "../../schemas/events.js";
import type { PatternEntry } from "../types.js";

type WorkTypeCarrier = SystemEvent & { workType?: string };

function extractWorkType(event: SystemEvent): string | null {
	const candidate = event as Partial<WorkTypeCarrier>;
	return typeof candidate.workType === "string" && candidate.workType.length > 0
		? candidate.workType
		: null;
}

export function detectTypeConcentration(events: SystemEvent[]): PatternEntry[] {
	if (events.length === 0) {
		return [];
	}

	const workTypes = events
		.map((event) => extractWorkType(event))
		.filter((workType): workType is string => workType !== null);

	if (workTypes.length === 0) {
		return [];
	}

	const counts = new Map<string, number>();
	for (const workType of workTypes) {
		counts.set(workType, (counts.get(workType) ?? 0) + 1);
	}

	let topType: string | undefined;
	let topCount = 0;
	for (const [workType, count] of counts) {
		if (count > topCount) {
			topType = workType;
			topCount = count;
		}
	}

	if (topType === undefined) {
		return [];
	}

	const concentrationRatio = topCount / workTypes.length;
	if (!Number.isFinite(concentrationRatio) || concentrationRatio <= 0.8) {
		return [];
	}

	return [
		{
			type: "type-concentration",
			severity: "warning",
			description: `Work type distribution is heavily concentrated in \"${topType}\" items.`,
			evidence: `${topCount} of ${workTypes.length} tracked work items are ${topType} (${(concentrationRatio * 100).toFixed(1)}%).`,
			suggestedAction:
				"Rebalance intake across work types to reduce portfolio risk and delivery bottlenecks.",
			detectedAt: new Date().toISOString(),
		},
	];
}
