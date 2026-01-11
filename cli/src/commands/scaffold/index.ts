import type { ParsedArgs } from "../../lib/args.js";
import { getBoolFlag, getStringFlag } from "../../lib/args.js";
import { bold, dim, error, info, success, warn } from "../../lib/output.js";
import { scanCommands, scanSkills } from "./extract.js";
import { generateAllFiles } from "./generate.js";
import {
	checkExistingFiles,
	previewFiles,
	printWriteResults,
	promptOverwrite,
	writeFiles,
} from "./output.js";
import { validatePath, validatePluginDirectory } from "./validate.js";

export interface ScaffoldOptions {
	path: string;
	dryRun: boolean;
	force: boolean;
}

function parseScaffoldOptions(args: ParsedArgs): ScaffoldOptions {
	return {
		path:
			getStringFlag(args, "path") ?? getStringFlag(args, "p") ?? process.cwd(),
		dryRun: getBoolFlag(args, "dry-run"),
		force: getBoolFlag(args, "force") || getBoolFlag(args, "f"),
	};
}

export async function runScaffold(args: ParsedArgs): Promise<void> {
	const options = parseScaffoldOptions(args);

	console.log();
	if (options.dryRun) {
		console.log(bold("Phil-AI Scaffold (dry run)"));
	} else {
		console.log(bold("Phil-AI Scaffold"));
	}
	console.log();

	const pathValidation = await validatePath(options.path);
	if (!pathValidation.valid) {
		error(pathValidation.error ?? "Path validation failed");
		console.log();
		process.exit(1);
	}

	const validation = await validatePluginDirectory(options.path);

	if (!validation.valid) {
		for (const err of validation.errors) {
			error(err);
		}
		console.log();
		console.log("Expected structure:");
		console.log("  my-plugin/");
		console.log("  ├── .claude-plugin/");
		console.log(`  │   └── plugin.json    ${dim("<- Required")}`);
		console.log(
			`  └── commands/          ${dim("<- Optional but recommended")}`,
		);
		console.log();
		process.exit(1);
	}

	const manifest = validation.manifest!;
	info(`Scaffolding OpenCode plugin for: ${manifest.name}`);
	console.log();

	console.log("  Validating Claude Code plugin...");
	success("Found .claude-plugin/plugin.json");

	const commands = await scanCommands(options.path);
	if (commands.length > 0) {
		success(
			`Found ${commands.length} command${commands.length === 1 ? "" : "s"} in commands/`,
		);
	}

	const skills = await scanSkills(options.path);
	if (skills.length > 0) {
		success(
			`Found ${skills.length} skill${skills.length === 1 ? "" : "s"} in skills/`,
		);
	}

	for (const warning of validation.warnings) {
		warn(warning);
	}

	console.log();
	console.log("  Generating files...");

	const generated = await generateAllFiles(
		options.path,
		manifest,
		commands,
		skills,
	);

	if (options.dryRun) {
		previewFiles(generated.files);
		console.log();
		return;
	}

	const existingFiles = await checkExistingFiles(options.path, generated.files);

	if (existingFiles.length > 0 && !options.force) {
		const proceed = await promptOverwrite(existingFiles);
		if (!proceed) {
			console.log();
			info("Scaffold cancelled.");
			console.log();
			return;
		}
	} else if (existingFiles.length > 0 && options.force) {
		warn("Overwriting existing files (--force)");
	}

	const writeResult = await writeFiles(options.path, generated.files);
	printWriteResults(generated.files, writeResult);

	if (writeResult.errors.length > 0) {
		console.log();
		error("Scaffold completed with errors");
		console.log();
		process.exit(1);
	}

	console.log();
	success("Scaffold complete!");
	console.log();
	console.log("Next steps:");
	console.log(`  1. cd ${options.path === process.cwd() ? "." : options.path}`);
	console.log("  2. bun install");
	console.log("  3. bun build");
	console.log(
		"  4. Test locally with: bunx opencode (plugin auto-loaded from .opencode/plugin/)",
	);
	console.log("  5. Publish to npm: npm publish");
	console.log();
}
