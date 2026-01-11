import { cp, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { dirExists, getDataPaths } from "@phil-ai/shared/storage";

export async function backup(): Promise<string | null> {
	const dataPaths = getDataPaths();

	if (!(await dirExists(dataPaths.root))) {
		return null;
	}

	const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
	const backupDir = join(dataPaths.root, "backups", timestamp);

	await mkdir(backupDir, { recursive: true });

	try {
		await cp(dataPaths.root, backupDir, {
			recursive: true,
			filter: (src) => !src.includes("backups"),
		});
		return backupDir;
	} catch (err) {
		console.error(`Backup failed: ${err instanceof Error ? err.message : err}`);
		return null;
	}
}
