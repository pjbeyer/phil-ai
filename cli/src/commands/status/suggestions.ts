import type { HealthCheckResult } from "../../lib/health.js";

export function getSuggestions(unhealthyResults: HealthCheckResult[]): string[] {
	const suggestions: string[] = [];

	for (const result of unhealthyResults) {
		switch (result.name) {
			case "Storage":
				suggestions.push("Run 'bunx phil-ai install' to create directories");
				break;

			case "Version":
				if (result.message.includes("not found")) {
					suggestions.push("Run 'bunx phil-ai install' to initialize version manifest");
				} else {
					suggestions.push("Run 'bunx phil-ai update' to update components");
				}
				break;

			case "Config":
				if (result.message.includes("not found")) {
					suggestions.push("Run 'bunx phil-ai install --force' to recreate configuration");
				} else {
					suggestions.push("Check ~/.config/phil-ai/config.yaml for syntax errors");
				}
				break;
		}
	}

	return [...new Set(suggestions)];
}
