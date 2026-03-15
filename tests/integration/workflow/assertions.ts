import { expect } from "bun:test";
import type { DriftReport, PatternReport } from "@phil-ai/shared";

type GateResult = "pass" | "fail" | "blocked";

export function assertGateResult(output: string, gateName: string, expected: GateResult): void {
	const expectedLine = `[${expected.toUpperCase()}] ${gateName}:`;
	expect(output).toContain(expectedLine);
}

export function assertVelocity(value: number, minimum = 0): void {
	expect(Number.isFinite(value)).toBe(true);
	expect(value).toBeGreaterThanOrEqual(minimum);
}

export function assertPatternDetected(
	report: PatternReport,
	patternType: string,
	severity?: "info" | "warning" | "critical",
): void {
	const match = report.entries.find((entry) => {
		if (entry.type !== patternType) {
			return false;
		}
		if (severity !== undefined && entry.severity !== severity) {
			return false;
		}
		return true;
	});
	expect(match).toBeDefined();
}

export function assertDriftDetected(report: DriftReport, driftType: string): void {
	const match = report.entries.find((entry) => entry.type === driftType);
	expect(match).toBeDefined();
}
