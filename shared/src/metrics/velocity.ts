import type { SystemEvent } from "../schemas/events.js";
import type { VelocityWindow } from "./types.js";

function resolveWindowWeeks(weeks: number): number {
	return Number.isFinite(weeks) && weeks > 0 ? weeks : 4;
}

export function calculateVelocity(events: SystemEvent[], window: VelocityWindow): number {
	const weeks = resolveWindowWeeks(window.weeks);
	const nowMs = Date.now();
	const windowStartMs = nowMs - weeks * 7 * 24 * 60 * 60 * 1000;

	const completedCount = events.filter((event) => {
		if (event.eventType !== "work_finished") {
			return false;
		}

		const eventMs = new Date(event.timestamp).getTime();
		return Number.isFinite(eventMs) && eventMs >= windowStartMs && eventMs <= nowMs;
	}).length;

	if (completedCount === 0) {
		return 0;
	}

	return completedCount / weeks;
}
