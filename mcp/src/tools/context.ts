export const optimizeAgents = {
	name: "optimize_agents",
	description: "Optimize AGENTS.md files",
	inputSchema: {
		type: "object" as const,
		properties: {
			level: {
				type: "string",
				enum: ["global", "profile", "project"],
				description: "Hierarchy level",
			},
			dryRun: { type: "boolean", description: "Preview only" },
		},
	},
	handler: async (params: Record<string, unknown>) => {
		return {
			content: [
				{
					type: "text" as const,
					text: `AGENTS.md optimization ${params.dryRun ? "preview" : "started"}`,
				},
			],
		};
	},
};

export const contextTools = [optimizeAgents];
