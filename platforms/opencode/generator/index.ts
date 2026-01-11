import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { CoreSkillSchema } from "@phil-ai/shared/schemas";
import { writePlugin } from "./output.js";
import { type OpenCodeTool, transformSkillToPlugin } from "./transform.js";
import { validatePlugin } from "./validate.js";

const SKILLS_DIR = "core/skills";

export async function generateAll(): Promise<OpenCodeTool[]> {
	const skillDirs = await readdir(SKILLS_DIR);
	const allTools: OpenCodeTool[] = [];

	for (const skillDir of skillDirs) {
		const skillPath = join(SKILLS_DIR, skillDir, "skill.json");

		try {
			const content = await readFile(skillPath, "utf-8");
			const skillData = JSON.parse(content);
			const skill = CoreSkillSchema.parse(skillData);

			const plugin = transformSkillToPlugin(skill);
			const validation = validatePlugin(plugin);

			if (!validation.valid) {
				console.error(
					`Validation failed for ${skill.name}:`,
					validation.errors,
				);
				continue;
			}

			allTools.push(...plugin.tools);
			console.log(`Processed: ${skill.name} (${plugin.tools.length} tools)`);
		} catch (err) {
			console.error(`Failed to process ${skillDir}:`, err);
		}
	}

	await writePlugin(allTools, "0.1.0");
	console.log(`OpenCode plugin generated with ${allTools.length} tools`);

	return allTools;
}

if (import.meta.main) {
	generateAll()
		.then((tools) => {
			console.log(`\nGenerated OpenCode plugin with ${tools.length} tools`);
		})
		.catch((err) => {
			console.error("Generation failed:", err);
			process.exit(1);
		});
}
