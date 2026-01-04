export const writeDoc = {
	name: "write_doc",
	description: "Write documentation",
	inputSchema: {
		type: "object" as const,
		properties: {
			path: { type: "string", description: "Output path" },
			audience: {
				type: "string",
				enum: ["human", "machine", "team", "public"],
				description: "Target audience",
			},
			type: {
				type: "string",
				enum: ["readme", "api", "architecture", "guide"],
				description: "Document type",
			},
		},
		required: ["path"],
	},
	handler: async (params: Record<string, unknown>) => {
		return {
			content: [
				{
					type: "text" as const,
					text: `Documentation task started for: ${params.path}`,
				},
			],
		};
	},
};

export const docsTools = [writeDoc];
