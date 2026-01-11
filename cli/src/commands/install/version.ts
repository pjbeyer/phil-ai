import {
	initVersionManifest,
	readVersionManifest,
} from "@phil-ai/shared/version";
import { step, success } from "../../lib/output.js";

const CURRENT_VERSION = "0.1.0";

export async function setupVersion(
	dryRun = false,
	force = false,
): Promise<boolean> {
	const manifest = await readVersionManifest();

	if (manifest && !force) {
		step("Version manifest already exists, skipping");
		return false;
	}

	if (dryRun) {
		step("Would create version manifest");
		return false;
	}

	await initVersionManifest(CURRENT_VERSION);

	success(`Initialized version manifest (v${CURRENT_VERSION})`);
	return true;
}
