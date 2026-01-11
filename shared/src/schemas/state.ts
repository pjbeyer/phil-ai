import { z } from "zod";
import { VersionedDataSchema } from "./base.js";

export const HierarchyLevel = [
	"global",
	"profile",
	"project",
	"agent",
] as const;
export type HierarchyLevelType = (typeof HierarchyLevel)[number];

export const LearningStatus = [
	"open",
	"in-progress",
	"testing",
	"blocked",
	"closed",
] as const;
export type LearningStatusType = (typeof LearningStatus)[number];

export const Priority = ["P0", "P1", "P2", "P3", "P4"] as const;
export const ImpactLevel = ["high", "medium", "low"] as const;
export const EffortLevel = ["high", "medium", "low"] as const;

export const LearningSchema = VersionedDataSchema.extend({
	id: z.string().uuid(),
	title: z.string(),
	category: z.string(),
	level: z.enum(HierarchyLevel),
	status: z.enum(LearningStatus),
	priority: z.enum(Priority),
	impact: z.enum(ImpactLevel),
	effort: z.enum(EffortLevel),
	tags: z.array(z.string()),
	content: z.object({
		problem: z.string(),
		solution: z.string(),
		documentationPath: z.string().optional(),
	}),
	closedAt: z.string().datetime().optional(),
});

export type Learning = z.infer<typeof LearningSchema>;

export const PatternSchema = VersionedDataSchema.extend({
	id: z.string().uuid(),
	name: z.string(),
	category: z.string(),
	level: z.enum(HierarchyLevel),
	extractedFrom: z.array(z.string()),
	content: z.string(),
});

export type Pattern = z.infer<typeof PatternSchema>;

export const StateIndexSchema = VersionedDataSchema.extend({
	learnings: z.record(z.string(), z.string()),
	patterns: z.record(z.string(), z.string()),
	lastSync: z.string().datetime().optional(),
});

export type StateIndex = z.infer<typeof StateIndexSchema>;

export function createStateIndex(version: string): StateIndex {
	const now = new Date().toISOString();
	return {
		_version: version,
		_created: now,
		_modified: now,
		learnings: {},
		patterns: {},
	};
}
