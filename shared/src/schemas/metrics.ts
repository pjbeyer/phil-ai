import { z } from "zod";

// Enum arrays
export const ScorecardContext = ["work", "personal", "oss", "aggregate"] as const;
export type ScorecardContextType = (typeof ScorecardContext)[number];

export const DimensionTrend = ["up", "down", "stable"] as const;
export type DimensionTrendType = (typeof DimensionTrend)[number];

// Schemas
export const ScorecardDimensionSchema = z.object({
	score: z.number().min(1).max(5),
	evidence: z.string(),
	trend: z.enum(DimensionTrend),
});

export type ScorecardDimension = z.infer<typeof ScorecardDimensionSchema>;

export const ScorecardEntrySchema = z.object({
	date: z.string().datetime(),
	context: z.enum(ScorecardContext),
	dimensions: z.record(z.string(), ScorecardDimensionSchema),
	average: z.number(),
	notes: z.string().optional(),
});

export type ScorecardEntry = z.infer<typeof ScorecardEntrySchema>;

export const MetricsSnapshotSchema = z.object({
	period: z.string(),
	context: z.enum(ScorecardContext),
	velocity: z.number(),
	avgDuration: z.number(),
	gatePassRate: z.number().min(0).max(1),
	activeItems: z.number().int(),
	completedItems: z.number().int(),
});

export type MetricsSnapshot = z.infer<typeof MetricsSnapshotSchema>;
