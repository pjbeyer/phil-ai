import type { ParsedArgs } from "../../lib/args.js";
import { runInit } from "./init.js";
import { runShow } from "./show.js";
import { runValidateGuide } from "./validate.js";

export async function runGuide(args: ParsedArgs): Promise<void> {
	const subcommand = args.subcommand;

	switch (subcommand) {
		case "init":
			await runInit(args);
			break;
		case "show":
			await runShow(args);
			break;
		case "validate":
			await runValidateGuide(args);
			break;
		default:
			showGuideHelp();
	}
}

function showGuideHelp(): void {
	console.log(`
Usage: phil-ai guide <subcommand> [options]

Subcommands:
  init       Create a new GUIDE.md file
  show       Display merged system guide
  validate   Validate guide syntax and check for conflicts

Options:
  --level <level>   Hierarchy level (global/profile/project)
  --json            Output as JSON
  --help            Show this help message

Examples:
  phil-ai guide init
  phil-ai guide init --level=global
  phil-ai guide show
  phil-ai guide show --json
  phil-ai guide validate
`);
}
