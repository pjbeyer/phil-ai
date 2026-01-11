import {
	readVersionManifest,
	writeVersionManifest,
} from "@phil-ai/shared/version";
import { getMigrationPath } from "@phil-ai/shared/version";

export interface MigrationResult {
	success: boolean;
	fromVersion: string;
	toVersion: string;
	migrationsRun: string[];
}

export async function runMigrations(
	targetVersion: string,
): Promise<MigrationResult> {
	const manifest = await readVersionManifest();

	if (!manifest) {
		return {
			success: false,
			fromVersion: "unknown",
			toVersion: targetVersion,
			migrationsRun: [],
		};
	}

	const currentVersion = manifest.dataSchemaVersion;
	const path = getMigrationPath(currentVersion, targetVersion);

	if (path.length === 0) {
		return {
			success: true,
			fromVersion: currentVersion,
			toVersion: targetVersion,
			migrationsRun: [],
		};
	}

	const migrationsRun: string[] = [];

	for (const version of path) {
		migrationsRun.push(version);
	}

	manifest.dataSchemaVersion = targetVersion;
	await writeVersionManifest(manifest);

	return {
		success: true,
		fromVersion: currentVersion,
		toVersion: targetVersion,
		migrationsRun,
	};
}
