import type { SystemEvent } from "../../schemas/events.js";
import type { PatternEntry } from "../types.js";

function isBlockedEvent(event: SystemEvent): boolean {
	if (event.eventType.toLowerCase().includes("blocked")) {
		return true;
	}

	const metadata = event.metadata;
	if (metadata === undefined) {
		return false;
	}

	const blocked = metadata.blocked;
	if (typeof blocked === "boolean") {
		return blocked;
	}

	const status = metadata.status;
	if (typeof status === "string") {
		return status.toLowerCase() === "blocked";
	}

	return false;
}

function toWeekKey(timestamp: string): string | null {
	const date = new Date(timestamp);
	const timestampMs = date.getTime();
	if (!Number.isFinite(timestampMs)) {
		return null;
	}

	const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
	const day = utcDate.getUTCDay() || 7;
	utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);
	const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
	const weekNumber = Math.ceil(((utcDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

	return `${utcDate.getUTCFullYear()}-W${weekNumber.toString().padStart(2, "0")}`;
}

export function detectBlockedAccumulation(events: SystemEvent[]): PatternEntry[] {
	if (events.length === 0) {
		return [];
	}

	const weeklyBlockedCounts = new Map<string, number>();

	for (const event of events) {
		if (!isBlockedEvent(event)) {
			continue;
		}

		const weekKey = toWeekKey(event.timestamp);
		if (weekKey === null) {
			continue;
		}

		weeklyBlockedCounts.set(weekKey, (weeklyBlockedCounts.get(weekKey) ?? 0) + 1);
	}

	const orderedWeeks = [...weeklyBlockedCounts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
	if (orderedWeeks.length < 3) {
		return [];
	}

	const lastThree = orderedWeeks.slice(-3);
	const [first, second, third] = lastThree;

	if (first === undefined || second === undefined || third === undefined) {
		return [];
	}

	const isGrowing = first[1] < second[1] && second[1] < third[1];
	if (!isGrowing || third[1] < 2) {
		return [];
	}

	return [
		{
			type: "blocked-accumulation",
			severity: "critical",
			description: "Blocked work items are accumulating over recent weeks.",
			evidence: `${first[0]}: ${first[1]}, ${second[0]}: ${second[1]}, ${third[0]}: ${third[1]} blocked events.`,
			suggestedAction:
				"Run a blocker review and assign explicit owners to unblock the highest-impact items.",
			detectedAt: new Date().toISOString(),
		},
	];
}
