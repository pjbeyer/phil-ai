import { ConfigSchema } from "@phil-ai/shared/schemas";
import { getConfigPaths, readYaml } from "@phil-ai/shared/storage";
import type { HealthCheckResult } from "../../../lib/health.js";

export async function checkConfig(): Promise<HealthCheckResult> {
	const configPaths = getConfigPaths();

	try {
		const config = await readYaml(configPaths.config, ConfigSchema);

		if (!config) {
			return {
				name: "Config",
				status: "unhealthy",
				message: "Configuration file not found",
			};
		}

		return {
			name: "Config",
			status: "healthy",
			message: "Valid configuration",
			details: {
				version: config._version,
				platforms: {
					claudeCode: config.platforms.claudeCode.enabled,
					opencode: config.platforms.opencode.enabled,
				},
			},
		};
	} catch (err) {
		return {
			name: "Config",
			status: "unhealthy",
			message: `Invalid configuration: ${err instanceof Error ? err.message : "unknown error"}`,
		};
	}
}
