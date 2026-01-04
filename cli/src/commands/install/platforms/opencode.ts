import { step, warn } from "../../../lib/output.js";

export interface OpenCodeRegistrationResult {
	registered: boolean;
	pluginPath: string | null;
}

export async function registerOpenCode(
	dryRun: boolean = false,
): Promise<OpenCodeRegistrationResult> {
	if (dryRun) {
		step("Would register OpenCode plugin");
		return { registered: false, pluginPath: null };
	}

	warn("OpenCode registration: stub (full implementation in Phase 6)");

	return {
		registered: true,
		pluginPath: null,
	};
}
