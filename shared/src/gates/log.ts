import { existsSync } from "node:fs";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { GateEntrySchema, type GateEntry } from "../schemas/gate.js";
import { getDataPaths } from "../storage/directories.js";
import { withFileLock } from "../storage/lock.js";
import type { DateRange } from "../ingestion/types.js";

const GateEntryArraySchema = z.array(GateEntrySchema);

function toIsoDateKey(date: Date): string {
	return date.toISOString().slice(0, 10);
}

function getLogFilePath(entryDate: string): string {
	const paths = getDataPaths();
	const dateKey = toIsoDateKey(new Date(entryDate));
	return join(paths.verificationGates, `${dateKey}.json`);
}

function parseDateFromFileName(fileName: string): Date | null {
	const match = /^(\d{4}-\d{2}-\d{2})\.json$/.exec(fileName);
	if (match === null) {
		return null;
	}

	const date = new Date(`${match[1]}T00:00:00.000Z`);
	return Number.isNaN(date.getTime()) ? null : date;
}

function isInDateRange(date: Date, dateRange?: DateRange): boolean {
	if (dateRange === undefined) {
		return true;
	}

	if (dateRange.from !== undefined && date.getTime() < dateRange.from.getTime()) {
		return false;
	}

	if (dateRange.to !== undefined && date.getTime() > dateRange.to.getTime()) {
		return false;
	}

	return true;
}

export class GateLog {
	async persist(entry: GateEntry): Promise<void> {
		const validatedEntry = GateEntrySchema.parse(entry);
		const filePath = getLogFilePath(validatedEntry.date);

		await withFileLock(filePath, async () => {
			let entries: GateEntry[] = [];

			if (existsSync(filePath)) {
				const content = await readFile(filePath, "utf-8");
				const parsed = JSON.parse(content) as unknown;
				entries = GateEntryArraySchema.parse(parsed);
			}

			entries.push(validatedEntry);
			await writeFile(filePath, JSON.stringify(entries, null, 2), "utf-8");
		});
	}

	async getEntries(dateRange?: DateRange): Promise<GateEntry[]> {
		const paths = getDataPaths();
		const logDir = paths.verificationGates;

		if (!existsSync(logDir)) {
			return [];
		}

		const files = await readdir(logDir, { withFileTypes: true });
		const candidateFiles = files
			.filter((file) => file.isFile())
			.map((file) => file.name)
			.filter((fileName) => {
				const parsedDate = parseDateFromFileName(fileName);
				return parsedDate !== null && isInDateRange(parsedDate, dateRange);
			})
			.sort();

		const allEntries: GateEntry[] = [];

		for (const fileName of candidateFiles) {
			const filePath = join(logDir, fileName);
			const fileEntries = await withFileLock(filePath, async () => {
				const content = await readFile(filePath, "utf-8");
				const parsed = JSON.parse(content) as unknown;
				return GateEntryArraySchema.parse(parsed);
			});

			allEntries.push(...fileEntries);
		}

		return allEntries;
	}

	async getPassRate(dateRange?: DateRange): Promise<number> {
		const entries = await this.getEntries(dateRange);
		if (entries.length === 0) {
			return 1;
		}

		const passCount = entries.filter((entry) => entry.result === "pass").length;
		return passCount / entries.length;
	}
}
