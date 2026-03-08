import { describe, expect, test } from "bun:test";
import { CoreSkillSchema } from "@phil-ai/shared/schemas";
import { renderMcpJson, renderSkillMd } from "../../../platforms/opencode/generator/render";

const skill = CoreSkillSchema.parse({
	name: "learning",
	version: "1.0.0",
	description:
		"Capture and implement learnings with hierarchical storage and closed-loop tracking",
	category: "learning",
});

describe("renderSkillMd", () => {
	test("renders frontmatter and appends MCP usage section", () => {
		const content = "# Learning Skill\n\nSkill details.";
		const rendered = renderSkillMd(skill, content);

		expect(rendered).toContain("---");
		expect(rendered).toContain("name: learning");
		expect(rendered).toContain(`description: ${JSON.stringify(skill.description)}`);
		expect(rendered).toContain("# Learning Skill");
		expect(rendered).toContain("## MCP Tools");
		expect(rendered).toContain('skill_mcp(mcp_name="learning"');
	});
});

describe("renderMcpJson", () => {
	test("renders production MCP configuration", () => {
		const rendered = renderMcpJson(skill);
		const parsed = JSON.parse(rendered) as {
			mcpServers: Record<string, { command: string; args: string[] }>;
		};
		const learningServer = parsed.mcpServers.learning;
		expect(learningServer).toBeDefined();

		expect(learningServer?.command).toBe("phil-ai-mcp");
		expect(learningServer?.args).toEqual([]);
	});

	test("renders custom MCP command and args", () => {
		const rendered = renderMcpJson(skill, {
			mcpCommand: "bun",
			mcpArgs: ["run", "/tmp/server.js"],
		});
		const parsed = JSON.parse(rendered) as {
			mcpServers: Record<string, { command: string; args: string[] }>;
		};
		const learningServer = parsed.mcpServers.learning;
		expect(learningServer).toBeDefined();

		expect(learningServer?.command).toBe("bun");
		expect(learningServer?.args).toEqual(["run", "/tmp/server.js"]);
	});
});
