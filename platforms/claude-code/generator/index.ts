import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { CoreSkillSchema } from "@phil-ai/shared/schemas";
import { transformSkillToPlugin, type ClaudeCodePlugin } from "./transform.js";
import { validatePlugin } from "./validate.js";
import { writePlugin } from "./output.js";
import { writeMarketplace } from "./marketplace.js";

const SKILLS_DIR = "core/skills";

export async function generateAll(): Promise<ClaudeCodePlugin[]> {
	const skillDirs = await readdir(SKILLS_DIR);
	const plugins: ClaudeCodePlugin[] = [];

	for (const skillDir of skillDirs) {
		const skillPath = join(SKILLS_DIR, skillDir, "skill.json");

		try {
			const content = await readFile(skillPath, "utf-8");
			const skillData = JSON.parse(content);
			const skill = CoreSkillSchema.parse(skillData);

			const plugin = transformSkillToPlugin(skill);
			const validation = validatePlugin(plugin);

			if (!validation.valid) {
				console.error(`Validation failed for ${skill.name}:`, validation.errors);
				continue;
			}

			await writePlugin(plugin);
			plugins.push(plugin);

			console.log(`Generated: ${plugin.name}`);
		} catch (err) {
			console.error(`Failed to process ${skillDir}:`, err);
		}
	}

	await writeMarketplace(plugins);
	console.log(`Marketplace generated with ${plugins.length} plugins`);

	return plugins;
}

if (import.meta.main) {
	generateAll()
		.then((plugins) => {
			console.log(`\nGenerated ${plugins.length} Claude Code plugins`);
		})
		.catch((err) => {
			console.error("Generation failed:", err);
			process.exit(1);
		});
}
