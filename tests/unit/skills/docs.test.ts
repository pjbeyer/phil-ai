import { describe, expect, test } from "bun:test";
import { CoreSkillSchema } from "@phil-ai/shared/schemas";

describe("docs skill", () => {
	test("skill.json validates against CoreSkillSchema", async () => {
		const skillJson = await Bun.file("core/skills/docs/skill.json").json();

		const result = CoreSkillSchema.safeParse(skillJson);
		expect(result.success).toBe(true);
	});

	test("has required metadata", async () => {
		const skillJson = await Bun.file("core/skills/docs/skill.json").json();

		expect(skillJson.name).toBe("docs");
		expect(skillJson.category).toBe("docs");
		expect(skillJson.version).toMatch(/^\d+\.\d+\.\d+$/);
	});

	test("SKILL.md exists", async () => {
		const exists = await Bun.file("core/skills/docs/SKILL.md").exists();
		expect(exists).toBe(true);
	});

	test("entryPoint matches actual file", async () => {
		const skillJson = await Bun.file("core/skills/docs/skill.json").json();
		const entryPoint = skillJson.entryPoint || "SKILL.md";
		const exists = await Bun.file(`core/skills/docs/${entryPoint}`).exists();
		expect(exists).toBe(true);
	});
});
