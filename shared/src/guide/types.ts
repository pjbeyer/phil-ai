import type {
	GuideHierarchyLevelType,
	GuidePath,
	SystemGuide,
	VerbosityLevelType,
} from "../schemas/guide.js";

export interface GuideLoadOptions {
	projectPath: string;
	includeInactive?: boolean;
	verbosity?: VerbosityLevelType;
	platform?: "claude-code" | "opencode";
}

export interface ParseGuideResult {
	guide: SystemGuide;
	warnings: string[];
	success: boolean;
}

export interface DiscoverGuidesResult {
	guides: GuidePath[];
	checked: string[];
}

export interface GuidePathInfo {
	level: GuideHierarchyLevelType;
	path: string;
	exists: boolean;
}

export type {
	GuidePath,
	SystemGuide,
	GuideHierarchyLevelType,
	VerbosityLevelType,
};
