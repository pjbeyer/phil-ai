#!/usr/bin/env bun
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { contextTools } from "./tools/context.js";
import { docsTools } from "./tools/docs.js";
import { learningTools } from "./tools/learning.js";
import { workflowTools } from "./tools/workflow.js";

const allTools = [
	...learningTools,
	...docsTools,
	...contextTools,
	...workflowTools,
];

const server = new Server(
	{
		name: "phil-ai",
		version: "0.1.0",
	},
	{
		capabilities: {
			tools: {},
		},
	},
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
	return {
		tools: allTools.map((t) => ({
			name: t.name,
			description: t.description,
			inputSchema: t.inputSchema,
		})),
	};
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
	const tool = allTools.find((t) => t.name === request.params.name);

	if (!tool) {
		throw new Error(`Unknown tool: ${request.params.name}`);
	}

	return tool.handler(request.params.arguments ?? {});
});

async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error("Phil-AI MCP server running on stdio");
}

main().catch(console.error);
