import { z } from "zod";

// Enum arrays
export const GateResult = ["pass", "fail", "blocked"] as const;
export type GateResultType = (typeof GateResult)[number];

export const GateExecutor = ["agent", "manual", "cli"] as const;
export type GateExecutorType = (typeof GateExecutor)[number];

export const GateSeverity = ["info", "warning", "critical"] as const;
export type GateSeverityType = (typeof GateSeverity)[number];

export const GateRole = ["maintainer", "contributor", "observer"] as const;
export type GateRoleType = (typeof GateRole)[number];

export const GateContext = ["work", "personal", "oss"] as const;
export type GateContextType = (typeof GateContext)[number];

// Schemas
export const GateEntrySchema = z.object({
	name: z.string(),
	date: z.string().datetime(),
	executedBy: z.enum(GateExecutor),
	result: z.enum(GateResult),
	reason: z.string(),
	sourceItemId: z.string(),
	sourceSystem: z.string(),
	context: z.enum(GateContext),
	role: z.enum(GateRole),
	creditsUsed: z.number().optional(),
});

export type GateEntry = z.infer<typeof GateEntrySchema>;

export const GateDefinitionSchema = z.object({
	name: z.string(),
	description: z.string(),
	severity: z.enum(GateSeverity),
	applicableRoles: z.array(z.enum(GateRole)),
});

export type GateDefinition = z.infer<typeof GateDefinitionSchema>;

export const GateLogIndexSchema = z.object({
	entries: z.array(GateEntrySchema),
	lastUpdated: z.string().datetime(),
	totalCount: z.number(),
});

export type GateLogIndex = z.infer<typeof GateLogIndexSchema>;
