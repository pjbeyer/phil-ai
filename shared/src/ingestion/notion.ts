import type { SystemEvent } from "../schemas/events.js";
import type { IngestOptions } from "./types.js";

export async function ingestNotionGates(
	_options?: IngestOptions,
): Promise<SystemEvent[]> {
	console.warn("Notion ingestion unavailable: returning empty event set");
	return [];
}
