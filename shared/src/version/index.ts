export {
	parseSemver,
	formatSemver,
	compareSemver,
	isCompatible,
	isNewerThan,
	isOlderThan,
	incrementVersion,
	type SemVer,
} from "./semver.js";

export {
	readVersionManifest,
	writeVersionManifest,
	initVersionManifest,
	getComponentVersion,
	updateComponentVersion,
} from "./manifest.js";

export {
	checkCompatibility,
	needsMigration,
	getMigrationPath,
	type ValidationResult,
} from "./compatibility.js";
