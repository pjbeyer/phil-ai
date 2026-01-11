import path from "node:path";
import { type PluginManifest, PluginManifestSchema } from "./schemas.js";

export interface ValidationResult {
	valid: boolean;
	manifest?: PluginManifest;
	errors: string[];
	warnings: string[];
}

export async function validatePluginDirectory(
	pluginPath: string,
): Promise<ValidationResult> {
	const result: ValidationResult = {
		valid: true,
		errors: [],
		warnings: [],
	};

	const pluginJsonPath = path.join(pluginPath, ".claude-plugin", "plugin.json");
	const pluginFile = Bun.file(pluginJsonPath);

	if (!(await pluginFile.exists())) {
		result.valid = false;
		result.errors.push(
			"Not a valid Claude Code plugin: missing .claude-plugin/plugin.json",
		);
		return result;
	}

	let data: unknown;
	try {
		data = await pluginFile.json();
	} catch {
		result.valid = false;
		result.errors.push("Invalid plugin.json: malformed JSON");
		return result;
	}

	const parseResult = PluginManifestSchema.safeParse(data);
	if (!parseResult.success) {
		result.valid = false;
		result.errors.push("Invalid plugin.json: missing required fields");
		for (const issue of parseResult.error.issues) {
			const fieldPath = issue.path.join(".");
			result.errors.push(`  - ${fieldPath}: ${issue.message}`);
		}
		return result;
	}

	result.manifest = parseResult.data;

	const commandsDir = path.join(pluginPath, "commands");
	const commandsDirExists = await checkDirectoryExists(commandsDir);
	if (!commandsDirExists) {
		result.warnings.push(
			"No commands directory found. Generated plugin will have no commands.",
		);
	}

	return result;
}

export async function validatePath(
	targetPath: string,
): Promise<{ valid: boolean; error?: string }> {
	try {
		const stat = await Bun.file(path.join(targetPath, ".")).exists();
		if (!stat) {
			const dirExists = await checkDirectoryExists(targetPath);
			if (!dirExists) {
				return { valid: false, error: `Path does not exist: ${targetPath}` };
			}
		}
		return { valid: true };
	} catch {
		return { valid: false, error: `Path does not exist: ${targetPath}` };
	}
}

async function checkDirectoryExists(dirPath: string): Promise<boolean> {
	try {
		const glob = new Bun.Glob("*");
		for await (const _ of glob.scan({ cwd: dirPath, dot: true })) {
			return true;
		}
		return true;
	} catch {
		return false;
	}
}
