import { z } from "zod";
import type { ParsedArgs } from "../../lib/args.js";
import { bold, dim, error, info, success } from "../../lib/output.js";
import { dirname } from "node:path";
import { existsSync } from "node:fs";
import { join } from "node:path";

const MarketplacePluginSchema = z.object({
	name: z.string().min(1, "Plugin name is required"),
	version: z.string().regex(/^\d+\.\d+\.\d+/, "Invalid version format"),
	description: z.string().min(1, "Plugin description is required"),
	source: z.object({
		source: z.literal("url"),
		url: z.string().url("Invalid source URL"),
	}),
	author: z.object({
		name: z.string().min(1, "Author name is required"),
		email: z.string().email("Invalid author email"),
	}),
	license: z.string().min(1, "License is required"),
});

const MarketplaceSchema = z.object({
	name: z.string().min(1, "Marketplace name is required"),
	description: z.string().min(1, "Marketplace description is required"),
	owner: z.object({
		name: z.string().min(1, "Owner name is required"),
		email: z.string().email("Invalid owner email"),
		url: z.string().url("Invalid owner URL"),
	}),
	plugins: z
		.array(MarketplacePluginSchema)
		.min(1, "At least one plugin is required"),
});

export type Marketplace = z.infer<typeof MarketplaceSchema>;

const RegistryComponentSchema = z.object({
	name: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(64),
	type: z.enum(["skill", "agent", "plugin", "command", "tool", "bundle", "profile"]),
	description: z.string().max(1024),
	files: z.array(z.union([z.string(), z.object({ path: z.string(), target: z.string() })])).min(1),
});

const RegistrySchema = z.object({
	name: z.string().min(1),
	version: z.string().regex(/^\d+\.\d+\.\d+/),
	author: z.string().min(1),
	components: z.array(RegistryComponentSchema).min(1),
});

type ValidationType = "marketplace" | "plugin" | "registry" | "auto";

interface ValidationResult {
	valid: boolean;
	type: ValidationType;
	errors: string[];
	warnings: string[];
}

function detectValidationType(targetPath: string): ValidationType {
	if (targetPath.endsWith("marketplace.json")) return "marketplace";
	if (targetPath.endsWith("registry.jsonc")) return "registry";
	if (targetPath.endsWith(".json")) return "plugin";
	return "auto";
}

async function validateMarketplace(
	filePath: string,
): Promise<ValidationResult> {
	const result: ValidationResult = {
		valid: true,
		type: "marketplace",
		errors: [],
		warnings: [],
	};

	const file = Bun.file(filePath);
	if (!(await file.exists())) {
		result.valid = false;
		result.errors.push(`File not found: ${filePath}`);
		return result;
	}

	let data: unknown;
	try {
		data = await file.json();
	} catch {
		result.valid = false;
		result.errors.push("Invalid JSON format");
		return result;
	}

	const parseResult = MarketplaceSchema.safeParse(data);
	if (!parseResult.success) {
		result.valid = false;
		for (const issue of parseResult.error.issues) {
			const path = issue.path.join(".");
			result.errors.push(`${path}: ${issue.message}`);
		}
		return result;
	}

	const marketplace = parseResult.data;

	const pluginNames = new Set<string>();
	for (const plugin of marketplace.plugins) {
		if (pluginNames.has(plugin.name)) {
			result.warnings.push(`Duplicate plugin name: ${plugin.name}`);
		}
		pluginNames.add(plugin.name);
	}

	for (const plugin of marketplace.plugins) {
		const repoUrl = plugin.source.url.replace(".git", "");
		try {
			const response = await fetch(repoUrl, { method: "HEAD" });
			if (!response.ok) {
				result.warnings.push(
					`Repository may not be accessible: ${plugin.name} (${repoUrl})`,
				);
			}
		} catch {
			result.warnings.push(
				`Could not verify repository: ${plugin.name} (${repoUrl})`,
			);
		}
	}

	return result;
}

async function validatePlugin(_filePath: string): Promise<ValidationResult> {
	return {
		valid: true,
		type: "plugin",
		errors: [],
		warnings: ["Plugin validation not yet implemented (feature 002)"],
	};
}

async function validateRegistry(
	filePath: string,
): Promise<ValidationResult> {
	const result: ValidationResult = {
		valid: true,
		type: "registry",
		errors: [],
		warnings: [],
	};

	const file = Bun.file(filePath);
	if (!(await file.exists())) {
		result.valid = false;
		result.errors.push(`File not found: ${filePath}`);
		return result;
	}

	let data: unknown;
	try {
		const text = await file.text();
		data = JSON.parse(text);
	} catch {
		result.valid = false;
		result.errors.push("Invalid JSON format");
		return result;
	}

	const parseResult = RegistrySchema.safeParse(data);
	if (!parseResult.success) {
		result.valid = false;
		for (const issue of parseResult.error.issues) {
			const path = issue.path.join(".");
			result.errors.push(`${path}: ${issue.message}`);
		}
		return result;
	}

	const registry = parseResult.data;

	// Check for duplicate component names
	const componentNames = new Set<string>();
	for (const component of registry.components) {
		if (componentNames.has(component.name)) {
			result.warnings.push(`Duplicate component name: ${component.name}`);
		}
		componentNames.add(component.name);
	}

	// Check that referenced files exist on disk
	const baseDir = dirname(filePath);
	for (const component of registry.components) {
		for (const fileEntry of component.files) {
			const filePath2 = typeof fileEntry === "string" ? fileEntry : fileEntry.path;
			const absolutePath = join(baseDir, filePath2);
			if (!existsSync(absolutePath)) {
				result.warnings.push(`Component "${component.name}": file not found: ${filePath2}`);
			}
		}
	}

	return result;
}

export async function runValidate(args: ParsedArgs): Promise<void> {
	console.log();
	console.log(bold("Phil-AI Validate"));
	console.log();

	const target = args.subcommand ?? args.positional[0] ?? ".claude-plugin/marketplace.json";
	const typeFlag = (args.flags.type as ValidationType) ?? "auto";
	const detectedType =
		typeFlag === "auto" ? detectValidationType(target) : typeFlag;

	info(`Validating ${detectedType}: ${target}`);
	console.log();

	const result =
		detectedType === "marketplace"
			? await validateMarketplace(target)
			: detectedType === "registry"
				? await validateRegistry(target)
				: await validatePlugin(target);

	if (result.valid) {
		success("Validation passed");
	} else {
		error("Validation failed");
	}

	if (result.errors.length > 0) {
		console.log();
		console.log(bold("Errors:"));
		for (const err of result.errors) {
			console.log(`  ${dim("-")} ${err}`);
		}
	}

	if (result.warnings.length > 0) {
		console.log();
		console.log(bold("Warnings:"));
		for (const warn of result.warnings) {
			console.log(`  ${dim("-")} ${warn}`);
		}
	}

	console.log();

	if (!result.valid) {
		process.exit(1);
	}
}
