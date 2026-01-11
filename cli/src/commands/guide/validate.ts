import type { ParsedArgs } from "../../lib/args.js";
import { getBoolFlag } from "../../lib/args.js";
import { success, error, info, warn, bold, dim, yellow, red, cyan } from "../../lib/output.js";
import {
	discoverGuides,
	loadGuide,
	type Preference,
	PreferenceIdRegex,
} from "@phil-ai/shared";

export interface ValidateOptions {
	json: boolean;
	verbose: boolean;
}

function parseValidateOptions(args: ParsedArgs): ValidateOptions {
	return {
		json: getBoolFlag(args, "json"),
		verbose: getBoolFlag(args, "verbose"),
	};
}

interface ValidationIssue {
	level: "error" | "warning" | "info";
	message: string;
	file?: string;
	preferenceId?: string;
}

interface ValidationResult {
	valid: boolean;
	issues: ValidationIssue[];
	stats: {
		guidesChecked: number;
		preferencesFound: number;
		hardRules: number;
		softDefaults: number;
		conflicts: number;
	};
}

function findConflicts(preferences: Map<string, { pref: Preference; file: string }[]>): ValidationIssue[] {
	const conflicts: ValidationIssue[] = [];

	for (const [id, sources] of preferences) {
		if (sources.length > 1) {
			const types = new Set(sources.map((s) => s.pref.type));
			if (types.size > 1) {
				conflicts.push({
					level: "warning",
					message: `Preference "${id}" has conflicting types across files`,
					preferenceId: id,
				});
				for (const source of sources) {
					conflicts.push({
						level: "info",
						message: `  ${source.file}: ${source.pref.type}`,
						preferenceId: id,
						file: source.file,
					});
				}
			}

			const hasHardRule = sources.some((s) => s.pref.type === "hard");
			if (hasHardRule && sources.length > 1) {
				conflicts.push({
					level: "info",
					message: `Preference "${id}" is defined at multiple levels (project overrides profile overrides global)`,
					preferenceId: id,
				});
			}
		}
	}

	return conflicts;
}

export async function runValidateGuide(args: ParsedArgs): Promise<void> {
	const options = parseValidateOptions(args);
	const projectPath = process.cwd();

	const result: ValidationResult = {
		valid: true,
		issues: [],
		stats: {
			guidesChecked: 0,
			preferencesFound: 0,
			hardRules: 0,
			softDefaults: 0,
			conflicts: 0,
		},
	};

	const { guides, checked } = await discoverGuides(projectPath);

	if (guides.length === 0) {
		if (!options.json) {
			console.log();
			warn("No GUIDE.md files found to validate");
			console.log();
			info("Checked locations:");
			for (const path of checked) {
				console.log(`  ${dim(path)}`);
			}
			console.log();
			info("Run 'phil-ai guide init' to create one");
			console.log();
		} else {
			console.log(JSON.stringify({ valid: true, message: "No guides found", checked }, null, 2));
		}
		return;
	}

	result.stats.guidesChecked = guides.length;

	const preferenceMap = new Map<string, { pref: Preference; file: string }[]>();

	for (const guidePath of guides) {
		const parseResult = await loadGuide(guidePath);

		if (parseResult.warnings.length > 0) {
			for (const warning of parseResult.warnings) {
				result.issues.push({
					level: "warning",
					message: warning,
					file: guidePath.path,
				});
			}
		}

		if (!parseResult.success) {
			result.valid = false;
			result.issues.push({
				level: "error",
				message: `Failed to parse guide`,
				file: guidePath.path,
			});
			continue;
		}

		for (const section of parseResult.guide.sections) {
			for (const pref of section.preferences) {
				result.stats.preferencesFound++;

				if (pref.type === "hard") {
					result.stats.hardRules++;
				} else {
					result.stats.softDefaults++;
				}

				if (!PreferenceIdRegex.test(pref.id)) {
					result.valid = false;
					result.issues.push({
						level: "error",
						message: `Invalid preference ID format: "${pref.id}" (expected: lowercase.dot.notation)`,
						file: guidePath.path,
						preferenceId: pref.id,
					});
				}

				const existing = preferenceMap.get(pref.id) ?? [];
				existing.push({ pref, file: guidePath.path });
				preferenceMap.set(pref.id, existing);
			}
		}
	}

	const conflicts = findConflicts(preferenceMap);
	result.stats.conflicts = conflicts.filter((c) => c.level === "warning").length;

	for (const conflict of conflicts) {
		if (conflict.level === "warning") {
			result.issues.push(conflict);
		} else if (options.verbose) {
			result.issues.push(conflict);
		}
	}

	if (options.json) {
		console.log(JSON.stringify(result, null, 2));
		return;
	}

	console.log();
	console.log(bold("Guide Validation Results"));
	console.log();

	console.log(bold("Statistics:"));
	console.log(`  Guides checked: ${result.stats.guidesChecked}`);
	console.log(`  Preferences found: ${result.stats.preferencesFound}`);
	console.log(`  Hard rules: ${result.stats.hardRules}`);
	console.log(`  Soft defaults: ${result.stats.softDefaults}`);
	if (result.stats.conflicts > 0) {
		console.log(`  Potential conflicts: ${yellow(String(result.stats.conflicts))}`);
	}
	console.log();

	const errors = result.issues.filter((i) => i.level === "error");
	const warnings = result.issues.filter((i) => i.level === "warning");
	const infos = result.issues.filter((i) => i.level === "info");

	if (errors.length > 0) {
		console.log(bold("Errors:"));
		for (const issue of errors) {
			console.log(`  ${red("✗")} ${issue.message}`);
			if (issue.file) {
				console.log(`    ${dim(issue.file)}`);
			}
		}
		console.log();
	}

	if (warnings.length > 0) {
		console.log(bold("Warnings:"));
		for (const issue of warnings) {
			console.log(`  ${yellow("!")} ${issue.message}`);
			if (issue.file && !issue.message.includes(issue.file)) {
				console.log(`    ${dim(issue.file)}`);
			}
		}
		console.log();
	}

	if (options.verbose && infos.length > 0) {
		console.log(bold("Info:"));
		for (const issue of infos) {
			console.log(`  ${cyan("i")} ${issue.message}`);
		}
		console.log();
	}

	if (result.valid && warnings.length === 0) {
		success("All guides are valid");
	} else if (result.valid) {
		success("Guides are valid with warnings");
	} else {
		error("Validation failed");
		process.exit(1);
	}
	console.log();
}
