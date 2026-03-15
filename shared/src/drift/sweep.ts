import { getDataDir } from "../storage/directories.js";
import { detectContextDivergence } from "./detectors/context-divergence.js";
import { detectGuideViolations } from "./detectors/guide-violations.js";
import { detectOrphanedStorage } from "./detectors/orphaned-storage.js";
import { detectSchemaStaleness } from "./detectors/schema-staleness.js";
import { detectStaleDocumentation } from "./detectors/stale-documentation.js";
import { detectStaleWorkItems } from "./detectors/stale-work-items.js";
import { detectUnclosedLearnings } from "./detectors/unclosed-learnings.js";
import { detectUnusedSkills } from "./detectors/unused-skills.js";
import type { DriftEntry, DriftReport } from "./types.js";

type DetectorResult = { ran: boolean; count: number; error?: string };
type DetectorRun = () => Promise<DriftEntry[]>;

function isUnavailableError(error: unknown): boolean {
	if (!(error instanceof Error)) {
		return false;
	}

	const nodeError = error as NodeJS.ErrnoException;
	return (
		nodeError.code === "ENOENT" ||
		nodeError.code === "ENOTDIR" ||
		nodeError.code === "EACCES"
	);
}

async function runDetector(
	detectorName: string,
	run: DetectorRun,
): Promise<{ entries: DriftEntry[]; result: DetectorResult }> {
	try {
		const entries = await run();
		return {
			entries,
			result: {
				ran: true,
				count: entries.length,
			},
		};
	} catch (error) {
		if (isUnavailableError(error)) {
			return {
				entries: [],
				result: {
					ran: false,
					count: 0,
				},
			};
		}

		const message = error instanceof Error ? error.message : String(error);
		return {
			entries: [],
			result: {
				ran: false,
				count: 0,
				error: `Failed ${detectorName}: ${message}`,
			},
		};
	}
}

export async function sweepAll(): Promise<DriftReport> {
	const dataDir = getDataDir();
	const detectorResults: DriftReport["detectorResults"] = {};
	const entries: DriftEntry[] = [];

	const detectors: Array<{ name: string; run: DetectorRun }> = [
		{ name: "stale-work-items", run: () => detectStaleWorkItems() },
		{ name: "orphaned-storage", run: () => detectOrphanedStorage(dataDir) },
		{ name: "schema-staleness", run: () => detectSchemaStaleness(dataDir) },
		{ name: "unclosed-learnings", run: () => detectUnclosedLearnings() },
		{ name: "unused-skills", run: () => detectUnusedSkills() },
		{ name: "stale-documentation", run: () => detectStaleDocumentation() },
		{ name: "context-divergence", run: () => detectContextDivergence() },
		{ name: "guide-violations", run: () => detectGuideViolations() },
	];

	for (const detector of detectors) {
		const outcome = await runDetector(detector.name, detector.run);
		detectorResults[detector.name] = outcome.result;
		entries.push(...outcome.entries);
	}

	return {
		generatedAt: new Date().toISOString(),
		totalIssues: entries.length,
		entries,
		detectorResults,
	};
}
