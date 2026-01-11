import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { OpenCodePlugin, OpenCodeTool } from "./transform.js";

const OUTPUT_DIR = "platforms/opencode/output";

export async function writePlugin(
	tools: OpenCodeTool[],
	version: string,
): Promise<string> {
	const pluginDir = OUTPUT_DIR;

	await mkdir(join(pluginDir, "src", "tools"), { recursive: true });

	const packageJson = {
		name: "@phil-ai/opencode-plugin",
		version,
		type: "module",
		main: "./src/index.ts",
		dependencies: {},
	};

	await writeFile(
		join(pluginDir, "package.json"),
		JSON.stringify(packageJson, null, 2),
	);

	const toolsByCategory = groupToolsByCategory(tools);

	for (const [category, categoryTools] of Object.entries(toolsByCategory)) {
		const toolContent = generateToolFile(category, categoryTools);
		await writeFile(
			join(pluginDir, "src", "tools", `${category}.ts`),
			toolContent,
		);
	}

	const indexContent = generateIndexFile(Object.keys(toolsByCategory));
	await writeFile(join(pluginDir, "src", "index.ts"), indexContent);

	return pluginDir;
}

function groupToolsByCategory(
	tools: OpenCodeTool[],
): Record<string, OpenCodeTool[]> {
	const grouped: Record<string, OpenCodeTool[]> = {};

	for (const tool of tools) {
		if (!grouped[tool.category]) {
			grouped[tool.category] = [];
		}
		grouped[tool.category]!.push(tool);
	}

	return grouped;
}

function generateToolFile(category: string, tools: OpenCodeTool[]): string {
	const toolDefs = tools
		.map(
			(t) => `export const ${t.name} = {
	name: "${t.name}",
	description: "${t.description}",
	parameters: ${JSON.stringify(t.parameters, null, 2)},
	execute: async (params: Record<string, unknown>) => {
		return { success: true, message: "${t.name} executed" };
	},
};`,
		)
		.join("\n\n");

	return `${toolDefs}\n\nexport const ${category}Tools = [${tools.map((t) => t.name).join(", ")}];\n`;
}

function generateIndexFile(categories: string[]): string {
	const imports = categories
		.map((c) => `import { ${c}Tools } from "./tools/${c}.js";`)
		.join("\n");

	const exports = categories.map((c) => `...${c}Tools`).join(", ");

	return `${imports}

export const tools = [${exports}];

export default {
	name: "phil-ai",
	version: "0.1.0",
	tools,
};
`;
}
