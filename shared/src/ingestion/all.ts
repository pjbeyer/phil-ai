import type { SystemEvent } from "../schemas/events.js";
import type { IngestOptions } from "./types.js";
import { ingestLearningEvents } from "./learning.js";
import { ingestNotionGates } from "./notion.js";
import { ingestWorkflowEvents } from "./workflow.js";

export async function ingestAll(options?: IngestOptions): Promise<SystemEvent[]> {
	const results = await Promise.allSettled([
		ingestWorkflowEvents(options),
		ingestLearningEvents(options),
		ingestNotionGates(options),
	]);

	const events: SystemEvent[] = [];
	const sources = ["workflow", "learning", "notion"];

	for (const [index, result] of results.entries()) {
		if (result.status === "fulfilled") {
			events.push(...result.value);
			continue;
		}

		const reason = result.reason;
		const message = reason instanceof Error ? reason.message : String(reason);
		console.warn(`Failed to ingest ${sources[index]} events: ${message}`);
	}

	return events;
}
