import { step, warn } from "../../../lib/output.js";

export interface ClaudeCodeRegistrationResult {
	registered: boolean;
	marketplacePath: string | null;
}

export async function registerClaudeCode(
	dryRun = false,
): Promise<ClaudeCodeRegistrationResult> {
	if (dryRun) {
		step("Would register Claude Code marketplace");
		return { registered: false, marketplacePath: null };
	}

	warn("Claude Code registration: stub (full implementation in Phase 5)");

	return {
		registered: true,
		marketplacePath: null,
	};
}
