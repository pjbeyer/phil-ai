import type { ParsedArgs } from "../../lib/args.js";
import { getBoolFlag, getStringFlag } from "../../lib/args.js";
import { bold, success, info, green } from "../../lib/output.js";
import { checkPrerequisites, assertPrerequisites } from "./prerequisites.js";
import { setupDirectories } from "./directories.js";
import { setupConfig } from "./config.js";
import { setupVersion } from "./version.js";
import { registerClaudeCode } from "./platforms/claude-code.js";
import { registerOpenCode } from "./platforms/opencode.js";

export interface InstallOptions {
	platforms: string[];
	force: boolean;
	dryRun: boolean;
}

function parseInstallOptions(args: ParsedArgs): InstallOptions {
	const platformsStr = getStringFlag(args, "platforms");
	const platforms = platformsStr
		? platformsStr.split(",")
		: ["claude-code", "opencode"];

	return {
		platforms,
		force: getBoolFlag(args, "force"),
		dryRun: getBoolFlag(args, "dry-run"),
	};
}

export async function runInstall(args: ParsedArgs): Promise<void> {
	const options = parseInstallOptions(args);

	console.log();
	console.log(bold("Phil-AI Installation"));
	console.log();

	if (options.dryRun) {
		info("Dry run mode - no changes will be made");
		console.log();
	}

	info("Checking prerequisites...");
	const prereqs = await checkPrerequisites();
	assertPrerequisites(prereqs);
	success("Prerequisites satisfied");
	console.log();

	info("Setting up directories...");
	await setupDirectories(options.dryRun);
	console.log();

	info("Creating configuration...");
	await setupConfig(options.dryRun, options.force);
	console.log();

	info("Initializing version manifest...");
	await setupVersion(options.dryRun, options.force);
	console.log();

	if (options.platforms.includes("claude-code")) {
		info("Registering Claude Code...");
		await registerClaudeCode(options.dryRun);
	}

	if (options.platforms.includes("opencode")) {
		info("Registering OpenCode...");
		await registerOpenCode(options.dryRun);
	}

	console.log();
	if (!options.dryRun) {
		console.log(green(bold("Installation complete!")));
		console.log();
		console.log("Next steps:");
		console.log("  1. Run 'bunx phil-ai status' to verify installation");
		console.log("  2. Use '/learn' in Claude Code to capture learnings");
	} else {
		info("Dry run complete - no changes made");
	}
	console.log();
}
