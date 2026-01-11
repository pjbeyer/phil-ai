import type { ParsedArgs } from "../../lib/args.js";
import { getBoolFlag } from "../../lib/args.js";
import { error, info, warn, bold, dim, green, yellow, cyan } from "../../lib/output.js";
import {
	loadMergedGuide,
	discoverGuides,
	type MergedGuide,
} from "@phil-ai/shared";

export interface ShowOptions {
	json: boolean;
	verbose: boolean;
}

function parseShowOptions(args: ParsedArgs): ShowOptions {
	return {
		json: getBoolFlag(args, "json"),
		verbose: getBoolFlag(args, "verbose"),
	};
}

function formatLevelBadge(level: string): string {
	switch (level) {
		case "global":
			return cyan(`[${level}]`);
		case "profile":
			return yellow(`[${level}]`);
		case "project":
			return green(`[${level}]`);
		default:
			return `[${level}]`;
	}
}

function formatTextOutput(guide: MergedGuide, verbose: boolean): void {
	console.log();
	console.log(bold("System Guide"));
	console.log(`Verbosity: ${guide.verbosity}`);
	console.log();

	console.log(bold("Sources:"));
	for (const source of guide.sources) {
		console.log(`  ${formatLevelBadge(source.level)} ${source.path}`);
	}
	console.log();

	const hardPrefs = guide.preferences.filter((p) => p.type === "hard");
	const softPrefs = guide.preferences.filter((p) => p.type === "soft");

	if (hardPrefs.length > 0) {
		console.log(bold("Hard Rules (Must Follow):"));
		for (const pref of hardPrefs) {
			const levelBadge = pref.sourceLevel ? formatLevelBadge(pref.sourceLevel) : "";
			console.log(`  ${bold(pref.id)} ${levelBadge}`);
			if (verbose) {
				console.log(`    ${dim(pref.content)}`);
			}
		}
		console.log();
	}

	if (softPrefs.length > 0) {
		console.log(bold("Soft Preferences (Defaults):"));
		for (const pref of softPrefs) {
			const levelBadge = pref.sourceLevel ? formatLevelBadge(pref.sourceLevel) : "";
			console.log(`  ${pref.id} ${levelBadge}`);
			if (verbose) {
				console.log(`    ${dim(pref.content)}`);
			}
		}
		console.log();
	}

	if (guide.preferences.length === 0) {
		info("No preferences defined");
		console.log();
	}

	console.log(dim(`Total: ${guide.preferences.length} preferences (${hardPrefs.length} hard, ${softPrefs.length} soft)`));
	console.log();
}

function formatJsonOutput(guide: MergedGuide): void {
	console.log(JSON.stringify(guide, null, 2));
}

export async function runShow(args: ParsedArgs): Promise<void> {
	const options = parseShowOptions(args);
	const projectPath = process.cwd();

	const { guides, checked } = await discoverGuides(projectPath);

	if (guides.length === 0) {
		if (!options.json) {
			console.log();
			warn("No GUIDE.md files found");
			console.log();
			info("Checked locations:");
			for (const path of checked) {
				console.log(`  ${dim(path)}`);
			}
			console.log();
			info("Run 'phil-ai guide init' to create one");
			console.log();
		} else {
			console.log(JSON.stringify({ error: "No guides found", checked }, null, 2));
		}
		return;
	}

	const merged = await loadMergedGuide({
		projectPath,
		includeInactive: options.verbose,
	});

	if (!merged) {
		error("Failed to load guides");
		process.exit(1);
	}

	if (options.json) {
		formatJsonOutput(merged);
	} else {
		formatTextOutput(merged, options.verbose);
	}
}
