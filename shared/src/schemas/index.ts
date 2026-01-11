export {
	VersionedDataSchema,
	SemverRegex,
	createVersionedData,
	updateVersionedData,
	type VersionedData,
} from "./base.js";

export {
	CoreSkillSchema,
	SkillNameRegex,
	SkillCategory,
	type CoreSkill,
	type SkillCategoryType,
} from "./skill.js";

export {
	PlatformPluginSchema,
	Platform,
	type PlatformPlugin,
	type PlatformType,
} from "./plugin.js";

export {
	ConfigSchema,
	Priority,
	ImpactLevel,
	EffortLevel,
	createDefaultConfig,
	type Config,
	type PriorityType,
	type ImpactLevelType,
	type EffortLevelType,
} from "./config.js";

export {
	ComponentVersionSchema,
	VersionManifestSchema,
	ComponentName,
	createVersionManifest,
	type ComponentVersion,
	type VersionManifest,
	type ComponentNameType,
} from "./version.js";

export {
	LearningSchema,
	PatternSchema,
	StateIndexSchema,
	HierarchyLevel,
	LearningStatus,
	createStateIndex,
	type Learning,
	type Pattern,
	type StateIndex,
	type HierarchyLevelType,
	type LearningStatusType,
} from "./state.js";

export {
	PreferenceSchema,
	GuideSectionSchema,
	GuideFrontmatterSchema,
	SystemGuideSchema,
	GuidePathSchema,
	MergedGuideSchema,
	GuideHierarchyLevel,
	PreferenceType,
	VerbosityLevel,
	PreferenceIdRegex,
	GuideSemverRegex,
	createPreference,
	createGuideSection,
	createMergedGuide,
	getPreferencesFromGuide,
	type Preference,
	type GuideSection,
	type GuideFrontmatter,
	type SystemGuide,
	type GuidePath,
	type MergedGuide,
	type GuideHierarchyLevelType,
	type PreferenceTypeType,
	type VerbosityLevelType,
} from "./guide.js";
