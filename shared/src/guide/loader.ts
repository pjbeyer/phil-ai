import { access, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type {
	GuidePath,
	MergedGuide,
	Preference,
	SystemGuide,
} from "../schemas/guide.js";
import { createMergedGuide } from "../schemas/guide.js";
import { parseGuide } from "./parser.js";
import type {
	DiscoverGuidesResult,
	GuideHierarchyLevelType,
	GuideLoadOptions,
	ParseGuideResult,
} from "./types.js";

const GUIDE_FILENAME = "GUIDE.md";

async function fileExists(path: string): Promise<boolean> {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}

function extractProfilePath(projectPath: string): string | null {
	const home = homedir();
	const projectsDir = join(home, "Projects");

	if (!projectPath.startsWith(projectsDir)) {
		return null;
	}

	const relativePath = projectPath.slice(projectsDir.length + 1);
	const parts = relativePath.split("/");

	if (parts.length >= 1 && parts[0]) {
		return join(projectsDir, parts[0]);
	}

	return null;
}

export async function discoverGuides(
	projectPath: string,
): Promise<DiscoverGuidesResult> {
	const guides: GuidePath[] = [];
	const checked: string[] = [];

	const globalPath = join(homedir(), "Projects", GUIDE_FILENAME);
	checked.push(globalPath);
	if (await fileExists(globalPath)) {
		guides.push({ level: "global", path: globalPath });
	}

	const profilePath = extractProfilePath(projectPath);
	if (profilePath && profilePath !== projectPath) {
		const profileGuidePath = join(profilePath, GUIDE_FILENAME);
		checked.push(profileGuidePath);
		if (await fileExists(profileGuidePath)) {
			guides.push({ level: "profile", path: profileGuidePath });
		}
	}

	const projectGuidePath = join(projectPath, GUIDE_FILENAME);
	checked.push(projectGuidePath);
	if (await fileExists(projectGuidePath)) {
		guides.push({ level: "project", path: projectGuidePath });
	}

	return { guides, checked };
}

export async function loadGuide(
	guidePath: GuidePath,
): Promise<ParseGuideResult> {
	try {
		const content = await readFile(guidePath.path, "utf-8");
		return parseGuide(content, guidePath.path, guidePath.level);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		return {
			guide: {
				name: "system-guide",
				version: "1.0.0",
				level: guidePath.level,
				verbosity: "brief",
				filePath: guidePath.path,
				sections: [],
			},
			warnings: [`Failed to load guide: ${errorMessage}`],
			success: false,
		};
	}
}

function levelPriority(level: GuideHierarchyLevelType): number {
	const priorities: Record<GuideHierarchyLevelType, number> = {
		global: 0,
		profile: 1,
		project: 2,
	};
	return priorities[level];
}

export function mergeGuides(guides: SystemGuide[]): MergedGuide {
	const preferenceMap = new Map<string, Preference>();

	const sortedGuides = [...guides].sort(
		(a, b) => levelPriority(a.level) - levelPriority(b.level),
	);

	let effectiveVerbosity: "silent" | "brief" | "verbose" = "brief";

	for (const guide of sortedGuides) {
		effectiveVerbosity = guide.verbosity;

		for (const section of guide.sections) {
			for (const pref of section.preferences) {
				preferenceMap.set(pref.id, {
					...pref,
					sourceLevel: guide.level,
				});
			}
		}
	}

	const sources: GuidePath[] = guides.map((g) => ({
		level: g.level,
		path: g.filePath,
	}));

	return createMergedGuide(
		Array.from(preferenceMap.values()),
		sources,
		effectiveVerbosity,
	);
}

export async function loadMergedGuide(
	options: GuideLoadOptions,
): Promise<MergedGuide | null> {
	const { guides } = await discoverGuides(options.projectPath);

	if (guides.length === 0) {
		return null;
	}

	const loadedGuides: SystemGuide[] = [];
	const allWarnings: string[] = [];

	for (const guidePath of guides) {
		const result = await loadGuide(guidePath);
		if (result.success) {
			loadedGuides.push(result.guide);
		}
		allWarnings.push(...result.warnings);
	}

	if (loadedGuides.length === 0) {
		return null;
	}

	let merged = mergeGuides(loadedGuides);

	if (!options.includeInactive) {
		merged = {
			...merged,
			preferences: merged.preferences.filter((p) => p.active),
		};
	}

	if (options.verbosity) {
		merged = { ...merged, verbosity: options.verbosity };
	}

	if (options.platform) {
		merged = {
			...merged,
			preferences: merged.preferences.filter((p) => {
				const platformPref = p as Preference & { platform?: string };
				return (
					!platformPref.platform ||
					platformPref.platform === "all" ||
					platformPref.platform === options.platform
				);
			}),
		};
	}

	return merged;
}

export function formatGuideForAgent(guide: MergedGuide): string {
	const lines: string[] = [];

	lines.push("# System Guide");
	lines.push("");

	const hardPrefs = guide.preferences.filter((p) => p.type === "hard");
	const softPrefs = guide.preferences.filter((p) => p.type === "soft");

	if (hardPrefs.length > 0) {
		lines.push("## Hard Rules (Must Follow)");
		lines.push("");
		for (const pref of hardPrefs) {
			lines.push(`- **${pref.id}**: ${pref.content}`);
		}
		lines.push("");
	}

	if (softPrefs.length > 0) {
		lines.push("## Soft Preferences (Defaults)");
		lines.push("");
		for (const pref of softPrefs) {
			lines.push(`- **${pref.id}**: ${pref.content}`);
		}
		lines.push("");
	}

	return lines.join("\n");
}
