import { existsSync } from "node:fs";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { MetricsSnapshotSchema, type MetricsSnapshot } from "../schemas/metrics.js";
import { getDataPaths } from "../storage/directories.js";
import { withFileLock } from "../storage/lock.js";
import type { DateRange } from "../ingestion/types.js";

function snapshotPath(period: string): string {
	return join(getDataPaths().verificationMetrics, `${period}.json`);
}

function isInRange(snapshot: MetricsSnapshot, dateRange: DateRange): boolean {
	const snapshotMs = new Date(snapshot.period).getTime();
	if (!Number.isFinite(snapshotMs)) {
		return false;
	}

	if (dateRange.from !== undefined && snapshotMs < dateRange.from.getTime()) {
		return false;
	}

	if (dateRange.to !== undefined && snapshotMs > dateRange.to.getTime()) {
		return false;
	}

	return true;
}

export class MetricsStore {
	async saveSnapshot(snapshot: MetricsSnapshot): Promise<void> {
		const validated = MetricsSnapshotSchema.parse(snapshot);
		const filePath = snapshotPath(validated.period);

		await withFileLock(filePath, async () => {
			await writeFile(filePath, JSON.stringify(validated, null, 2), "utf-8");
		});
	}

	async getSnapshot(period: string): Promise<MetricsSnapshot | null> {
		const filePath = snapshotPath(period);
		if (!existsSync(filePath)) {
			return null;
		}

		return withFileLock(filePath, async () => {
			const content = await readFile(filePath, "utf-8");
			const parsed = JSON.parse(content) as unknown;
			return MetricsSnapshotSchema.parse(parsed);
		});
	}

	async queryMetrics(dateRange?: DateRange): Promise<MetricsSnapshot[]> {
		const metricsDir = getDataPaths().verificationMetrics;
		if (!existsSync(metricsDir)) {
			return [];
		}

		const entries = await readdir(metricsDir, { withFileTypes: true });
		const snapshots: MetricsSnapshot[] = [];

		for (const entry of entries) {
			if (!entry.isFile() || !entry.name.endsWith(".json")) {
				continue;
			}

			const filePath = join(metricsDir, entry.name);
			const snapshot = await withFileLock(filePath, async () => {
				const content = await readFile(filePath, "utf-8");
				const parsed = JSON.parse(content) as unknown;
				return MetricsSnapshotSchema.parse(parsed);
			});

			snapshots.push(snapshot);
		}

		const filtered =
			dateRange === undefined
				? snapshots
				: snapshots.filter((snapshot) => isInRange(snapshot, dateRange));

		return filtered.sort((a, b) => a.period.localeCompare(b.period));
	}
}
