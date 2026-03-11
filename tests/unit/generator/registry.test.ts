import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateRegistry } from "../../../platforms/opencode/generator/registry";
import type { CoreSkill } from "@phil-ai/shared/schemas";

interface LoadedSkill {
	skillDir: string;
	sourcePath: string;
	skill: CoreSkill;
}

const tempDirs: string[] = [];

afterEach(async () => {
	for (const dir of tempDirs.splice(0)) {
		await rm(dir, { recursive: true, force: true });
	}
});

describe("generateRegistry", () => {
	test("writes valid JSON to the specified path", async () => {
		const tempDir = await mkdtemp(join(tmpdir(), "registry-test-"));
		tempDirs.push(tempDir);
		const outputPath = join(tempDir, "registry.jsonc");

		const mockSkills: LoadedSkill[] = [
			{
				skillDir: "learning",
				sourcePath: "/path/to/learning",
				skill: {
					name: "learning",
					version: "1.0.0",
					description: "Capture and implement learnings",
					category: "learning",
					tags: [],
					license: "MIT",
				},
			},
		];

		await generateRegistry(mockSkills, outputPath);

		const content = await readFile(outputPath, "utf-8");
		const registry = JSON.parse(content);

		expect(registry).toBeDefined();
		expect(registry.$schema).toBe("https://ocx.kdco.dev/schemas/v2/registry.json");
		expect(registry.name).toBe("phil-ai");
		expect(registry.version).toBe("1.0.0");
		expect(registry.author).toBe("pjbeyer");
	});

	test("includes all skills as components", async () => {
		const tempDir = await mkdtemp(join(tmpdir(), "registry-test-"));
		tempDirs.push(tempDir);
		const outputPath = join(tempDir, "registry.jsonc");

		const mockSkills: LoadedSkill[] = [
			{
				skillDir: "learning",
				sourcePath: "/path/to/learning",
				skill: {
					name: "learning",
					version: "1.0.0",
					description: "Capture and implement learnings",
					category: "learning",
					tags: [],
					license: "MIT",
				},
			},
			{
				skillDir: "docs",
				sourcePath: "/path/to/docs",
				skill: {
					name: "docs",
					version: "1.0.0",
					description: "Hierarchical documentation",
					category: "docs",
					tags: [],
					license: "MIT",
				},
			},
			{
				skillDir: "context",
				sourcePath: "/path/to/context",
				skill: {
					name: "context",
					version: "1.0.0",
					description: "Optimize AGENTS.md files",
					category: "context",
					tags: [],
					license: "MIT",
				},
			},
			{
				skillDir: "workflow",
				sourcePath: "/path/to/workflow",
				skill: {
					name: "workflow",
					version: "1.0.0",
					description: "Work tracking and git integration",
					category: "workflow",
					tags: [],
					license: "MIT",
				},
			},
			{
				skillDir: "guide",
				sourcePath: "/path/to/guide",
				skill: {
					name: "guide",
					version: "1.0.0",
					description: "System guide for user preferences",
					category: "guide",
					tags: [],
					license: "MIT",
				},
			},
		];

		await generateRegistry(mockSkills, outputPath);

		const content = await readFile(outputPath, "utf-8");
		const registry = JSON.parse(content);

		expect(registry.components).toHaveLength(5);
		expect(registry.components.map((c: { name: string }) => c.name)).toEqual([
			"learning",
			"docs",
			"context",
			"workflow",
			"guide",
		]);
	});

	test("generates correct component structure with files paths", async () => {
		const tempDir = await mkdtemp(join(tmpdir(), "registry-test-"));
		tempDirs.push(tempDir);
		const outputPath = join(tempDir, "registry.jsonc");

		const mockSkills: LoadedSkill[] = [
			{
				skillDir: "learning",
				sourcePath: "/path/to/learning",
				skill: {
					name: "learning",
					version: "1.0.0",
					description: "Capture and implement learnings",
					category: "learning",
					tags: [],
					license: "MIT",
				},
			},
		];

		await generateRegistry(mockSkills, outputPath);

		const content = await readFile(outputPath, "utf-8");
		const registry = JSON.parse(content);

		const component = registry.components[0];
		expect(component.name).toBe("learning");
		expect(component.type).toBe("skill");
		expect(component.description).toBe("Capture and implement learnings");
		expect(component.files).toEqual([
			"platforms/opencode/output/skills/learning/SKILL.md",
			"platforms/opencode/output/skills/learning/mcp.json",
		]);
	});

	test("writes file with trailing newline", async () => {
		const tempDir = await mkdtemp(join(tmpdir(), "registry-test-"));
		tempDirs.push(tempDir);
		const outputPath = join(tempDir, "registry.jsonc");

		const mockSkills: LoadedSkill[] = [
			{
				skillDir: "learning",
				sourcePath: "/path/to/learning",
				skill: {
					name: "learning",
					version: "1.0.0",
					description: "Capture and implement learnings",
					category: "learning",
					tags: [],
					license: "MIT",
				},
			},
		];

		await generateRegistry(mockSkills, outputPath);

		const content = await readFile(outputPath, "utf-8");
		expect(content.endsWith("\n")).toBe(true);
	});
});
