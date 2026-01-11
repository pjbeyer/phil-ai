import { z } from "zod";

/**
 * Zod schemas for scaffold command validation
 */

// Plugin manifest from .claude-plugin/plugin.json
export const PluginManifestSchema = z.object({
	name: z.string().min(1, "Plugin name is required"),
	version: z
		.string()
		.regex(/^\d+\.\d+\.\d+/, "Invalid version format (expected: x.y.z)"),
	description: z.string().min(1, "Description is required"),
	author: z
		.object({
			name: z.string().min(1, "Author name is required"),
			email: z.string().email().optional(),
			url: z.string().url().optional(),
		})
		.optional(),
	repository: z.string().url().optional(),
	license: z.string().optional(),
	homepage: z.string().url().optional(),
});

export type PluginManifest = z.infer<typeof PluginManifestSchema>;

// Command frontmatter from commands/*.md
export const CommandFrontmatterSchema = z.object({
	description: z.string().optional(),
	agent: z.string().optional(),
	model: z.string().optional(),
	subtask: z.boolean().optional(),
});

export type CommandFrontmatter = z.infer<typeof CommandFrontmatterSchema>;

// Skill frontmatter from skills/*/SKILL.md
export const SkillFrontmatterSchema = z.object({
	name: z.string().optional(),
	description: z.string().optional(),
});

export type SkillFrontmatter = z.infer<typeof SkillFrontmatterSchema>;
