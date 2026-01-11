export interface SemVer {
	major: number;
	minor: number;
	patch: number;
}

export function parseSemver(version: string): SemVer | null {
	const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
	if (!match) {
		return null;
	}
	return {
		major: Number.parseInt(match[1]!, 10),
		minor: Number.parseInt(match[2]!, 10),
		patch: Number.parseInt(match[3]!, 10),
	};
}

export function formatSemver(version: SemVer): string {
	return `${version.major}.${version.minor}.${version.patch}`;
}

export function compareSemver(a: string, b: string): number {
	const va = parseSemver(a);
	const vb = parseSemver(b);

	if (!va || !vb) {
		throw new Error(`Invalid semver: ${!va ? a : b}`);
	}

	if (va.major !== vb.major) return va.major - vb.major;
	if (va.minor !== vb.minor) return va.minor - vb.minor;
	return va.patch - vb.patch;
}

export function isCompatible(
	current: string,
	required: string,
	strategy: "major" | "minor" | "exact" = "major",
): boolean {
	const curr = parseSemver(current);
	const req = parseSemver(required);

	if (!curr || !req) {
		return false;
	}

	switch (strategy) {
		case "exact":
			return (
				curr.major === req.major &&
				curr.minor === req.minor &&
				curr.patch === req.patch
			);
		case "minor":
			return curr.major === req.major && curr.minor >= req.minor;
		case "major":
		default:
			return curr.major === req.major;
	}
}

export function isNewerThan(a: string, b: string): boolean {
	return compareSemver(a, b) > 0;
}

export function isOlderThan(a: string, b: string): boolean {
	return compareSemver(a, b) < 0;
}

export function incrementVersion(
	version: string,
	type: "major" | "minor" | "patch",
): string {
	const v = parseSemver(version);
	if (!v) {
		throw new Error(`Invalid semver: ${version}`);
	}

	switch (type) {
		case "major":
			return formatSemver({ major: v.major + 1, minor: 0, patch: 0 });
		case "minor":
			return formatSemver({ major: v.major, minor: v.minor + 1, patch: 0 });
		case "patch":
			return formatSemver({
				major: v.major,
				minor: v.minor,
				patch: v.patch + 1,
			});
	}
}
