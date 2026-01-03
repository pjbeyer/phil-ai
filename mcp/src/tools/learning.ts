export const captureLearning = {
	name: "capture_learning",
	description: "Capture a new learning",
	inputSchema: {
		type: "object" as const,
		properties: {
			title: { type: "string", description: "Learning title" },
			problem: { type: "string", description: "Problem description" },
			solution: { type: "string", description: "Solution description" },
			level: {
				type: "string",
				enum: ["global", "profile", "project", "agent"],
				description: "Hierarchy level",
			},
		},
		required: ["title", "problem", "solution"],
	},
	handler: async (params: Record<string, unknown>) => {
		return {
			content: [
				{
					type: "text" as const,
					text: `Learning captured: ${params.title}`,
				},
			],
		};
	},
};

export const listLearnings = {
	name: "list_learnings",
	description: "List captured learnings",
	inputSchema: {
		type: "object" as const,
		properties: {
			status: { type: "string", description: "Filter by status" },
			level: { type: "string", description: "Filter by level" },
		},
	},
	handler: async () => {
		return {
			content: [
				{
					type: "text" as const,
					text: "No learnings found (storage not yet implemented)",
				},
			],
		};
	},
};

export const learningTools = [captureLearning, listLearnings];
