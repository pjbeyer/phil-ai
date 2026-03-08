import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateGeneratedOutput } from "../../../platforms/opencode/generator/validate";

const tempDirs: string[] = [];

afterEach(async () => {
	for (const dir of tempDirs.splice(0)) {
		await rm(dir, { recursive: true, force: true });
	}
});

describe("validateGeneratedOutput", () => {
	test("accepts valid generated output", async () => {
		const root = await mkdtemp(join(tmpdir(), "phil-ai-validate-valid-"));
		tempDirs.push(root);

		await mkdir(join(root, "skills", "learning"), { recursive: true });
		await mkdir(join(root, "src"), { recursive: true });

		await writeFile(
			join(root, "skills", "learning", "SKILL.md"),
			"---\nname: learning\ndescription: \"Learning\"\n---\n\n# Learning\n",
		);
		await writeFile(
			join(root, "skills", "learning", "mcp.json"),
			JSON.stringify(
				{
					mcpServers: {
						learning: {
							command: "phil-ai-mcp",
							args: [],
						},
					},
				},
				null,
				2,
			),
		);
		await writeFile(join(root, "src", "index.ts"), "const plugin = async () => ({});\nexport default plugin;\n");
		await writeFile(
			join(root, "package.json"),
			JSON.stringify(
				{
					dependencies: {
						"@opencode-ai/plugin": "^1.2.20",
					},
				},
				null,
				2,
			),
		);

		const result = await validateGeneratedOutput(root, {
			expectedSkillDirs: ["learning"],
			pluginEntryPath: join(root, "src", "index.ts"),
			requirePackageJson: true,
		});

		expect(result.valid).toBe(true);
		expect(result.errors).toEqual([]);
	});

	test("reports missing files and invalid metadata", async () => {
		const root = await mkdtemp(join(tmpdir(), "phil-ai-validate-invalid-"));
		tempDirs.push(root);

		await mkdir(join(root, "skills", "learning"), { recursive: true });
		await mkdir(join(root, "src"), { recursive: true });

		await writeFile(join(root, "skills", "learning", "SKILL.md"), "# missing frontmatter\n");
		await writeFile(join(root, "skills", "learning", "mcp.json"), "{}\n");
		await writeFile(join(root, "src", "index.ts"), "export const plugin = async () => ({});\n");
		await writeFile(join(root, "package.json"), JSON.stringify({ dependencies: {} }));

		const result = await validateGeneratedOutput(root, {
			expectedSkillDirs: ["learning"],
			pluginEntryPath: join(root, "src", "index.ts"),
			requirePackageJson: true,
		});

		expect(result.valid).toBe(false);
		expect(result.errors.some((error) => error.includes("frontmatter"))).toBe(true);
		expect(result.errors.some((error) => error.includes("mcpServers"))).toBe(true);
		expect(result.errors.some((error) => error.includes("default function"))).toBe(true);
		expect(result.errors.some((error) => error.includes("@opencode-ai/plugin"))).toBe(true);
	});
});
