import { access, readFile, readdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { SystemEvent } from "../schemas/events.js";
import { parseWorkflowJsonl } from "../schemas/events.js";
import type { IngestOptions } from "./types.js";

const WORKFLOW_PROFILES = ["work", "pjbeyer", "play", "home"] as const;
const WORKFLOW_FILENAME_REGEX = new RegExp(
	`^(${WORKFLOW_PROFILES.join("|")})-\\d{4}-\\d{2}\\.json$`,
);

function isWithinDateRange(timestamp: string, options?: IngestOptions): boolean {
	const dateRange = options?.dateRange;
	if (dateRange === undefined) {
		return true;
	}

	const eventTime = new Date(timestamp).getTime();
	if (Number.isNaN(eventTime)) {
		return false;
	}

	if (dateRange.from !== undefined && eventTime < dateRange.from.getTime()) {
		return false;
	}

	if (dateRange.to !== undefined && eventTime > dateRange.to.getTime()) {
		return false;
	}

	return true;
}

export async function ingestWorkflowEvents(
	options?: IngestOptions,
): Promise<SystemEvent[]> {
	const metricsDir = join(homedir(), "Projects", ".workflow", "metrics");

	try {
		await access(metricsDir);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") {
			return [];
		}

		throw error;
	}

	const entries = await readdir(metricsDir, { withFileTypes: true });
	const metricFiles = entries
		.filter((entry) => entry.isFile() && WORKFLOW_FILENAME_REGEX.test(entry.name))
		.map((entry) => entry.name)
		.sort();

	const events: SystemEvent[] = [];

	for (const fileName of metricFiles) {
		const filePath = join(metricsDir, fileName);
		const content = await readFile(filePath, "utf-8");
		const lines = content.split(/\r?\n/);

		for (const [lineIndex, rawLine] of lines.entries()) {
			const line = rawLine.trim();
			if (line.length === 0) {
				continue;
			}

			try {
				const event = parseWorkflowJsonl(line);
				if (isWithinDateRange(event.timestamp, options)) {
					events.push(event);
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				console.warn(
					`Skipping malformed workflow metric line ${lineIndex + 1} in ${filePath}: ${errorMessage}`,
				);
			}
		}
	}

	return events;
}
