import { GateLog } from "../gates/log.js";
import { MetricsStore } from "../metrics/store.js";

export async function pruneStale(
	thresholdDays: number,
): Promise<{ staleItems: string[]; count: number }> {
	const safeThresholdDays =
		Number.isFinite(thresholdDays) && thresholdDays > 0 ? thresholdDays : 1;
	const cutoffMs = Date.now() - safeThresholdDays * 86_400_000;

	const [gateEntries, snapshots] = await Promise.all([
		new GateLog().getEntries(),
		new MetricsStore().queryMetrics(),
	]);

	const staleGateItems = gateEntries
		.filter((entry) => {
			const entryMs = new Date(entry.date).getTime();
			return Number.isFinite(entryMs) && entryMs < cutoffMs;
		})
		.map((entry) => `gate:${entry.sourceItemId}:${entry.date}`);

	const staleSnapshots = snapshots
		.filter((snapshot) => {
			const snapshotMs = new Date(snapshot.period).getTime();
			return Number.isFinite(snapshotMs) && snapshotMs < cutoffMs;
		})
		.map((snapshot) => `metrics:${snapshot.period}`);

	const staleItems = [...new Set([...staleGateItems, ...staleSnapshots])];

	return {
		staleItems,
		count: staleItems.length,
	};
}
