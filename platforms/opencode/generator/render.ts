import type { CoreSkill } from "@phil-ai/shared/schemas";

export function render(template: string, data: Record<string, string>): string {
	let result = template;
	for (const [key, value] of Object.entries(data)) {
		result = result.replaceAll(`{{${key}}}`, value);
	}
	return result;
}

export function renderSkillMd(skill: CoreSkill, content: string): string {
	const normalized = content.trim();

	return `---
name: ${skill.name}
description: ${JSON.stringify(skill.description)}
---

${normalized}

## MCP Tools

Use \`skill_mcp\` to invoke ${skill.name} tools:

\`\`\`
skill_mcp(mcp_name="${skill.name}", tool_name="<tool_name>", arguments='{"key":"value"}')
\`\`\`
`;
}

export function renderMcpJson(
	skill: CoreSkill,
	options: { devMode?: boolean; mcpCommand?: string; mcpArgs?: string[] } = {},
): string {
	const command = options.mcpCommand ?? "phil-ai-mcp";
	const args = options.mcpArgs ?? [];

	return `${JSON.stringify(
		{
			mcpServers: {
				[skill.name]: {
					command,
					args,
				},
			},
		},
		null,
		2,
	)}
`;
}
