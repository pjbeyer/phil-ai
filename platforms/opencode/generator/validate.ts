import type { OpenCodePlugin } from "./transform.js";

export interface ValidationResult {
	valid: boolean;
	errors: string[];
}

export function validatePlugin(plugin: OpenCodePlugin): ValidationResult {
	const errors: string[] = [];

	if (!plugin.name) {
		errors.push("Plugin must have a name");
	}

	if (!plugin.version.match(/^\d+\.\d+\.\d+$/)) {
		errors.push("Version must be valid semver");
	}

	if (plugin.tools.length === 0) {
		errors.push("Plugin must have at least one tool");
	}

	for (const tool of plugin.tools) {
		if (!tool.name.match(/^[a-z][a-z0-9_]*$/)) {
			errors.push(`Invalid tool name: ${tool.name}`);
		}
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}
