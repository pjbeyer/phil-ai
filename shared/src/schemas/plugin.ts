import { z } from "zod";

export const Platform = ["claude-code", "opencode"] as const;
export type PlatformType = (typeof Platform)[number];

export const PlatformPluginSchema = z.object({
	name: z.string(),
	version: z.string(),
	description: z.string(),

	platform: z.enum(Platform),

	generatedAt: z.string().datetime(),
	generatedFrom: z.string(),
	generatorVersion: z.string(),

	outputPath: z.string(),

	validated: z.boolean().default(false),
	validationErrors: z.array(z.string()).optional(),
});

export type PlatformPlugin = z.infer<typeof PlatformPluginSchema>;
