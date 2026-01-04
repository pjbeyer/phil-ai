import type { ParsedArgs } from "../../lib/args.js";
import { getBoolFlag } from "../../lib/args.js";
import { bold, green, yellow, red, dim } from "../../lib/output.js";
import {
	aggregateStatus,
	getStatusIcon,
	type HealthCheckResult,
	type HealthStatus,
} from "../../lib/health.js";
import { checkStorage } from "./checks/storage.js";
import { checkVersion } from "./checks/version.js";
import { checkConfig } from "./checks/config.js";
import { getSuggestions } from "./suggestions.js";

export interface StatusOptions {
	json: boolean;
	verbose: boolean;
}

function parseStatusOptions(args: ParsedArgs): StatusOptions {
	return {
		json: getBoolFlag(args, "json"),
		verbose: getBoolFlag(args, "verbose"),
	};
}

function colorStatus(status: HealthStatus): string {
	switch (status) {
		case "healthy":
			return green(status);
		case "degraded":
			return yellow(status);
		case "unhealthy":
			return red(status);
	}
}

function colorIcon(status: HealthStatus): string {
	const icon = getStatusIcon(status);
	switch (status) {
		case "healthy":
			return green(icon);
		case "degraded":
			return yellow(icon);
		case "unhealthy":
			return red(icon);
	}
}

function formatTextOutput(
	results: HealthCheckResult[],
	verbose: boolean,
): void {
	const overall = aggregateStatus(results);

	console.log();
	console.log(`${bold("Phil-AI Status")}: ${colorStatus(overall)}`);
	console.log();

	for (const result of results) {
		const icon = colorIcon(result.status);
		console.log(`${icon} ${bold(result.name)}: ${result.message}`);

		if (verbose && result.details) {
			for (const [key, value] of Object.entries(result.details)) {
				console.log(`    ${dim(key)}: ${JSON.stringify(value)}`);
			}
		}
	}

	const unhealthy = results.filter((r) => r.status === "unhealthy");
	if (unhealthy.length > 0) {
		const suggestions = getSuggestions(unhealthy);
		if (suggestions.length > 0) {
			console.log();
			console.log(bold("Suggestions:"));
			for (const suggestion of suggestions) {
				console.log(`  ${yellow("→")} ${suggestion}`);
			}
		}
	}

	console.log();
}

function formatJsonOutput(results: HealthCheckResult[]): void {
	const overall = aggregateStatus(results);
	const output = {
		status: overall,
		checks: results,
		timestamp: new Date().toISOString(),
	};
	console.log(JSON.stringify(output, null, 2));
}

export async function runStatus(args: ParsedArgs): Promise<void> {
	const options = parseStatusOptions(args);

	const results: HealthCheckResult[] = await Promise.all([
		checkStorage(),
		checkVersion(),
		checkConfig(),
	]);

	if (options.json) {
		formatJsonOutput(results);
	} else {
		formatTextOutput(results, options.verbose);
	}

	const overall = aggregateStatus(results);
	if (overall === "unhealthy") {
		process.exit(1);
	}
}
