import type { VersionManifest, ComponentNameType } from "../schemas/version.js";
import { isCompatible, parseSemver } from "./semver.js";

export interface ValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
}

const REQUIRED_COMPONENTS: ComponentNameType[] = ["core", "cli"];

export function checkCompatibility(manifest: VersionManifest): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	for (const required of REQUIRED_COMPONENTS) {
		const component = manifest.components.find((c) => c.component === required);
		if (!component) {
			errors.push(`Missing required component: ${required}`);
		}
	}

	const coreComponent = manifest.components.find((c) => c.component === "core");
	if (coreComponent) {
		if (!isCompatible(manifest.dataSchemaVersion, coreComponent.version, "major")) {
			errors.push(
				`Data schema ${manifest.dataSchemaVersion} incompatible with core ${coreComponent.version}`,
			);
		}
	}

	for (const component of manifest.components) {
		if (component.minCompatible) {
			const min = parseSemver(component.minCompatible);
			const current = parseSemver(component.version);

			if (min && current) {
				if (current.major < min.major || 
					(current.major === min.major && current.minor < min.minor) ||
					(current.major === min.major && current.minor === min.minor && current.patch < min.patch)) {
					errors.push(
						`Component ${component.component} version ${component.version} is below minimum ${component.minCompatible}`,
					);
				}
			}
		}
	}

	const daysSinceCheck = manifest.lastCheck
		? (Date.now() - new Date(manifest.lastCheck).getTime()) / (1000 * 60 * 60 * 24)
		: Infinity;

	if (daysSinceCheck > 30) {
		warnings.push("Version manifest has not been checked in over 30 days");
	}

	return {
		valid: errors.length === 0,
		errors,
		warnings,
	};
}

export function needsMigration(
	currentDataVersion: string,
	targetDataVersion: string,
): boolean {
	const current = parseSemver(currentDataVersion);
	const target = parseSemver(targetDataVersion);

	if (!current || !target) {
		return false;
	}

	return current.major < target.major;
}

export function getMigrationPath(
	from: string,
	to: string,
): string[] {
	const fromVersion = parseSemver(from);
	const toVersion = parseSemver(to);

	if (!fromVersion || !toVersion) {
		return [];
	}

	if (fromVersion.major >= toVersion.major) {
		return [];
	}

	const path: string[] = [];
	for (let major = fromVersion.major + 1; major <= toVersion.major; major++) {
		path.push(`${major}.0.0`);
	}

	return path;
}
