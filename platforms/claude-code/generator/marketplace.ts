import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ClaudeCodePlugin } from "./transform.js";

const OUTPUT_DIR = "platforms/claude-code/output";

export interface MarketplaceEntry {
	name: string;
	version: string;
	description: string;
	repository: string;
}

export async function writeMarketplace(
	plugins: ClaudeCodePlugin[],
): Promise<void> {
	const marketplace = {
		name: "phil-ai",
		version: "1.0.0",
		plugins: plugins.map((p) => ({
			name: p.name,
			version: p.version,
			description: p.description,
			path: `./${p.name}`,
		})),
	};

	await writeFile(
		join(OUTPUT_DIR, "marketplace.json"),
		JSON.stringify(marketplace, null, 2),
	);
}
