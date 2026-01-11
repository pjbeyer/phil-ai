import { z } from "zod";

export const SkillNameRegex = /^[a-z][a-z0-9-]*$/;

export const CoreSkillSchema = z.object({
	name: z.string().regex(SkillNameRegex).max(64),
	version: z.string().regex(/^\d+\.\d+\.\d+$/),
	description: z.string().max(500),

	category: z.enum(["learning", "docs", "context", "workflow"]),
	tags: z.array(z.string()).default([]),

	allowedTools: z.array(z.string()).optional(),
	permissions: z.array(z.string()).optional(),

	entryPoint: z.string().default("SKILL.md"),
	references: z.array(z.string()).optional(),
	scripts: z.array(z.string()).optional(),

	author: z
		.object({
			name: z.string(),
			email: z.string().email().optional(),
		})
		.optional(),
	repository: z.string().url().optional(),
	license: z.string().default("MIT"),
});

export type CoreSkill = z.infer<typeof CoreSkillSchema>;

export const SkillCategory = [
	"learning",
	"docs",
	"context",
	"workflow",
] as const;
export type SkillCategoryType = (typeof SkillCategory)[number];
