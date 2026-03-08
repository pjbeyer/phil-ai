import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writePlugin } from "../../../platforms/opencode/generator/output";
import type { SkillArtifact } from "../../../platforms/opencode/generator/transform";
import { validateGeneratedOutput } from "../../../platforms/opencode/generator/validate";

const tempDirs: string[] = [];

afterEach(async () => {
	for (const dir of tempDirs.splice(0)) {
		await rm(dir, { recursive: true, force: true });
	}
});

describe("writePlugin", () => {
	test("writes production plugin structure with skills and plugin entry", async () => {
		const outputRoot = await mkdtemp(join(tmpdir(), "phil-ai-output-"));
		tempDirs.push(outputRoot);

		const skills: SkillArtifact[] = [
			{
				skillDir: "learning",
				skillMd: "---\nname: learning\ndescription: \"Learning\"\n---\n\n# Learning\n",
				mcpJson: {
					mcpServers: {
						learning: { command: "phil-ai-mcp", args: [] },
					},
				},
			},
			{
				skillDir: "docs",
				skillMd: "---\nname: docs\ndescription: \"Docs\"\n---\n\n# Docs\n",
				mcpJson: {
					mcpServers: {
						docs: { command: "phil-ai-mcp", args: [] },
					},
				},
			},
		];

		const pluginDir = await writePlugin(skills, "1.2.3", outputRoot);

		const packageJson = await readFile(join(pluginDir, "package.json"), "utf-8");
		expect(packageJson).toContain("@opencode-ai/plugin");

		const indexTs = await readFile(join(pluginDir, "src", "index.ts"), "utf-8");
		expect(indexTs).toContain("const plugin: Plugin");
		expect(indexTs).toContain("export default plugin");

		const learningSkill = await readFile(
			join(pluginDir, "skills", "learning", "SKILL.md"),
			"utf-8",
		);
		expect(learningSkill).toContain("name: learning");

		const validation = await validateGeneratedOutput(pluginDir, {
			expectedSkillDirs: ["learning", "docs"],
			pluginEntryPath: join(pluginDir, "src", "index.ts"),
			requirePackageJson: true,
		});

		expect(validation.valid).toBe(true);
		expect(validation.errors).toEqual([]);
	});
});
