import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CoreSkillSchema } from "@phil-ai/shared/schemas";
import { transformSkillToArtifact } from "../../../platforms/opencode/generator/transform";

const tempDirs: string[] = [];

afterEach(async () => {
	for (const dir of tempDirs.splice(0)) {
		await rm(dir, { recursive: true, force: true });
	}
});

describe("transformSkillToArtifact", () => {
	test("transforms core skill to SKILL.md and mcp.json artifact", async () => {
		const skill = CoreSkillSchema.parse({
			name: "learning",
			version: "1.0.0",
			description: "Capture and implement learnings",
			category: "learning",
		});
		const skillDir = await mkdtemp(join(tmpdir(), "phil-ai-transform-"));
		tempDirs.push(skillDir);
		await writeFile(join(skillDir, "SKILL.md"), "# Learning Skill\n\nDetails.");

		const artifact = await transformSkillToArtifact(skill, skillDir);
		const learningServer = artifact.mcpJson.mcpServers.learning;
		expect(learningServer).toBeDefined();

		expect(artifact.skillDir).toBe("learning");
		expect(artifact.skillMd).toContain("name: learning");
		expect(artifact.skillMd).toContain("# Learning Skill");
		expect(learningServer?.command).toBe("phil-ai-mcp");
		expect(learningServer?.args).toEqual([]);
	});

	test("supports dev skill naming and MCP command overrides", async () => {
		const skill = CoreSkillSchema.parse({
			name: "docs",
			version: "1.0.0",
			description: "Documentation tooling",
			category: "docs",
		});
		const skillDir = await mkdtemp(join(tmpdir(), "phil-ai-transform-dev-"));
		tempDirs.push(skillDir);
		await writeFile(join(skillDir, "SKILL.md"), "# Docs Skill\n\nDetails.");

		const artifact = await transformSkillToArtifact(skill, skillDir, {
			skillNameSuffix: "-dev",
			skillDirName: "docs-dev",
			mcpCommand: "bun",
			mcpArgs: ["run", "/absolute/mcp/dist/server.js"],
		});

		expect(artifact.skillDir).toBe("docs-dev");
		expect(artifact.skillMd).toContain("name: docs-dev");
		expect(artifact.mcpJson.mcpServers["docs-dev"]?.command).toBe("bun");
		expect(artifact.mcpJson.mcpServers["docs-dev"]?.args).toEqual([
			"run",
			"/absolute/mcp/dist/server.js",
		]);
	});
});
