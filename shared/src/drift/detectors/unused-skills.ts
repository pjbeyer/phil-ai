import { access } from "node:fs/promises";
import { join } from "node:path";
import type { DriftEntry } from "../types.js";

export async function detectUnusedSkills(): Promise<DriftEntry[]> {
	const skillsDir = join(process.cwd(), "core", "skills");

	try {
		await access(skillsDir);
	} catch (error) {
		const nodeError = error as NodeJS.ErrnoException;
		if (nodeError.code === "ENOENT") {
			return [];
		}

		throw error;
	}

	return [];
}
