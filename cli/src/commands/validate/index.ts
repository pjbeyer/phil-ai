import { z } from "zod";
import type { ParsedArgs } from "../../lib/args.js";
import { bold, dim, error, info, success } from "../../lib/output.js";

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
	plugins: z.array(MarketplacePluginSchema).min(1, "At least one plugin is required"),
});

export type Marketplace = z.infer<typeof MarketplaceSchema>;

type ValidationType = "marketplace" | "plugin" | "auto";

interface ValidationResult {
	valid: boolean;
	type: ValidationType;
	errors: string[];
	warnings: string[];
}

function detectValidationType(targetPath: string): ValidationType {
	if (targetPath.endsWith("marketplace.json")) return "marketplace";
	if (targetPath.endsWith(".json")) return "plugin";
	return "auto";
}

async function validateMarketplace(filePath: string): Promise<ValidationResult> {
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
				result.warnings.push(`Repository may not be accessible: ${plugin.name} (${repoUrl})`);
			}
		} catch {
			result.warnings.push(`Could not verify repository: ${plugin.name} (${repoUrl})`);
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

export async function runValidate(args: ParsedArgs): Promise<void> {
	console.log();
	console.log(bold("Phil-AI Validate"));
	console.log();

	const target = args.positional[0] ?? ".claude-plugin/marketplace.json";
	const typeFlag = (args.flags.type as ValidationType) ?? "auto";
	const detectedType = typeFlag === "auto" ? detectValidationType(target) : typeFlag;

	info(`Validating ${detectedType}: ${target}`);
	console.log();

	const result =
		detectedType === "marketplace"
			? await validateMarketplace(target)
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
