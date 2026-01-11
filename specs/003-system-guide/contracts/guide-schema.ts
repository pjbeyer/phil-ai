/**
 * System Guide Schema Contracts
 *
 * This file defines the Zod schemas and TypeScript types for the System Guide feature.
 * These schemas will be implemented in shared/src/schemas/guide.ts during implementation.
 *
 * @module @phil-ai/shared/schemas/guide
 */

import { z } from "zod";

// =============================================================================
// Enumerations
// =============================================================================

export const HierarchyLevel = ["global", "profile", "project"] as const;
export type HierarchyLevelType = (typeof HierarchyLevel)[number];

export const PreferenceType = ["hard", "soft"] as const;
export type PreferenceTypeType = (typeof PreferenceType)[number];

export const VerbosityLevel = ["silent", "brief", "verbose"] as const;
export type VerbosityLevelType = (typeof VerbosityLevel)[number];

// =============================================================================
// Validation Patterns
// =============================================================================

/**
 * Preference ID format: lowercase dot-notation slug
 * Examples: "code-style.explicit-types", "comm.concise"
 */
export const PreferenceIdRegex = /^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/;

/**
 * Semver format for guide version
 * Examples: "1.0.0", "2.1.3-beta"
 */
export const SemverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/;

// =============================================================================
// Core Schemas
// =============================================================================

/**
 * Individual preference rule
 */
export const PreferenceSchema = z.object({
	/** Unique dot-notation slug (e.g., "code-style.explicit-types") */
	id: z.string().regex(PreferenceIdRegex, "Invalid preference ID format"),

	/** Hard rule (always follow) or soft default (can override) */
	type: z.enum(PreferenceType).default("soft"),

	/** Natural language description of the preference */
	content: z.string().min(1, "Preference content is required"),

	/** Hierarchy level where this preference was defined (set during merge) */
	sourceLevel: z.enum(HierarchyLevel).optional(),

	/** Whether the preference is active */
	active: z.boolean().default(true),
});

export type Preference = z.infer<typeof PreferenceSchema>;

/**
 * Section containing related preferences
 */
export const GuideSectionSchema = z.object({
	/** Normalized section name (lowercase, hyphenated) */
	name: z.string().min(1),

	/** Original Markdown heading text */
	heading: z.string().min(1),

	/** Preferences defined in this section */
	preferences: z.array(PreferenceSchema).default([]),
});

export type GuideSection = z.infer<typeof GuideSectionSchema>;

/**
 * GUIDE.md frontmatter schema
 */
export const GuideFrontmatterSchema = z.object({
	/** Guide identifier (usually "system-guide") */
	name: z.string().default("system-guide"),

	/** Semver version */
	version: z.string().regex(SemverRegex).default("1.0.0"),

	/** Hierarchy level (inferred from file location if not specified) */
	level: z.enum(HierarchyLevel).optional(),

	/** Agent acknowledgment verbosity */
	verbosity: z.enum(VerbosityLevel).default("brief"),
});

export type GuideFrontmatter = z.infer<typeof GuideFrontmatterSchema>;

/**
 * Complete parsed guide from a single GUIDE.md file
 */
export const SystemGuideSchema = z.object({
	/** Guide identifier */
	name: z.string(),

	/** Semver version */
	version: z.string().regex(SemverRegex),

	/** Hierarchy level */
	level: z.enum(HierarchyLevel),

	/** Agent acknowledgment verbosity */
	verbosity: z.enum(VerbosityLevel),

	/** Absolute path to source file */
	filePath: z.string(),

	/** Parsed sections from Markdown body */
	sections: z.array(GuideSectionSchema).default([]),
});

export type SystemGuide = z.infer<typeof SystemGuideSchema>;

/**
 * Reference to a guide file location
 */
export const GuidePathSchema = z.object({
	/** Hierarchy level */
	level: z.enum(HierarchyLevel),

	/** Absolute file path */
	path: z.string(),
});

export type GuidePath = z.infer<typeof GuidePathSchema>;

/**
 * Result of merging guides from all hierarchy levels
 */
export const MergedGuideSchema = z.object({
	/** Merged preferences (deduplicated by ID) */
	preferences: z.array(PreferenceSchema),

	/** Source files that contributed */
	sources: z.array(GuidePathSchema),

	/** Effective verbosity (from lowest level that specified it) */
	verbosity: z.enum(VerbosityLevel),

	/** ISO 8601 timestamp of merge */
	mergedAt: z.string().datetime(),
});

export type MergedGuide = z.infer<typeof MergedGuideSchema>;

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a new preference with defaults
 */
export function createPreference(
	id: string,
	content: string,
	options?: Partial<Omit<Preference, "id" | "content">>,
): Preference {
	return PreferenceSchema.parse({
		id,
		content,
		type: "soft",
		active: true,
		...options,
	});
}

/**
 * Create a new guide section
 */
export function createGuideSection(
	heading: string,
	preferences: Preference[] = [],
): GuideSection {
	const name = heading.toLowerCase().replace(/\s+/g, "-");
	return GuideSectionSchema.parse({
		name,
		heading,
		preferences,
	});
}

/**
 * Create a merged guide result
 */
export function createMergedGuide(
	preferences: Preference[],
	sources: GuidePath[],
	verbosity: VerbosityLevelType = "brief",
): MergedGuide {
	return MergedGuideSchema.parse({
		preferences,
		sources,
		verbosity,
		mergedAt: new Date().toISOString(),
	});
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Options for guide loading
 */
export interface GuideLoadOptions {
	/** Project root path for hierarchy detection */
	projectPath: string;

	/** Whether to include inactive preferences */
	includeInactive?: boolean;

	/** Override verbosity level */
	verbosity?: VerbosityLevelType;
}

/**
 * Result of parsing a GUIDE.md file
 */
export interface ParseGuideResult {
	/** Parsed guide */
	guide: SystemGuide;

	/** Any parsing warnings */
	warnings: string[];

	/** Whether parsing was successful */
	success: boolean;
}

/**
 * Result of guide discovery
 */
export interface DiscoverGuidesResult {
	/** Found guide files */
	guides: GuidePath[];

	/** Paths that were checked but didn't exist */
	checked: string[];
}
