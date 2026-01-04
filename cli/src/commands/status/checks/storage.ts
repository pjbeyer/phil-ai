import {
	getDataPaths,
	getConfigPaths,
	dirExists,
	isWritable,
} from "@phil-ai/shared/storage";
import type { HealthCheckResult } from "../../../lib/health.js";

export async function checkStorage(): Promise<HealthCheckResult> {
	const dataPaths = getDataPaths();
	const configPaths = getConfigPaths();

	const dataExists = await dirExists(dataPaths.root);
	const configExists = await dirExists(configPaths.root);

	if (!dataExists || !configExists) {
		return {
			name: "Storage",
			status: "unhealthy",
			message: "Phil-AI directories not found",
			details: {
				dataDir: dataExists ? "exists" : "missing",
				configDir: configExists ? "exists" : "missing",
			},
		};
	}

	const dataWritable = await isWritable(dataPaths.root);
	const configWritable = await isWritable(configPaths.root);

	if (!dataWritable || !configWritable) {
		return {
			name: "Storage",
			status: "degraded",
			message: "Some directories not writable",
			details: {
				dataDir: dataWritable ? "writable" : "read-only",
				configDir: configWritable ? "writable" : "read-only",
			},
		};
	}

	return {
		name: "Storage",
		status: "healthy",
		message: "All directories accessible",
		details: {
			dataDir: dataPaths.root,
			configDir: configPaths.root,
		},
	};
}
