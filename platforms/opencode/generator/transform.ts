import type { CoreSkill } from "@phil-ai/shared/schemas";

export interface OpenCodeTool {
	name: string;
	description: string;
	parameters: OpenCodeParameter[];
	category: string;
}

export interface OpenCodeParameter {
	name: string;
	type: string;
	description: string;
	required: boolean;
}

export interface OpenCodePlugin {
	name: string;
	version: string;
	description: string;
	tools: OpenCodeTool[];
}

export function transformSkillToPlugin(skill: CoreSkill): OpenCodePlugin {
	const tools = getToolsForSkill(skill);

	return {
		name: "phil-ai",
		version: skill.version,
		description: skill.description,
		tools,
	};
}

function getToolsForSkill(skill: CoreSkill): OpenCodeTool[] {
	switch (skill.category) {
		case "learning":
			return [
				{
					name: "capture_learning",
					description: "Capture a new learning",
					category: "learning",
					parameters: [
						{
							name: "title",
							type: "string",
							description: "Learning title",
							required: true,
						},
						{
							name: "problem",
							type: "string",
							description: "Problem description",
							required: true,
						},
						{
							name: "solution",
							type: "string",
							description: "Solution description",
							required: true,
						},
						{
							name: "level",
							type: "string",
							description: "Hierarchy level",
							required: false,
						},
					],
				},
				{
					name: "list_learnings",
					description: "List captured learnings",
					category: "learning",
					parameters: [
						{
							name: "status",
							type: "string",
							description: "Filter by status",
							required: false,
						},
						{
							name: "level",
							type: "string",
							description: "Filter by level",
							required: false,
						},
					],
				},
			];
		case "docs":
			return [
				{
					name: "write_doc",
					description: "Write documentation",
					category: "docs",
					parameters: [
						{
							name: "path",
							type: "string",
							description: "Output path",
							required: true,
						},
						{
							name: "audience",
							type: "string",
							description: "Target audience",
							required: false,
						},
						{
							name: "type",
							type: "string",
							description: "Document type",
							required: false,
						},
					],
				},
			];
		case "context":
			return [
				{
					name: "optimize_agents",
					description: "Optimize AGENTS.md files",
					category: "context",
					parameters: [
						{
							name: "level",
							type: "string",
							description: "Hierarchy level",
							required: false,
						},
						{
							name: "dry_run",
							type: "boolean",
							description: "Preview only",
							required: false,
						},
					],
				},
			];
		case "workflow":
			return [
				{
					name: "work_start",
					description: "Start new work item",
					category: "workflow",
					parameters: [
						{
							name: "title",
							type: "string",
							description: "Work item title",
							required: true,
						},
						{
							name: "type",
							type: "string",
							description: "Work type",
							required: false,
						},
					],
				},
				{
					name: "work_finish",
					description: "Finish current work",
					category: "workflow",
					parameters: [
						{
							name: "commit",
							type: "boolean",
							description: "Create commit",
							required: false,
						},
					],
				},
			];
		case "guide":
			return [
				{
					name: "get_guide",
					description: "Get merged system guide for current project",
					category: "guide",
					parameters: [
						{
							name: "projectPath",
							type: "string",
							description: "Project path",
							required: true,
						},
					],
				},
				{
					name: "list_preferences",
					description: "List all preferences from system guide",
					category: "guide",
					parameters: [
						{
							name: "projectPath",
							type: "string",
							description: "Project path",
							required: true,
						},
						{
							name: "type",
							type: "string",
							description: "Filter by type (hard/soft)",
							required: false,
						},
					],
				},
				{
					name: "check_preference",
					description: "Check if a preference is defined",
					category: "guide",
					parameters: [
						{
							name: "projectPath",
							type: "string",
							description: "Project path",
							required: true,
						},
						{
							name: "preferenceId",
							type: "string",
							description: "Preference ID",
							required: true,
						},
					],
				},
			];
		default:
			return [];
	}
}
