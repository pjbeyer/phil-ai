import { describe, expect, test } from "bun:test";
import {
	getActiveBranches,
	getBranchAge,
	getRecentCommits,
	isMerged,
} from "@phil-ai/shared";

describe("getActiveBranches", () => {
	test("returns array of branches for current repo", async () => {
		const branches = await getActiveBranches([process.cwd()]);

		expect(Array.isArray(branches)).toBe(true);
		expect(branches.length).toBeGreaterThan(0);
	});

	test("returns sorted branch names", async () => {
		const branches = await getActiveBranches([process.cwd()]);

		const sorted = [...branches].sort();
		expect(branches).toEqual(sorted);
	});

	test("includes main branch in current repo", async () => {
		const branches = await getActiveBranches([process.cwd()]);

		// Most repos have a main or master branch
		const hasMainBranch =
			branches.includes("main") || branches.includes("master");
		expect(hasMainBranch).toBe(true);
	});

	test("returns empty array for non-existent directory", async () => {
		const branches = await getActiveBranches([
			"/tmp/non-existent-dir-phil-ai-test",
		]);

		expect(branches).toEqual([]);
	});

	test("handles multiple directories", async () => {
		const branches = await getActiveBranches([
			process.cwd(),
			"/tmp/non-existent-dir-phil-ai-test",
		]);

		expect(Array.isArray(branches)).toBe(true);
		expect(branches.length).toBeGreaterThan(0);
	});

	test("returns empty array for empty input", async () => {
		const branches = await getActiveBranches([]);

		expect(branches).toEqual([]);
	});

	test("deduplicates branches across directories", async () => {
		// Passing the same directory twice should not duplicate branches
		const branches = await getActiveBranches([
			process.cwd(),
			process.cwd(),
		]);

		const uniqueBranches = [...new Set(branches)];
		expect(branches).toEqual(uniqueBranches);
	});
});

describe("getBranchAge", () => {
	test("returns non-negative number for main branch", async () => {
		const age = await getBranchAge("main", process.cwd());

		expect(age).toBeGreaterThanOrEqual(0);
		expect(typeof age).toBe("number");
	});

	test("returns 0 for non-existent branch", async () => {
		const age = await getBranchAge(
			"non-existent-branch-phil-ai-test",
			process.cwd(),
		);

		expect(age).toBe(0);
	});

	test("returns 0 for non-existent directory", async () => {
		const age = await getBranchAge(
			"main",
			"/tmp/non-existent-dir-phil-ai-test",
		);

		expect(age).toBe(0);
	});

	test("returns integer value", async () => {
		const age = await getBranchAge("main", process.cwd());

		expect(Number.isInteger(age)).toBe(true);
	});
});

describe("isMerged", () => {
	test("returns boolean for main into main", async () => {
		const merged = await isMerged("main", "main", process.cwd());

		expect(typeof merged).toBe("boolean");
	});

	test("main is merged into itself", async () => {
		const merged = await isMerged("main", "main", process.cwd());

		expect(merged).toBe(true);
	});

	test("returns false for non-existent branch", async () => {
		const merged = await isMerged(
			"non-existent-branch-phil-ai-test",
			"main",
			process.cwd(),
		);

		expect(merged).toBe(false);
	});

	test("returns false for non-existent directory", async () => {
		const merged = await isMerged(
			"main",
			"main",
			"/tmp/non-existent-dir-phil-ai-test",
		);

		expect(merged).toBe(false);
	});
});

describe("getRecentCommits", () => {
	test("returns array of commits for main branch", async () => {
		const commits = await getRecentCommits("main", 5, process.cwd());

		expect(Array.isArray(commits)).toBe(true);
		expect(commits.length).toBeGreaterThan(0);
		expect(commits.length).toBeLessThanOrEqual(5);
	});

	test("each commit has required fields", async () => {
		const commits = await getRecentCommits("main", 3, process.cwd());

		for (const commit of commits) {
			expect(commit.hash).toBeDefined();
			expect(typeof commit.hash).toBe("string");
			expect(commit.hash.length).toBeGreaterThan(0);

			expect(commit.subject).toBeDefined();
			expect(typeof commit.subject).toBe("string");

			expect(commit.timestamp).toBeInstanceOf(Date);
			expect(Number.isNaN(commit.timestamp.getTime())).toBe(false);
		}
	});

	test("returns empty array for non-existent branch", async () => {
		const commits = await getRecentCommits(
			"non-existent-branch-phil-ai-test",
			5,
			process.cwd(),
		);

		expect(commits).toEqual([]);
	});

	test("returns empty array for non-existent directory", async () => {
		const commits = await getRecentCommits(
			"main",
			5,
			"/tmp/non-existent-dir-phil-ai-test",
		);

		expect(commits).toEqual([]);
	});

	test("respects count parameter", async () => {
		const commits1 = await getRecentCommits("main", 1, process.cwd());
		const commits3 = await getRecentCommits("main", 3, process.cwd());

		expect(commits1.length).toBeLessThanOrEqual(1);
		expect(commits3.length).toBeLessThanOrEqual(3);
		expect(commits3.length).toBeGreaterThanOrEqual(commits1.length);
	});
});
