import { getActiveBranches, getBranchAge } from "../../adapters/git.js";
import type { DriftEntry } from "../types.js";

const STALE_BRANCH_AGE_DAYS = 7;

function isInProgressBranch(branch: string): boolean {
	return branch.includes("in-progress");
}

export async function detectStaleWorkItems(): Promise<DriftEntry[]> {
	const detectedAt = new Date().toISOString();
	const activeBranches = await getActiveBranches([process.cwd()]);
	const staleEntries: DriftEntry[] = [];

	for (const branch of activeBranches) {
		if (!isInProgressBranch(branch)) {
			continue;
		}

		const ageDays = await getBranchAge(branch, process.cwd());
		if (ageDays <= STALE_BRANCH_AGE_DAYS) {
			continue;
		}

		staleEntries.push({
			type: "stale-work-item",
			severity: "warning",
			description: `Branch ${branch} has been in-progress with no commits for ${ageDays} days`,
			itemId: branch,
			detectedAt,
			suggestedAction: "Resume the work item or close/merge the stale branch",
		});
	}

	return staleEntries;
}
