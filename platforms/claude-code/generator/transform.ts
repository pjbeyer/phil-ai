import type { CoreSkill } from "@phil-ai/shared/schemas";

export interface ClaudeCodePlugin {
	name: string;
	version: string;
	description: string;
	commands: ClaudeCodeCommand[];
	skills: ClaudeCodeSkillRef[];
}

export interface ClaudeCodeCommand {
	name: string;
	description: string;
	arguments?: string[];
}

export interface ClaudeCodeSkillRef {
	name: string;
	path: string;
}

export function transformSkillToPlugin(skill: CoreSkill): ClaudeCodePlugin {
	const pluginName = `phil-ai-${skill.name}`;

	const commands = getCommandsForSkill(skill);

	return {
		name: pluginName,
		version: skill.version,
		description: skill.description,
		commands,
		skills: [
			{
				name: skill.name,
				path: `skills/${skill.name}/SKILL.md`,
			},
		],
	};
}

function getCommandsForSkill(skill: CoreSkill): ClaudeCodeCommand[] {
	switch (skill.category) {
		case "learning":
			return [
				{ name: "learn", description: "Capture a new learning" },
				{
					name: "implement-learnings",
					description: "Apply captured learnings",
				},
			];
		case "docs":
			return [{ name: "doc", description: "Documentation management" }];
		case "context":
			return [
				{ name: "optimize-agents", description: "Optimize AGENTS.md files" },
				{ name: "optimize-mcp", description: "Optimize MCP configuration" },
				{ name: "add-task", description: "Add hierarchy-aware tasks" },
			];
		case "workflow":
			return [
				{ name: "work-start", description: "Start new work item" },
				{ name: "work-finish", description: "Complete current work" },
				{ name: "work-status", description: "Show active work" },
				{ name: "work-resume", description: "Resume previous work" },
			];
		default:
			return [];
	}
}
