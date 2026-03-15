import { access, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import type { LearningEvent, SystemEvent } from "../schemas/events.js";
import { type Learning, LearningSchema } from "../schemas/state.js";
import { getDataPaths } from "../storage/directories.js";
import type { IngestOptions } from "./types.js";

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

async function collectLearningFiles(rootDir: string): Promise<string[]> {
	const files: string[] = [];
	const entries = await readdir(rootDir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = join(rootDir, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await collectLearningFiles(fullPath)));
			continue;
		}

		if (entry.isFile() && entry.name.endsWith(".json")) {
			files.push(fullPath);
		}
	}

	return files;
}

function toLearningEvents(learning: Learning): LearningEvent[] {
	const base = {
		source: "phil-ai-learning",
		context: "work" as const,
		role: "maintainer" as const,
		learningId: learning.id,
		category: learning.category,
	};

	const events: LearningEvent[] = [
		{
			...base,
			id: crypto.randomUUID(),
			eventType: "learning_captured",
			timestamp: learning._created,
			action: "captured",
		},
	];

	if (learning.content.documentationPath !== undefined) {
		events.push({
			...base,
			id: crypto.randomUUID(),
			eventType: "learning_implemented",
			timestamp: learning._modified,
			action: "implemented",
		});
	}

	if (learning.status === "closed") {
		events.push({
			...base,
			id: crypto.randomUUID(),
			eventType: "learning_closed",
			timestamp: learning.closedAt ?? learning._modified,
			action: "closed",
		});
	}

	return events;
}

export async function ingestLearningEvents(
	options?: IngestOptions,
): Promise<SystemEvent[]> {
	const learningsDir = getDataPaths().learnings;

	try {
		await access(learningsDir);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") {
			return [];
		}

		throw error;
	}

	const learningFiles = await collectLearningFiles(learningsDir);
	if (learningFiles.length === 0) {
		return [];
	}

	const events: SystemEvent[] = [];

	for (const filePath of learningFiles) {
		try {
			const content = await readFile(filePath, "utf-8");
			const parsedJson = JSON.parse(content) as unknown;
			const parsedLearning = LearningSchema.safeParse(parsedJson);

			if (!parsedLearning.success) {
				const details = parsedLearning.error.issues
					.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
					.join("; ");
				console.warn(`Skipping invalid learning file ${filePath}: ${details}`);
				continue;
			}

			for (const event of toLearningEvents(parsedLearning.data)) {
				if (isWithinDateRange(event.timestamp, options)) {
					events.push(event);
				}
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			console.warn(`Skipping unreadable learning file ${filePath}: ${errorMessage}`);
		}
	}

	return events;
}
