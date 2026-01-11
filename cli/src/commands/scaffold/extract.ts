import path from "node:path";
import {
	type CommandFrontmatter,
	type PluginManifest,
	PluginManifestSchema,
	type SkillFrontmatter,
} from "./schemas.js";

export interface ParsedCommand {
	name: string;
	path: string;
	frontmatter: CommandFrontmatter;
	template: string;
}

export interface ParsedSkill {
	name: string;
	path: string;
	frontmatter: SkillFrontmatter;
	content: string;
}

export async function parsePluginManifest(
	pluginPath: string,
): Promise<PluginManifest> {
	const pluginJsonPath = path.join(pluginPath, ".claude-plugin", "plugin.json");
	const data = await Bun.file(pluginJsonPath).json();
	return PluginManifestSchema.parse(data);
}

function parseFrontmatter(content: string): {
	frontmatter: Record<string, string | boolean>;
	body: string;
} {
	const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
	const match = content.match(frontmatterRegex);

	if (!match) {
		return { frontmatter: {}, body: content.trim() };
	}

	const [, yamlContent, body] = match;
	const frontmatter: Record<string, string | boolean> = {};

	if (yamlContent) {
		for (const line of yamlContent.split("\n")) {
			const colonIndex = line.indexOf(":");
			if (colonIndex === -1) continue;

			const key = line.slice(0, colonIndex).trim();
			const value = line.slice(colonIndex + 1).trim();

			if (key === "subtask") {
				frontmatter[key] = value === "true";
			} else {
				frontmatter[key] = value;
			}
		}
	}

	return { frontmatter, body: (body ?? "").trim() };
}

export async function scanCommands(
	pluginPath: string,
): Promise<ParsedCommand[]> {
	const commands: ParsedCommand[] = [];
	const commandDir = path.join(pluginPath, "commands");

	try {
		const glob = new Bun.Glob("**/*.md");

		for await (const file of glob.scan({ cwd: commandDir, absolute: true })) {
			const content = await Bun.file(file).text();
			const { frontmatter, body } = parseFrontmatter(content);

			const relativePath = path.relative(commandDir, file);
			const name = relativePath.replace(/\.md$/, "").replace(/\//g, "-");

			commands.push({
				name,
				path: relativePath,
				frontmatter: {
					description:
						typeof frontmatter.description === "string"
							? frontmatter.description
							: undefined,
					agent:
						typeof frontmatter.agent === "string"
							? frontmatter.agent
							: undefined,
					model:
						typeof frontmatter.model === "string"
							? frontmatter.model
							: undefined,
					subtask:
						typeof frontmatter.subtask === "boolean"
							? frontmatter.subtask
							: undefined,
				},
				template: body,
			});
		}
	} catch {
		// commands/ directory doesn't exist - return empty array
	}

	return commands;
}

export async function scanSkills(pluginPath: string): Promise<ParsedSkill[]> {
	const skills: ParsedSkill[] = [];
	const skillsDir = path.join(pluginPath, "skills");

	try {
		const glob = new Bun.Glob("*/SKILL.md");

		for await (const file of glob.scan({ cwd: skillsDir, absolute: true })) {
			const content = await Bun.file(file).text();
			const { frontmatter, body } = parseFrontmatter(content);

			const relativePath = path.relative(skillsDir, file);
			const dirName = path.dirname(relativePath);

			skills.push({
				name: typeof frontmatter.name === "string" ? frontmatter.name : dirName,
				path: relativePath,
				frontmatter: {
					name:
						typeof frontmatter.name === "string" ? frontmatter.name : undefined,
					description:
						typeof frontmatter.description === "string"
							? frontmatter.description
							: undefined,
				},
				content: body,
			});
		}
	} catch {
		// skills/ directory doesn't exist - return empty array
	}

	return skills;
}
