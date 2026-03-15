import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { DriftEntry } from "../types.js";

async function collectJsonFiles(rootDir: string): Promise<string[]> {
	const entries = await readdir(rootDir, { withFileTypes: true });
	const files: string[] = [];

	for (const entry of entries) {
		const fullPath = join(rootDir, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await collectJsonFiles(fullPath)));
			continue;
		}

		if (entry.isFile() && entry.name.endsWith(".json")) {
			files.push(fullPath);
		}
	}

	return files;
}

export async function detectOrphanedStorage(dataDir: string): Promise<DriftEntry[]> {
	const detectedAt = new Date().toISOString();
	const files = await collectJsonFiles(dataDir);
	const entries: DriftEntry[] = [];

	for (const filePath of files) {
		try {
			const content = await readFile(filePath, "utf-8");
			JSON.parse(content);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			entries.push({
				type: "orphaned-storage",
				severity: "warning",
				description: `File cannot be parsed as JSON: ${errorMessage}`,
				path: filePath,
				detectedAt,
				suggestedAction: "Repair or remove the malformed JSON file",
			});
		}
	}

	return entries;
}
