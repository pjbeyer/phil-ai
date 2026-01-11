const COLORS = {
	reset: "\x1b[0m",
	bold: "\x1b[1m",
	dim: "\x1b[2m",
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	cyan: "\x1b[36m",
} as const;

export function bold(text: string): string {
	return `${COLORS.bold}${text}${COLORS.reset}`;
}

export function dim(text: string): string {
	return `${COLORS.dim}${text}${COLORS.reset}`;
}

export function red(text: string): string {
	return `${COLORS.red}${text}${COLORS.reset}`;
}

export function green(text: string): string {
	return `${COLORS.green}${text}${COLORS.reset}`;
}

export function yellow(text: string): string {
	return `${COLORS.yellow}${text}${COLORS.reset}`;
}

export function blue(text: string): string {
	return `${COLORS.blue}${text}${COLORS.reset}`;
}

export function cyan(text: string): string {
	return `${COLORS.cyan}${text}${COLORS.reset}`;
}

export function success(message: string): void {
	console.log(`${green("✓")} ${message}`);
}

export function error(message: string): void {
	console.error(`${red("✗")} ${message}`);
}

export function warn(message: string): void {
	console.warn(`${yellow("!")} ${message}`);
}

export function info(message: string): void {
	console.log(`${blue("i")} ${message}`);
}

export function step(message: string): void {
	console.log(`${cyan("→")} ${message}`);
}

export interface TableColumn {
	header: string;
	key: string;
	width?: number;
}

export function table(
	columns: TableColumn[],
	rows: Record<string, string>[],
): void {
	const widths = columns.map((col) => {
		const maxContent = Math.max(
			col.header.length,
			...rows.map((row) => (row[col.key] ?? "").length),
		);
		return col.width ?? maxContent;
	});

	const header = columns
		.map((col, i) => bold(col.header.padEnd(widths[i]!)))
		.join("  ");
	console.log(header);

	const separator = widths.map((w) => "-".repeat(w)).join("  ");
	console.log(dim(separator));

	for (const row of rows) {
		const line = columns
			.map((col, i) => (row[col.key] ?? "").padEnd(widths[i]!))
			.join("  ");
		console.log(line);
	}
}
