import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { SkillArtifact } from "./transform.js";

export interface DevOutputResult {
	pluginPath: string;
	skillsDir: string;
}

export async function writeDevPlugin(
	skills: SkillArtifact[],
	devPluginsDir: string,
	devSkillsDir: string,
): Promise<DevOutputResult> {
	await mkdir(devPluginsDir, { recursive: true });
	await mkdir(devSkillsDir, { recursive: true });

	for (const skill of skills) {
		const skillDir = join(devSkillsDir, skill.skillDir);
		await mkdir(skillDir, { recursive: true });
		await writeFile(join(skillDir, "SKILL.md"), skill.skillMd);
		await writeFile(
			join(skillDir, "mcp.json"),
			`${JSON.stringify(skill.mcpJson, null, 2)}\n`,
		);
	}

	const pluginPath = join(devPluginsDir, "phil-ai-dev.ts");
	await writeFile(
		pluginPath,
		generateDevPluginEntryPoint(skills.map((skill) => skill.skillDir)),
	);

	return {
		pluginPath,
		skillsDir: devSkillsDir,
	};
}

function generateDevPluginEntryPoint(skillNames: string[]): string {
	const serializedSkillNames = JSON.stringify(skillNames);

	return `import type { Plugin } from "@opencode-ai/plugin";
import { join } from "node:path";

const PLUGIN_NAME = "phil-ai-dev";
const SKILL_NAMES = ${serializedSkillNames};

const plugin: Plugin = async () => {
	const skillsRoot = join(import.meta.dir, "..", "skills");

	return {
		async config(config) {
			config.skill = config.skill ?? {};
			for (const skillName of SKILL_NAMES) {
				config.skill[skillName] = {
					path: join(skillsRoot, skillName, "SKILL.md"),
				};
			}
		},
		metadata: {
			name: PLUGIN_NAME,
		},
	};
};

export default plugin;
`;
}
