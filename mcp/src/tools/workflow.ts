export const workStart = {
	name: "work_start",
	description: "Start new work item",
	inputSchema: {
		type: "object" as const,
		properties: {
			title: { type: "string", description: "Work item title" },
			type: {
				type: "string",
				enum: ["feature", "bug", "chore", "refactor"],
				description: "Work type",
			},
		},
		required: ["title"],
	},
	handler: async (params: Record<string, unknown>) => {
		return {
			content: [
				{
					type: "text" as const,
					text: `Work started: ${params.title}`,
				},
			],
		};
	},
};

export const workFinish = {
	name: "work_finish",
	description: "Finish current work",
	inputSchema: {
		type: "object" as const,
		properties: {
			commit: { type: "boolean", description: "Create commit" },
		},
	},
	handler: async () => {
		return {
			content: [
				{
					type: "text" as const,
					text: "Work finished",
				},
			],
		};
	},
};

export const workflowTools = [workStart, workFinish];
