import { mkdir, writeFile, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import type { ClaudeCodePlugin } from "./transform.js";
import { render } from "./render.js";

const OUTPUT_DIR = "platforms/claude-code/output";

export async function writePlugin(plugin: ClaudeCodePlugin): Promise<string> {
	const pluginDir = join(OUTPUT_DIR, plugin.name);

	await mkdir(join(pluginDir, ".claude-plugin"), { recursive: true });
	await mkdir(join(pluginDir, "commands"), { recursive: true });
	await mkdir(join(pluginDir, "skills", plugin.skills[0]?.name ?? "default"), {
		recursive: true,
	});

	const pluginJson = {
		name: plugin.name,
		version: plugin.version,
		description: plugin.description,
		commands: plugin.commands.map((c) => ({
			name: c.name,
			description: c.description,
			skill: `skills/${plugin.skills[0]?.name ?? "default"}/SKILL.md`,
		})),
	};

	await writeFile(
		join(pluginDir, ".claude-plugin", "plugin.json"),
		JSON.stringify(pluginJson, null, 2),
	);

	for (const cmd of plugin.commands) {
		const commandContent = `# /${cmd.name}\n\n${cmd.description}\n\nSee skill documentation for details.\n`;
		await writeFile(join(pluginDir, "commands", `${cmd.name}.md`), commandContent);
	}

	const skillName = plugin.skills[0]?.name ?? "default";
	try {
		const skillContent = await readFile(
			`core/skills/${skillName}/SKILL.md`,
			"utf-8",
		);
		await writeFile(
			join(pluginDir, "skills", skillName, "SKILL.md"),
			skillContent,
		);
	} catch {
		await writeFile(
			join(pluginDir, "skills", skillName, "SKILL.md"),
			`# ${skillName}\n\nSkill documentation.\n`,
		);
	}

	const readme = `# ${plugin.name}\n\n${plugin.description}\n\n## Commands\n\n${plugin.commands.map((c) => `- \`/${c.name}\` - ${c.description}`).join("\n")}\n\n## Installation\n\n\`\`\`bash\n/plugin install ${plugin.name}@phil-ai\n\`\`\`\n`;
	await writeFile(join(pluginDir, "README.md"), readme);

	return pluginDir;
}
