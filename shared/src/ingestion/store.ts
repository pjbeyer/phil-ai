import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { z } from "zod";
import type { SystemEvent } from "../schemas/events.js";
import { getDataPaths } from "../storage/directories.js";
import { withFileLock } from "../storage/lock.js";
import type { EventStoreIndex } from "./types.js";

const EventStoreIndexSchema = z.object({
	lastUpdated: z.string().datetime(),
	totalCount: z.number(),
	sources: z.record(
		z.string(),
		z.object({
			count: z.number(),
			lastIngested: z.string().datetime(),
		}),
	),
});

function buildEventStoreIndex(events: SystemEvent[]): EventStoreIndex {
	const sources: EventStoreIndex["sources"] = {};

	for (const event of events) {
		const sourceData = sources[event.source];
		if (sourceData === undefined) {
			sources[event.source] = { count: 1, lastIngested: event.timestamp };
			continue;
		}

		sourceData.count += 1;
		if (new Date(event.timestamp).getTime() > new Date(sourceData.lastIngested).getTime()) {
			sourceData.lastIngested = event.timestamp;
		}
	}

	return {
		lastUpdated: new Date().toISOString(),
		totalCount: events.length,
		sources,
	};
}

export async function updateEventStoreIndex(events: SystemEvent[]): Promise<void> {
	const indexPath = getDataPaths().verificationEvents;
	const index = EventStoreIndexSchema.parse(buildEventStoreIndex(events));

	await withFileLock(indexPath, async () => {
		await writeFile(indexPath, JSON.stringify(index, null, 2), "utf-8");
	});
}

export async function getEventStoreIndex(): Promise<EventStoreIndex | null> {
	const indexPath = getDataPaths().verificationEvents;
	if (!existsSync(indexPath)) {
		return null;
	}

	return withFileLock(indexPath, async () => {
		const content = await readFile(indexPath, "utf-8");
		const parsed = JSON.parse(content) as unknown;
		return EventStoreIndexSchema.parse(parsed);
	});
}
