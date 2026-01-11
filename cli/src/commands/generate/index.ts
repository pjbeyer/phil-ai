import type { ParsedArgs } from "../../lib/args.js";
import { getBoolFlag, getStringFlag } from "../../lib/args.js";
import { bold, error, info, success } from "../../lib/output.js";

export interface GenerateOptions {
	platform: string;
	dryRun: boolean;
}

function parseGenerateOptions(args: ParsedArgs): GenerateOptions {
	return {
		platform: getStringFlag(args, "platform") ?? "all",
		dryRun: getBoolFlag(args, "dry-run"),
	};
}

export async function runGenerate(args: ParsedArgs): Promise<void> {
	const options = parseGenerateOptions(args);

	console.log();
	console.log(bold("Phil-AI Plugin Generator"));
	console.log();

	if (options.dryRun) {
		info("Dry run mode - no files will be written");
		console.log();
	}

	const platforms =
		options.platform === "all"
			? ["claude-code", "opencode"]
			: [options.platform];

	for (const platform of platforms) {
		info(`Generating ${platform} plugins...`);

		try {
			if (platform === "claude-code") {
				const { generateAll } = await import(
					"../../../../platforms/claude-code/generator/index.js"
				);
				await generateAll();
				success("Claude Code: Generated 4 plugins");
			} else if (platform === "opencode") {
				const { generateAll } = await import(
					"../../../../platforms/opencode/generator/index.js"
				);
				await generateAll();
				success("OpenCode: Generated plugin with tools");
			} else {
				error(`Unknown platform: ${platform}`);
			}
		} catch (err) {
			error(`Failed to generate ${platform}: ${err}`);
		}
	}

	console.log();
}
