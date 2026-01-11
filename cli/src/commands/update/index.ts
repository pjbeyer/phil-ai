import type { ParsedArgs } from "../../lib/args.js";
import { getBoolFlag } from "../../lib/args.js";
import { bold, info, success, warn } from "../../lib/output.js";
import { backup } from "./backup.js";

export interface UpdateOptions {
	force: boolean;
	skipBackup: boolean;
}

function parseUpdateOptions(args: ParsedArgs): UpdateOptions {
	return {
		force: getBoolFlag(args, "force"),
		skipBackup: getBoolFlag(args, "skip-backup"),
	};
}

export async function runUpdate(args: ParsedArgs): Promise<void> {
	const options = parseUpdateOptions(args);

	console.log();
	console.log(bold("Phil-AI Update"));
	console.log();

	if (!options.skipBackup) {
		info("Creating backup...");
		const backupPath = await backup();
		if (backupPath) {
			success(`Backup created: ${backupPath}`);
		}
	}

	warn("Update functionality is a placeholder for future implementation");
	info("Component updates will be available in v0.2.0");

	console.log();
}
