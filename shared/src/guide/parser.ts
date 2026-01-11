import matter from "gray-matter";
import type {
	GuideSection,
	Preference,
	SystemGuide,
} from "../schemas/guide.js";
import { GuideFrontmatterSchema, PreferenceIdRegex } from "../schemas/guide.js";
import type { GuideHierarchyLevelType, ParseGuideResult } from "./types.js";

const PREFERENCE_MARKER_REGEX =
	/<!--\s*preference:\s*([^\s|]+)\s*\|\s*(hard|soft)\s*-->/gi;
const SECTION_HEADING_REGEX = /^##\s+(.+)$/gm;

export function parseGuide(
	content: string,
	filePath: string,
	level: GuideHierarchyLevelType,
): ParseGuideResult {
	const warnings: string[] = [];

	try {
		const { data: rawFrontmatter, content: body } = matter(content);

		const frontmatterResult = GuideFrontmatterSchema.safeParse(rawFrontmatter);
		if (!frontmatterResult.success) {
			warnings.push(`Invalid frontmatter: ${frontmatterResult.error.message}`);
		}

		const frontmatter = frontmatterResult.success
			? frontmatterResult.data
			: { name: "system-guide", version: "1.0.0", verbosity: "brief" as const };

		const sections = extractSections(body, warnings);

		const guide: SystemGuide = {
			name: frontmatter.name,
			version: frontmatter.version,
			level: frontmatter.level ?? level,
			verbosity: frontmatter.verbosity,
			filePath,
			sections,
		};

		return { guide, warnings, success: true };
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		return {
			guide: {
				name: "system-guide",
				version: "1.0.0",
				level,
				verbosity: "brief",
				filePath,
				sections: [],
			},
			warnings: [`Failed to parse guide: ${errorMessage}`],
			success: false,
		};
	}
}

export function extractSections(
	body: string,
	warnings: string[],
): GuideSection[] {
	const sections: GuideSection[] = [];
	const headingMatches = [...body.matchAll(SECTION_HEADING_REGEX)];

	if (headingMatches.length === 0) {
		const preferences = extractPreferencesFromText(body, warnings);
		if (preferences.length > 0) {
			sections.push({
				name: "default",
				heading: "Default",
				preferences,
			});
		}
		return sections;
	}

	for (let i = 0; i < headingMatches.length; i++) {
		const match = headingMatches[i];
		if (!match) continue;
		const matchIndex = match.index;
		if (matchIndex === undefined) continue;

		const heading = (match[1] ?? "").trim();
		const name = heading.toLowerCase().replace(/\s+/g, "-");

		const startIndex = matchIndex + match[0].length;
		const nextMatch = headingMatches[i + 1];
		const endIndex = nextMatch?.index ?? body.length;

		const sectionContent = body.slice(startIndex, endIndex);
		const preferences = extractPreferencesFromText(sectionContent, warnings);

		sections.push({ name, heading, preferences });
	}

	return sections;
}

function extractPreferencesFromText(
	text: string,
	warnings: string[],
): Preference[] {
	const preferences: Preference[] = [];
	const lines = text.split("\n");

	let currentPreferenceId = "";
	let currentPreferenceType: "hard" | "soft" = "soft";
	let contentLines: string[] = [];

	for (const line of lines) {
		const markerMatch = PREFERENCE_MARKER_REGEX.exec(line);
		PREFERENCE_MARKER_REGEX.lastIndex = 0;

		if (markerMatch) {
			if (currentPreferenceId && contentLines.length > 0) {
				const content = contentLines.join("\n").trim();
				if (content) {
					if (PreferenceIdRegex.test(currentPreferenceId)) {
						preferences.push({
							id: currentPreferenceId,
							type: currentPreferenceType,
							content,
							active: true,
						});
					} else {
						warnings.push(`Invalid preference ID: ${currentPreferenceId}`);
					}
				}
			}

			currentPreferenceId = markerMatch[1] ?? "";
			currentPreferenceType = (markerMatch[2] as "hard" | "soft") ?? "soft";
			contentLines = [];
		} else if (currentPreferenceId) {
			const trimmedLine = line.trim();
			if (trimmedLine && !trimmedLine.startsWith("#")) {
				contentLines.push(trimmedLine);
			}
		}
	}

	if (currentPreferenceId && contentLines.length > 0) {
		const content = contentLines.join("\n").trim();
		if (content) {
			if (PreferenceIdRegex.test(currentPreferenceId)) {
				preferences.push({
					id: currentPreferenceId,
					type: currentPreferenceType,
					content,
					active: true,
				});
			} else {
				warnings.push(`Invalid preference ID: ${currentPreferenceId}`);
			}
		}
	}

	return preferences;
}
