import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeDevPlugin } from "../../../platforms/opencode/generator/output-dev";
import type { SkillArtifact } from "../../../platforms/opencode/generator/transform";
import { validateGeneratedOutput } from "../../../platforms/opencode/generator/validate";

const tempDirs: string[] = [];

afterEach(async () => {
	for (const dir of tempDirs.splice(0)) {
		await rm(dir, { recursive: true, force: true });
	}
});

describe("writeDevPlugin", () => {
	test("writes dev plugin and -dev skills", async () => {
		const root = await mkdtemp(join(tmpdir(), "phil-ai-dev-output-"));
		tempDirs.push(root);

		const pluginsDir = join(root, ".opencode", "plugins");
		const skillsDir = join(root, ".opencode", "skills");

		const skills: SkillArtifact[] = [
			{
				skillDir: "learning-dev",
				skillMd:
					"---\nname: learning-dev\ndescription: \"Learning dev\"\n---\n\n# Learning Dev\n",
				mcpJson: {
					mcpServers: {
						"learning-dev": {
							command: "bun",
							args: ["run", "/abs/mcp/dist/server.js"],
						},
					},
				},
			},
		];

		const result = await writeDevPlugin(skills, pluginsDir, skillsDir);

		const pluginContent = await readFile(result.pluginPath, "utf-8");
		expect(pluginContent).toContain("phil-ai-dev");
		expect(pluginContent).toContain("learning-dev");

		const devSkillContent = await readFile(
			join(result.skillsDir, "learning-dev", "SKILL.md"),
			"utf-8",
		);
		expect(devSkillContent).toContain("name: learning-dev");

		const validation = await validateGeneratedOutput(root, {
			expectedSkillDirs: ["learning-dev"],
			skillsRoot: result.skillsDir,
			pluginEntryPath: result.pluginPath,
			requirePackageJson: false,
		});

		expect(validation.valid).toBe(true);
		expect(validation.errors).toEqual([]);
	});
});
