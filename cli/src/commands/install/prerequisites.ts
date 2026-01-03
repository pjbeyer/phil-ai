import { CliError } from "../../lib/errors.js";

const MIN_BUN_VERSION = "1.0.0";

export interface PrerequisiteResult {
	name: string;
	passed: boolean;
	message: string;
}

export async function checkPrerequisites(): Promise<PrerequisiteResult[]> {
	const results: PrerequisiteResult[] = [];

	results.push(await checkBunVersion());
	results.push(await checkDiskSpace());

	return results;
}

export async function checkBunVersion(): Promise<PrerequisiteResult> {
	const version = Bun.version;
	const [major] = version.split(".").map(Number);

	if (major === undefined || major < 1) {
		return {
			name: "Bun Version",
			passed: false,
			message: `Bun ${MIN_BUN_VERSION}+ required, found ${version}`,
		};
	}

	return {
		name: "Bun Version",
		passed: true,
		message: `Bun ${version}`,
	};
}

export async function checkDiskSpace(): Promise<PrerequisiteResult> {
	try {
		const homeDir = Bun.env.HOME ?? "/tmp";
		const { access, constants } = await import("node:fs/promises");
		
		await access(homeDir, constants.W_OK);

		return {
			name: "Disk Space",
			passed: true,
			message: "Home directory writable",
		};
	} catch {
		return {
			name: "Disk Space",
			passed: false,
			message: "Home directory not writable",
		};
	}
}

export function assertPrerequisites(results: PrerequisiteResult[]): void {
	const failed = results.filter((r) => !r.passed);

	if (failed.length > 0) {
		throw new CliError(
			`Prerequisites not met: ${failed.map((r) => r.name).join(", ")}`,
			failed.map((r) => r.message),
		);
	}
}
