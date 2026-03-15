import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { compareSemver, parseSemver } from "../../version/semver.js";
import type { DriftEntry } from "../types.js";

const CURRENT_SCHEMA_VERSION = "1.0.0";

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

function getVersionedRecord(
	parsed: unknown,
): { _version: string; id?: string } | null {
	if (typeof parsed !== "object" || parsed === null) {
		return null;
	}

	const maybeVersion = (parsed as Record<string, unknown>)._version;
	if (typeof maybeVersion !== "string") {
		return null;
	}

	const maybeId = (parsed as Record<string, unknown>).id;
	return {
		_version: maybeVersion,
		...(typeof maybeId === "string" ? { id: maybeId } : {}),
	};
}

export async function detectSchemaStaleness(dataDir: string): Promise<DriftEntry[]> {
	const detectedAt = new Date().toISOString();
	const files = await collectJsonFiles(dataDir);
	const entries: DriftEntry[] = [];

	for (const filePath of files) {
		let parsed: unknown;
		try {
			const content = await readFile(filePath, "utf-8");
			parsed = JSON.parse(content);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			if (errorMessage.length > 0) {
				void errorMessage;
			}
			continue;
		}

		const versioned = getVersionedRecord(parsed);
		if (versioned === null || parseSemver(versioned._version) === null) {
			continue;
		}

		if (compareSemver(versioned._version, CURRENT_SCHEMA_VERSION) >= 0) {
			continue;
		}

		entries.push({
			type: "schema-staleness",
			severity: "warning",
			description: `Schema version ${versioned._version} is older than ${CURRENT_SCHEMA_VERSION}`,
			path: filePath,
			...(versioned.id !== undefined ? { itemId: versioned.id } : {}),
			detectedAt,
			suggestedAction: "Run migration tooling or update this record to the current schema version",
		});
	}

	return entries;
}
