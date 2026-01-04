import { error, dim, yellow } from "./output.js";

export class CliError extends Error {
	constructor(
		message: string,
		public readonly suggestions: string[] = [],
		public readonly exitCode: number = 1,
	) {
		super(message);
		this.name = "CliError";
	}
}

export function handleError(err: unknown): never {
	if (err instanceof CliError) {
		error(err.message);
		if (err.suggestions.length > 0) {
			console.log();
			console.log(dim("Suggestions:"));
			for (const suggestion of err.suggestions) {
				console.log(`  ${yellow("→")} ${suggestion}`);
			}
		}
		process.exit(err.exitCode);
	}

	if (err instanceof Error) {
		error(err.message);
		if (process.env.DEBUG) {
			console.error(err.stack);
		}
		process.exit(1);
	}

	error(String(err));
	process.exit(1);
}

export function assertCondition(
	condition: boolean,
	message: string,
	suggestions: string[] = [],
): asserts condition {
	if (!condition) {
		throw new CliError(message, suggestions);
	}
}
