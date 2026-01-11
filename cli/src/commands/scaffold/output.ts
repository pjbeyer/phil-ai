import path from "node:path";
import { cyan, dim, green, yellow } from "../../lib/output.js";
import type { GeneratedFile } from "./generate.js";

export interface WriteResult {
	written: string[];
	skipped: string[];
	errors: string[];
}

export async function checkExistingFiles(
	pluginPath: string,
	files: GeneratedFile[],
): Promise<string[]> {
	const existing: string[] = [];

	for (const file of files) {
		const fullPath = path.join(pluginPath, file.path);
		const bunFile = Bun.file(fullPath);
		if (await bunFile.exists()) {
			existing.push(file.path);
		}
	}

	return existing;
}

export async function promptOverwrite(
	existingFiles: string[],
): Promise<boolean> {
	if (existingFiles.length === 0) return true;

	console.log();
	console.log(`${yellow("!")} The following files already exist:`);
	for (const file of existingFiles) {
		console.log(`  ${dim("-")} ${file}`);
	}
	console.log();

	process.stdout.write("Overwrite? [y/N] ");

	const reader = Bun.stdin.stream().getReader();
	const { value } = await reader.read();
	reader.releaseLock();

	const input = value
		? new TextDecoder().decode(value).trim().toLowerCase()
		: "";
	return input === "y" || input === "yes";
}

export function previewFiles(files: GeneratedFile[]): void {
	console.log();
	console.log("  Files that would be created:");
	for (const file of files) {
		const symbol = file.action === "update" ? "~" : "+";
		const suffix = file.action === "update" ? "(append)" : "(new)";
		console.log(`  ${cyan(symbol)} ${file.path} ${dim(suffix)}`);
	}
	console.log();
	console.log("No files were written.");
}

export async function writeFiles(
	pluginPath: string,
	files: GeneratedFile[],
): Promise<WriteResult> {
	const result: WriteResult = {
		written: [],
		skipped: [],
		errors: [],
	};

	for (const file of files) {
		const fullPath = path.join(pluginPath, file.path);

		try {
			const dir = path.dirname(fullPath);
			await Bun.write(path.join(dir, ".gitkeep"), "");
			const gitkeep = Bun.file(path.join(dir, ".gitkeep"));
			if (await gitkeep.exists()) {
				await Bun.write(path.join(dir, ".gitkeep"), "");
			}

			await Bun.write(fullPath, file.content);
			result.written.push(file.path);
		} catch (err) {
			result.errors.push(`Failed to write ${file.path}: ${err}`);
		}
	}

	for (const file of files) {
		const dir = path.dirname(path.join(pluginPath, file.path));
		const gitkeepPath = path.join(dir, ".gitkeep");
		try {
			const gitkeep = Bun.file(gitkeepPath);
			if (await gitkeep.exists()) {
				const fs = await import("node:fs/promises");
				await fs.unlink(gitkeepPath);
			}
		} catch {
			// ignore cleanup errors
		}
	}

	return result;
}

export function printWriteResults(
	files: GeneratedFile[],
	writeResult: WriteResult,
): void {
	for (const filePath of writeResult.written) {
		const file = files.find((f) => f.path === filePath);
		const action = file?.action === "update" ? "Updated" : "Created";
		console.log(`${green("✓")} ${action} ${filePath}`);
	}

	for (const error of writeResult.errors) {
		console.error(`${yellow("!")} ${error}`);
	}
}
