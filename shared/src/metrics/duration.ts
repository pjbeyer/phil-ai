import type { SystemEvent } from "../schemas/events.js";
import type { DurationResult } from "./types.js";

type WorkflowTimingEvent = SystemEvent & {
	eventType: "work_started" | "work_finished";
	issueId: string;
	branch: string;
};

function isWorkflowTimingEvent(event: SystemEvent): event is WorkflowTimingEvent {
	const candidate = event as Partial<WorkflowTimingEvent>;
	const isWorkEvent =
		candidate.eventType === "work_started" || candidate.eventType === "work_finished";

	return (
		isWorkEvent &&
		typeof candidate.issueId === "string" &&
		typeof candidate.branch === "string"
	);
}

export function calculateDurations(events: SystemEvent[]): DurationResult[] {
	const workflowEvents = events
		.filter(isWorkflowTimingEvent)
		.sort(
			(a, b) =>
				new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
		);

	const openStarts = new Map<string, WorkflowTimingEvent[]>();
	const results: DurationResult[] = [];

	for (const event of workflowEvents) {
		const key = `${event.issueId}::${event.branch}`;

		if (event.eventType === "work_started") {
			const existing = openStarts.get(key) ?? [];
			existing.push(event);
			openStarts.set(key, existing);
			continue;
		}

		const existing = openStarts.get(key);
		const startedEvent = existing?.shift();

		if (existing !== undefined && existing.length === 0) {
			openStarts.delete(key);
		}

		if (startedEvent === undefined) {
			continue;
		}

		const startMs = new Date(startedEvent.timestamp).getTime();
		const finishMs = new Date(event.timestamp).getTime();
		const durationHours = Math.max(0, finishMs - startMs) / 3_600_000;

		results.push({
			issueId: startedEvent.issueId,
			branch: startedEvent.branch,
			startedAt: startedEvent.timestamp,
			completedAt: event.timestamp,
			durationHours,
		});
	}

	for (const startedEvents of openStarts.values()) {
		for (const startedEvent of startedEvents) {
			results.push({
				issueId: startedEvent.issueId,
				branch: startedEvent.branch,
				startedAt: startedEvent.timestamp,
				completedAt: null,
				durationHours: null,
			});
		}
	}

	return results;
}

export function getAverageDuration(results: DurationResult[]): number {
	const completedDurations = results
		.map((result) => result.durationHours)
		.filter((duration): duration is number => duration !== null);

	if (completedDurations.length === 0) {
		return 0;
	}

	const total = completedDurations.reduce((sum, duration) => sum + duration, 0);
	return total / completedDurations.length;
}
