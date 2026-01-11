import path from "node:path";
import type { ParsedCommand, ParsedSkill } from "./extract.js";
import { render } from "./render.js";
import type { PluginManifest } from "./schemas.js";
import {
	GITIGNORE_ENTRIES,
	MARKETPLACE_TEMPLATE,
	PACKAGE_JSON_TEMPLATE,
	PLUGIN_INDEX_TEMPLATE,
	TSCONFIG_TEMPLATE,
} from "./templates.js";
import { toPascalCase } from "./utils.js";

export interface GeneratedFile {
	path: string;
	content: string;
	action: "create" | "update";
}

export interface GenerateResult {
	files: GeneratedFile[];
	warnings: string[];
}

export function generatePluginCode(
	manifest: PluginManifest,
	_commands: ParsedCommand[],
	_skills: ParsedSkill[],
): string {
	const exportName = toPascalCase(manifest.name);

	return render(PLUGIN_INDEX_TEMPLATE, {
		pluginName: manifest.name,
		PluginExportName: exportName,
	});
}

export function generatePackageJson(manifest: PluginManifest): string {
	const authorName = manifest.author?.name ?? "";
	const authorEmail = manifest.author?.email ?? "";
	const repositoryUrl = manifest.repository ?? "";

	const rendered = render(PACKAGE_JSON_TEMPLATE, {
		packageName: manifest.name,
		version: manifest.version,
		description: manifest.description,
		authorName,
		authorEmail,
		repositoryUrl,
	});

	const parsed = JSON.parse(rendered);

	if (!authorName && !authorEmail) {
		delete parsed.author;
	}
	if (!repositoryUrl) {
		delete parsed.repository;
	}

	return JSON.stringify(parsed, null, 2);
}

export function generateTsConfig(): string {
	return TSCONFIG_TEMPLATE;
}

export function generateMarketplace(manifest: PluginManifest): string {
	return render(MARKETPLACE_TEMPLATE, {
		marketplaceName: `${manifest.name}-dev`,
		pluginName: manifest.name,
	});
}

export async function generateGitignoreContent(
	pluginPath: string,
): Promise<{ content: string; action: "create" | "update" }> {
	const gitignorePath = path.join(pluginPath, ".gitignore");
	const gitignoreFile = Bun.file(gitignorePath);

	let existingContent = "";
	let action: "create" | "update" = "create";

	if (await gitignoreFile.exists()) {
		existingContent = await gitignoreFile.text();
		action = "update";
	}

	const lines = existingContent.split("\n");
	const entriesToAdd: string[] = [];

	for (const entry of GITIGNORE_ENTRIES) {
		const entryWithoutSlash = entry.replace(/\/$/, "");
		const hasEntry = lines.some(
			(line) => line.trim() === entry || line.trim() === entryWithoutSlash,
		);
		if (!hasEntry) {
			entriesToAdd.push(entry);
		}
	}

	if (entriesToAdd.length === 0) {
		return { content: existingContent, action };
	}

	const newContent =
		existingContent.endsWith("\n") || existingContent === ""
			? existingContent + entriesToAdd.join("\n") + "\n"
			: existingContent + "\n" + entriesToAdd.join("\n") + "\n";

	return { content: newContent, action };
}

export async function generateAllFiles(
	pluginPath: string,
	manifest: PluginManifest,
	commands: ParsedCommand[],
	skills: ParsedSkill[],
): Promise<GenerateResult> {
	const result: GenerateResult = {
		files: [],
		warnings: [],
	};

	const pluginCode = generatePluginCode(manifest, commands, skills);

	result.files.push({
		path: "src/index.ts",
		content: pluginCode,
		action: "create",
	});

	result.files.push({
		path: `.opencode/plugin/${manifest.name}.ts`,
		content: pluginCode,
		action: "create",
	});

	result.files.push({
		path: "package.json",
		content: generatePackageJson(manifest),
		action: "create",
	});

	result.files.push({
		path: "tsconfig.json",
		content: generateTsConfig(),
		action: "create",
	});

	result.files.push({
		path: ".claude-plugin/marketplace.json",
		content: generateMarketplace(manifest),
		action: "create",
	});

	const gitignoreResult = await generateGitignoreContent(pluginPath);
	result.files.push({
		path: ".gitignore",
		content: gitignoreResult.content,
		action: gitignoreResult.action,
	});

	return result;
}
