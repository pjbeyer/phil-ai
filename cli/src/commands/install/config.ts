import { ConfigSchema, createDefaultConfig } from "@phil-ai/shared/schemas";
import { getConfigPaths, writeYaml } from "@phil-ai/shared/storage";
import { step, success } from "../../lib/output.js";

export async function setupConfig(
	dryRun = false,
	force = false,
): Promise<boolean> {
	const configPaths = getConfigPaths();
	const configExists = await Bun.file(configPaths.config).exists();

	if (configExists && !force) {
		step("Config already exists, skipping");
		return false;
	}

	if (dryRun) {
		step(`Would create: ${configPaths.config}`);
		return false;
	}

	const config = createDefaultConfig();
	await writeYaml(configPaths.config, config, ConfigSchema);

	success("Created default configuration");
	return true;
}
