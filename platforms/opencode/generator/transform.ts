import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { CoreSkill } from "@phil-ai/shared/schemas";
import { renderMcpJson, renderSkillMd } from "./render.js";

export interface McpServerConfig {
	command: string;
	args: string[];
}

export interface McpConfig {
	mcpServers: Record<string, McpServerConfig>;
}

export interface SkillArtifact {
	skillDir: string;
	skillMd: string;
	mcpJson: McpConfig;
}

export interface TransformOptions {
	skillNameSuffix?: string;
	skillDirName?: string;
	mcpCommand?: string;
	mcpArgs?: string[];
}

export async function transformSkillToArtifact(
	skill: CoreSkill,
	sourceSkillDir: string,
	options: TransformOptions = {},
): Promise<SkillArtifact> {
	const sourceSkillMd = await readFile(join(sourceSkillDir, "SKILL.md"), "utf-8");
	const transformedSkill = withSkillNameSuffix(skill, options.skillNameSuffix);
	const skillDir = options.skillDirName ?? transformedSkill.name;
	const skillMd = renderSkillMd(transformedSkill, sourceSkillMd);
	const renderOptions: { mcpCommand?: string; mcpArgs?: string[] } = {};

	if (options.mcpCommand !== undefined) {
		renderOptions.mcpCommand = options.mcpCommand;
	}
	if (options.mcpArgs !== undefined) {
		renderOptions.mcpArgs = options.mcpArgs;
	}

	const mcpJson = JSON.parse(
		renderMcpJson(transformedSkill, renderOptions),
	) as McpConfig;

	return {
		skillDir,
		skillMd,
		mcpJson,
	};
}

function withSkillNameSuffix(skill: CoreSkill, suffix?: string): CoreSkill {
	if (!suffix) {
		return skill;
	}

	return {
		...skill,
		name: `${skill.name}${suffix}`,
	};
}
