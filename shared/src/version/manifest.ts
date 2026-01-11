import {
	type ComponentNameType,
	type VersionManifest,
	VersionManifestSchema,
	createVersionManifest,
} from "../schemas/version.js";
import { getDataPaths } from "../storage/directories.js";
import { readJson, writeJson } from "../storage/json.js";

export async function readVersionManifest(): Promise<VersionManifest | null> {
	const paths = getDataPaths();
	return readJson(paths.version, VersionManifestSchema);
}

export async function writeVersionManifest(
	manifest: VersionManifest,
): Promise<void> {
	const paths = getDataPaths();
	await writeJson(paths.version, manifest, VersionManifestSchema);
}

export async function initVersionManifest(
	version: string,
): Promise<VersionManifest> {
	const manifest = createVersionManifest(version);
	await writeVersionManifest(manifest);
	return manifest;
}

export function getComponentVersion(
	manifest: VersionManifest,
	component: ComponentNameType,
): string | null {
	const comp = manifest.components.find((c) => c.component === component);
	return comp?.version ?? null;
}

export function updateComponentVersion(
	manifest: VersionManifest,
	component: ComponentNameType,
	version: string,
): VersionManifest {
	const now = new Date().toISOString();
	const existing = manifest.components.findIndex(
		(c) => c.component === component,
	);

	const updatedComponents = [...manifest.components];

	if (existing >= 0) {
		updatedComponents[existing] = {
			...updatedComponents[existing]!,
			version,
			updatedAt: now,
		};
	} else {
		updatedComponents.push({
			component,
			version,
			installedAt: now,
			updatedAt: now,
		});
	}

	return {
		...manifest,
		components: updatedComponents,
		lastCheck: now,
	};
}
