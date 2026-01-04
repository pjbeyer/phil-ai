import { readVersionManifest, checkCompatibility } from "@phil-ai/shared/version";
import type { HealthCheckResult } from "../../../lib/health.js";

export async function checkVersion(): Promise<HealthCheckResult> {
	const manifest = await readVersionManifest();

	if (!manifest) {
		return {
			name: "Version",
			status: "unhealthy",
			message: "Version manifest not found",
		};
	}

	const compatibility = checkCompatibility(manifest);

	if (!compatibility.valid) {
		return {
			name: "Version",
			status: "unhealthy",
			message: compatibility.errors.join("; "),
			details: { errors: compatibility.errors },
		};
	}

	if (compatibility.warnings.length > 0) {
		return {
			name: "Version",
			status: "degraded",
			message: compatibility.warnings.join("; "),
			details: {
				version: manifest._version,
				warnings: compatibility.warnings,
			},
		};
	}

	return {
		name: "Version",
		status: "healthy",
		message: `v${manifest._version}`,
		details: {
			version: manifest._version,
			dataSchema: manifest.dataSchemaVersion,
			components: manifest.components.length,
		},
	};
}
