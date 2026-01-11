import { access, mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { GuideHierarchyLevelType } from "@phil-ai/shared";
import type { ParsedArgs } from "../../lib/args.js";
import { getStringFlag } from "../../lib/args.js";
import { bold, error, info, success, warn } from "../../lib/output.js";

const GUIDE_TEMPLATE = `---
name: system-guide
version: "1.0.0"
verbosity: brief
---

# System Guide

## Communication Style

<!-- preference: comm.concise | soft -->
Be direct and concise. Avoid unnecessary preamble.

<!-- preference: comm.no-emoji | hard -->
Never use emojis in code or documentation unless explicitly requested.

## Code Style

<!-- preference: code-style.explicit-types | soft -->
Prefer explicit type annotations over inference for function parameters and return types.

<!-- preference: code-style.no-any | hard -->
Never use \`any\` type. Use \`unknown\` with type guards instead.

## Documentation

<!-- preference: docs.update-first | soft -->
Update relevant documentation before implementing changes.
`;

async function fileExists(path: string): Promise<boolean> {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}

function getLevelPath(level: GuideHierarchyLevelType): string {
	const home = homedir();
	switch (level) {
		case "global":
			return join(home, "Projects");
		case "profile":
			return join(home, "Projects", getCurrentProfile());
		case "project":
			return process.cwd();
	}
}

function getCurrentProfile(): string {
	const cwd = process.cwd();
	const home = homedir();
	const projectsDir = join(home, "Projects");

	if (cwd.startsWith(projectsDir)) {
		const relativePath = cwd.slice(projectsDir.length + 1);
		const parts = relativePath.split("/");
		if (parts.length >= 1 && parts[0]) {
			return parts[0];
		}
	}
	return "default";
}

export interface InitOptions {
	level: GuideHierarchyLevelType;
	force: boolean;
}

function parseInitOptions(args: ParsedArgs): InitOptions {
	const levelArg = getStringFlag(args, "level");
	let level: GuideHierarchyLevelType = "project";

	if (
		levelArg === "global" ||
		levelArg === "profile" ||
		levelArg === "project"
	) {
		level = levelArg;
	}

	return {
		level,
		force: args.flags.force === true || args.flags.f === true,
	};
}

export async function runInit(args: ParsedArgs): Promise<void> {
	const options = parseInitOptions(args);

	const basePath = getLevelPath(options.level);
	const guidePath = join(basePath, "GUIDE.md");

	console.log();
	info(`Creating GUIDE.md at ${bold(options.level)} level`);
	console.log(`  Path: ${guidePath}`);
	console.log();

	if (!(await fileExists(basePath))) {
		try {
			await mkdir(basePath, { recursive: true });
			info(`Created directory: ${basePath}`);
		} catch (err) {
			error(`Failed to create directory: ${basePath}`);
			process.exit(1);
		}
	}

	if (await fileExists(guidePath)) {
		if (!options.force) {
			warn(`GUIDE.md already exists at ${guidePath}`);
			info("Use --force to overwrite");
			process.exit(1);
		}
		warn("Overwriting existing GUIDE.md");
	}

	try {
		await writeFile(guidePath, GUIDE_TEMPLATE, "utf-8");
		success(`Created ${guidePath}`);
		console.log();
		info("Next steps:");
		console.log("  1. Edit GUIDE.md to customize your preferences");
		console.log("  2. Run 'phil-ai guide show' to preview merged guide");
		console.log("  3. Run 'phil-ai guide validate' to check for issues");
		console.log();
	} catch (err) {
		const errMsg = err instanceof Error ? err.message : String(err);
		error(`Failed to create GUIDE.md: ${errMsg}`);
		process.exit(1);
	}
}
