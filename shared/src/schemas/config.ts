import { z } from "zod";
import { SemverRegex } from "./base.js";

export const Priority = ["P0", "P1", "P2", "P3", "P4"] as const;
export type PriorityType = (typeof Priority)[number];

export const ImpactLevel = ["high", "medium", "low"] as const;
export type ImpactLevelType = (typeof ImpactLevel)[number];

export const EffortLevel = ["high", "medium", "low"] as const;
export type EffortLevelType = (typeof EffortLevel)[number];

export const ConfigSchema = z.object({
	_version: z.string().regex(SemverRegex),

	defaults: z
		.object({
			priority: z.enum(Priority).default("P3"),
			impact: z.enum(ImpactLevel).default("medium"),
			effort: z.enum(EffortLevel).default("medium"),
		})
		.default({}),

	profiles: z
		.record(
			z.string(),
			z.object({
				path: z.string(),
				categories: z.array(z.string()),
			}),
		)
		.default({}),

	platforms: z
		.object({
			claudeCode: z
				.object({
					enabled: z.boolean().default(true),
					marketplacePath: z.string().optional(),
				})
				.default({}),
			opencode: z
				.object({
					enabled: z.boolean().default(true),
					pluginPath: z.string().optional(),
				})
				.default({}),
		})
		.default({}),

	mcp: z
		.object({
			port: z.number().default(3000),
			host: z.string().default("localhost"),
		})
		.default({}),
});

export type Config = z.infer<typeof ConfigSchema>;

export function createDefaultConfig(): Config {
	return {
		_version: "1.0.0",
		defaults: {
			priority: "P3",
			impact: "medium",
			effort: "medium",
		},
		profiles: {},
		platforms: {
			claudeCode: { enabled: true },
			opencode: { enabled: true },
		},
		mcp: {
			port: 3000,
			host: "localhost",
		},
	};
}
