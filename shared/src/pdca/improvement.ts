import { join } from "node:path";
import { z } from "zod";
import { getDataPaths, ensureDir } from "../storage/directories.js";
import { readJson, writeJson } from "../storage/json.js";
import type { Improvement } from "./types.js";

const ImprovementSchema = z.object({
	id: z.string().uuid(),
	dimension: z.string(),
	action: z.string(),
	outcome: z.string().optional(),
	startedAt: z.string().datetime(),
	completedAt: z.string().datetime().optional(),
});

const ImprovementArraySchema = z.array(ImprovementSchema);

function getImprovementsFilePath(): string {
	return join(getDataPaths().verificationPdca, "improvements.json");
}

export async function trackImprovement(
	improvement: Omit<Improvement, "id" | "startedAt">,
): Promise<Improvement> {
	const created: Improvement = {
		id: crypto.randomUUID(),
		dimension: improvement.dimension,
		action: improvement.action,
		startedAt: new Date().toISOString(),
		...(improvement.outcome !== undefined ? { outcome: improvement.outcome } : {}),
		...(improvement.completedAt !== undefined
			? { completedAt: improvement.completedAt }
			: {}),
	};

	const filePath = getImprovementsFilePath();
	await ensureDir(getDataPaths().verificationPdca);
	const existing = await getImprovements();
	await writeJson(filePath, [...existing, created], ImprovementArraySchema);

	return created;
}

export async function getImprovements(): Promise<Improvement[]> {
	const filePath = getImprovementsFilePath();
	const existing = await readJson(filePath, ImprovementArraySchema);

	if (existing === null) {
		return [];
	}

	return existing.map((item) => ({
		id: item.id,
		dimension: item.dimension,
		action: item.action,
		startedAt: item.startedAt,
		...(item.outcome !== undefined ? { outcome: item.outcome } : {}),
		...(item.completedAt !== undefined ? { completedAt: item.completedAt } : {}),
	}));
}
