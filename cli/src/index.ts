#!/usr/bin/env bun
import { parseArgs } from "./lib/args.js";
import { handleError } from "./lib/errors.js";
import { bold, dim } from "./lib/output.js";
import { runInstall } from "./commands/install/index.js";
import { runStatus } from "./commands/status/index.js";
import { runUpdate } from "./commands/update/index.js";
import { runSync } from "./commands/sync/index.js";
import { runGenerate } from "./commands/generate/index.js";
import { runValidate } from "./commands/validate/index.js";
import { runGuide } from "./commands/guide/index.js";

const VERSION = "0.1.0";

function showHelp(): void {
	console.log(`
${bold("phil-ai")} - Cross-platform AI plugin system

${bold("Usage:")}
  bunx phil-ai <command> [options]

${bold("Commands:")}
  install     Install phil-ai system
  status      Check system health
  update      Update phil-ai components
  sync        Sync state across platforms
  generate    Generate platform plugins
  validate    Validate marketplace or plugin structure
  guide       Manage system guide preferences

${bold("Options:")}
  --help, -h     Show this help message
  --version, -v  Show version number

${bold("Examples:")}
  bunx phil-ai install
  bunx phil-ai install --platforms=claude-code
  bunx phil-ai status --json
  bunx phil-ai status --verbose

${dim(`Version ${VERSION}`)}
`);
}

function showVersion(): void {
	console.log(`phil-ai v${VERSION}`);
}

async function main(): Promise<void> {
	const args = parseArgs(process.argv.slice(2));

	if (args.flags.help || args.flags.h) {
		showHelp();
		return;
	}

	if (args.flags.version || args.flags.v) {
		showVersion();
		return;
	}

	if (!args.command) {
		showHelp();
		return;
	}

	switch (args.command) {
		case "install":
			await runInstall(args);
			break;

		case "status":
			await runStatus(args);
			break;

		case "update":
			await runUpdate(args);
			break;

		case "sync":
			await runSync(args);
			break;

		case "generate":
			await runGenerate(args);
			break;

		case "validate":
			await runValidate(args);
			break;

		case "guide":
			await runGuide(args);
			break;

		default:
			console.error(`Unknown command: ${args.command}`);
			console.log('Run "bunx phil-ai --help" for usage information');
			process.exit(1);
	}
}

main().catch(handleError);
