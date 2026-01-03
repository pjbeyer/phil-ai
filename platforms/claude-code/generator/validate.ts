import type { ClaudeCodePlugin } from "./transform.js";

export interface ValidationResult {
	valid: boolean;
	errors: string[];
}

export function validatePlugin(plugin: ClaudeCodePlugin): ValidationResult {
	const errors: string[] = [];

	if (!plugin.name.startsWith("phil-ai-")) {
		errors.push("Plugin name must start with 'phil-ai-'");
	}

	if (!plugin.version.match(/^\d+\.\d+\.\d+$/)) {
		errors.push("Version must be valid semver");
	}

	if (plugin.commands.length === 0) {
		errors.push("Plugin must have at least one command");
	}

	for (const cmd of plugin.commands) {
		if (!cmd.name.match(/^[a-z][a-z0-9-]*$/)) {
			errors.push(`Invalid command name: ${cmd.name}`);
		}
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}
