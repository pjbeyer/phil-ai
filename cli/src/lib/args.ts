export interface ParsedArgs {
	command: string | null;
	subcommand: string | null;
	flags: Record<string, string | boolean>;
	positional: string[];
}

export function parseArgs(args: string[]): ParsedArgs {
	const result: ParsedArgs = {
		command: null,
		subcommand: null,
		flags: {},
		positional: [],
	};

	let i = 0;
	while (i < args.length) {
		const arg = args[i]!;

		if (arg.startsWith("--")) {
			const [key, value] = arg.slice(2).split("=");
			if (key) {
				result.flags[key] = value ?? true;
			}
		} else if (arg.startsWith("-") && arg.length === 2) {
			const key = arg.slice(1);
			const nextArg = args[i + 1];
			if (nextArg && !nextArg.startsWith("-")) {
				result.flags[key] = nextArg;
				i++;
			} else {
				result.flags[key] = true;
			}
		} else if (!result.command) {
			result.command = arg;
		} else if (!result.subcommand) {
			result.subcommand = arg;
		} else {
			result.positional.push(arg);
		}
		i++;
	}

	return result;
}

export function getFlag(
	args: ParsedArgs,
	name: string,
): string | boolean | undefined {
	return args.flags[name];
}

export function getBoolFlag(args: ParsedArgs, name: string): boolean {
	const value = args.flags[name];
	return value === true || value === "true";
}

export function getStringFlag(
	args: ParsedArgs,
	name: string,
): string | undefined {
	const value = args.flags[name];
	return typeof value === "string" ? value : undefined;
}
