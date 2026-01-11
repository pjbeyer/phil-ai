import {
	dirExists,
	ensureAllDirs,
	getConfigPaths,
	getDataPaths,
} from "@phil-ai/shared/storage";
import { step, success } from "../../lib/output.js";

export interface DirectorySetupResult {
	dataDir: string;
	configDir: string;
	created: boolean;
}

export async function setupDirectories(
	dryRun = false,
): Promise<DirectorySetupResult> {
	const dataPaths = getDataPaths();
	const configPaths = getConfigPaths();

	const dataExists = await dirExists(dataPaths.root);
	const configExists = await dirExists(configPaths.root);

	if (dryRun) {
		if (!dataExists) {
			step(`Would create: ${dataPaths.root}`);
		}
		if (!configExists) {
			step(`Would create: ${configPaths.root}`);
		}
		return {
			dataDir: dataPaths.root,
			configDir: configPaths.root,
			created: false,
		};
	}

	await ensureAllDirs();

	if (!dataExists || !configExists) {
		success("Created phil-ai directories");
	}

	return {
		dataDir: dataPaths.root,
		configDir: configPaths.root,
		created: !dataExists || !configExists,
	};
}
