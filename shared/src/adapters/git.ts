import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

/**
 * Represents a single commit in git history
 */
export interface CommitInfo {
	hash: string;
	subject: string;
	timestamp: Date;
}

/**
 * Get all active branches from the given profile directories
 * @param profileDirs - Array of directory paths to check for git repositories
 * @returns Promise resolving to array of unique branch names
 */
export async function getActiveBranches(
	profileDirs: string[],
): Promise<string[]> {
	const branches = new Set<string>();

	for (const dir of profileDirs) {
		if (!existsSync(dir)) {
			continue;
		}

		try {
			const output = execSync(
				`git -C "${dir}" branch --format='%(refname:short)'`,
				{
					encoding: "utf-8",
					stdio: ["pipe", "pipe", "pipe"],
				},
			);

			const lines = output
				.split("\n")
				.map((line) => line.trim())
				.filter((line) => line.length > 0);

			for (const branch of lines) {
				branches.add(branch);
			}
		} catch {
			// Graceful degradation: skip directories that aren't git repos or have errors
			continue;
		}
	}

	return Array.from(branches).sort();
}

/**
 * Get the age of a branch in days since its last commit
 * @param branch - Branch name to check
 * @param repoDir - Optional repository directory (defaults to current directory)
 * @returns Promise resolving to number of days since last commit, or 0 if branch doesn't exist
 */
export async function getBranchAge(
	branch: string,
	repoDir?: string,
): Promise<number> {
	try {
		const dir = repoDir || ".";
		const output = execSync(
			`git -C "${dir}" log -1 --format="%ct" "${branch}"`,
			{
				encoding: "utf-8",
				stdio: ["pipe", "pipe", "pipe"],
			},
		);

		const timestamp = parseInt(output.trim(), 10);
		if (Number.isNaN(timestamp)) {
			return 0;
		}

		const commitTime = timestamp * 1000; // Convert to milliseconds
		const now = Date.now();
		const ageMs = now - commitTime;
		const ageDays = ageMs / (1000 * 60 * 60 * 24);

		return Math.max(0, Math.round(ageDays));
	} catch {
		// Graceful degradation: return 0 if branch doesn't exist or git fails
		return 0;
	}
}

/**
 * Check if a branch has been merged into the target branch
 * @param branch - Branch name to check
 * @param target - Target branch to check against (e.g., "main", "develop")
 * @param repoDir - Optional repository directory (defaults to current directory)
 * @returns Promise resolving to true if branch is merged, false otherwise
 */
export async function isMerged(
	branch: string,
	target: string,
	repoDir?: string,
): Promise<boolean> {
	try {
		const dir = repoDir || ".";
		const output = execSync(
			`git -C "${dir}" branch --merged "${target}"`,
			{
				encoding: "utf-8",
				stdio: ["pipe", "pipe", "pipe"],
			},
		);

		const branches = output
			.split("\n")
			.map((line) => line.trim().replace(/^\*\s+/, ""))
			.filter((line) => line.length > 0);

		return branches.includes(branch);
	} catch {
		// Graceful degradation: return false if git fails
		return false;
	}
}

/**
 * Get recent commits from a branch
 * @param branch - Branch name to get commits from
 * @param count - Number of commits to retrieve
 * @param repoDir - Optional repository directory (defaults to current directory)
 * @returns Promise resolving to array of CommitInfo objects
 */
export async function getRecentCommits(
	branch: string,
	count: number,
	repoDir?: string,
): Promise<CommitInfo[]> {
	try {
		const dir = repoDir || ".";
		const output = execSync(
			`git -C "${dir}" log "${branch}" -n ${count} --format="%H|%s|%ct"`,
			{
				encoding: "utf-8",
				stdio: ["pipe", "pipe", "pipe"],
			},
		);

		const commits: CommitInfo[] = [];
		const lines = output
			.split("\n")
			.map((line) => line.trim())
			.filter((line) => line.length > 0);

		for (const line of lines) {
			const parts = line.split("|");
			if (parts.length >= 3) {
				const hash = parts[0];
				const subject = parts[1];
				const timestampStr = parts[2];

				if (hash && subject && timestampStr) {
					const timestamp = parseInt(timestampStr, 10);

					if (!Number.isNaN(timestamp)) {
						commits.push({
							hash,
							subject,
							timestamp: new Date(timestamp * 1000),
						});
					}
				}
			}
		}

		return commits;
	} catch {
		// Graceful degradation: return empty array if git fails
		return [];
	}
}
