import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { LearningSchema } from "../../schemas/state.js";
import { getDataPaths } from "../../storage/directories.js";
import type { DriftEntry } from "../types.js";

const STALE_OPEN_LEARNING_DAYS = 30;

async function collectLearningFiles(rootDir: string): Promise<string[]> {
	const entries = await readdir(rootDir, { withFileTypes: true });
	const files: string[] = [];

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

export async function detectUnclosedLearnings(): Promise<DriftEntry[]> {
	const learningsDir = getDataPaths().learnings;
	const detectedAt = new Date().toISOString();
	const nowMs = Date.now();
	const entries: DriftEntry[] = [];

	const learningFiles = await collectLearningFiles(learningsDir);
	for (const filePath of learningFiles) {
		try {
			const content = await readFile(filePath, "utf-8");
			const parsed = JSON.parse(content) as unknown;
			const result = LearningSchema.safeParse(parsed);
			if (!result.success || result.data.status !== "open") {
				continue;
			}

			const createdAtMs = new Date(result.data._created).getTime();
			if (!Number.isFinite(createdAtMs)) {
				continue;
			}

			const ageDays = Math.floor((nowMs - createdAtMs) / (1000 * 60 * 60 * 24));
			if (ageDays <= STALE_OPEN_LEARNING_DAYS) {
				continue;
			}

			entries.push({
				type: "unclosed-learnings",
				severity: "warning",
				description: `Learning ${result.data.title} has remained open for ${ageDays} days`,
				path: filePath,
				itemId: result.data.id,
				detectedAt,
				suggestedAction: "Review the learning and move it to in-progress, blocked, or closed",
			});
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			entries.push({
				type: "unclosed-learnings",
				severity: "info",
				description: `Skipping unreadable learning file: ${errorMessage}`,
				path: filePath,
				detectedAt,
			});
		}
	}

	return entries;
}
