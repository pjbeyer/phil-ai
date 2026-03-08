import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { SkillArtifact } from "./transform.js";

const DEFAULT_OUTPUT_DIR = "platforms/opencode/output";

export async function writePlugin(
	skills: SkillArtifact[],
	version: string,
	outputDir = DEFAULT_OUTPUT_DIR,
): Promise<string> {
	const pluginDir = outputDir;

	await mkdir(join(pluginDir, "src"), { recursive: true });
	await mkdir(join(pluginDir, "skills"), { recursive: true });

	const packageJson = {
		name: "@phil-ai/opencode-plugin",
		version,
		private: true,
		type: "module",
		main: "./src/index.ts",
		dependencies: {
			"@opencode-ai/plugin": "^1.2.20",
		},
	};

	await writeFile(
		join(pluginDir, "package.json"),
		`${JSON.stringify(packageJson, null, 2)}\n`,
	);

	for (const skill of skills) {
		const skillDir = join(pluginDir, "skills", skill.skillDir);
		await mkdir(skillDir, { recursive: true });
		await writeFile(
			join(skillDir, "SKILL.md"),
			skill.skillMd,
		);
		await writeFile(
			join(skillDir, "mcp.json"),
			`${JSON.stringify(skill.mcpJson, null, 2)}\n`,
		);
	}

	const indexContent = generatePluginEntryPoint();
	await writeFile(join(pluginDir, "src", "index.ts"), indexContent);

	return pluginDir;
}

function generatePluginEntryPoint(): string {
	return `import type { Plugin } from "@opencode-ai/plugin";
import { cp, mkdir, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = join(__dirname, "..", "skills");
const PLUGIN_NAME = "phil-ai";

async function installSkills(targetDir: string): Promise<string[]> {
	await mkdir(targetDir, { recursive: true });
	const entries = await readdir(SKILLS_DIR, { withFileTypes: true });
	const installedSkills: string[] = [];

	for (const entry of entries) {
		if (!entry.isDirectory()) {
			continue;
		}

		const source = join(SKILLS_DIR, entry.name);
		const destination = join(targetDir, entry.name);
		await cp(source, destination, { recursive: true, force: true });
		installedSkills.push(entry.name);
	}

	return installedSkills;
}

const plugin: Plugin = async (input) => {
	const targetDir = join(input.directory, "..", "skills");
	const installedSkills = await installSkills(targetDir);

	return {
		async config(config) {
			config.skill = config.skill ?? {};
			for (const skillName of installedSkills) {
				config.skill[skillName] = {
					path: join(targetDir, skillName, "SKILL.md"),
				};
			}
		},
		metadata: {
			name: PLUGIN_NAME,
			installedSkills,
		},
	};
};

export default plugin;
`;
}
