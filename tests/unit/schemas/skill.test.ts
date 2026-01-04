import { describe, expect, test } from "bun:test";
import { CoreSkillSchema } from "@phil-ai/shared/schemas";

describe("CoreSkillSchema", () => {
	test("validates minimal skill definition", () => {
		const skill = {
			name: "learning",
			version: "1.0.0",
			description: "Capture and implement learnings",
			category: "learning" as const,
		};

		const result = CoreSkillSchema.parse(skill);
		expect(result.name).toBe("learning");
		expect(result.entryPoint).toBe("SKILL.md");
		expect(result.license).toBe("MIT");
		expect(result.tags).toEqual([]);
	});

	test("validates full skill definition", () => {
		const skill = {
			name: "docs-writer",
			version: "2.1.0",
			description: "Documentation management and optimization",
			category: "docs" as const,
			tags: ["documentation", "markdown"],
			allowedTools: ["Read", "Write", "Edit"],
			permissions: ["fs:read", "fs:write"],
			entryPoint: "SKILL.md",
			references: ["reference.md"],
			scripts: ["scripts/validate.sh"],
			author: {
				name: "Phil Beyer",
				email: "phil@example.com",
			},
			repository: "https://github.com/pjbeyer/phil-ai",
			license: "MIT",
		};

		expect(() => CoreSkillSchema.parse(skill)).not.toThrow();
	});

	test("rejects invalid skill name format", () => {
		const skill = {
			name: "Invalid Name",
			version: "1.0.0",
			description: "Test",
			category: "learning" as const,
		};

		expect(() => CoreSkillSchema.parse(skill)).toThrow();
	});

	test("rejects name starting with number", () => {
		const skill = {
			name: "1skill",
			version: "1.0.0",
			description: "Test",
			category: "learning" as const,
		};

		expect(() => CoreSkillSchema.parse(skill)).toThrow();
	});

	test("rejects invalid category", () => {
		const skill = {
			name: "test",
			version: "1.0.0",
			description: "Test",
			category: "invalid",
		};

		expect(() => CoreSkillSchema.parse(skill)).toThrow();
	});

	test("rejects description over 500 characters", () => {
		const skill = {
			name: "test",
			version: "1.0.0",
			description: "x".repeat(501),
			category: "learning" as const,
		};

		expect(() => CoreSkillSchema.parse(skill)).toThrow();
	});
});
