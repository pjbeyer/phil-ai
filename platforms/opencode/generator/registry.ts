import { writeFile } from "node:fs/promises";
import type { CoreSkill } from "@phil-ai/shared/schemas";

interface LoadedSkill {
	skillDir: string;
	sourcePath: string;
	skill: CoreSkill;
}

interface RegistryComponent {
	name: string;
	type: "skill";
	description: string;
	files: string[];
}

interface Registry {
	$schema: string;
	name: string;
	version: string;
	author: string;
	components: RegistryComponent[];
}

export async function generateRegistry(
	loadedSkills: LoadedSkill[],
	outputPath: string,
): Promise<void> {
	const components: RegistryComponent[] = loadedSkills.map((loadedSkill) => ({
		name: loadedSkill.skill.name,
		type: "skill" as const,
		description: loadedSkill.skill.description,
		files: [
			`platforms/opencode/output/skills/${loadedSkill.skillDir}/SKILL.md`,
			`platforms/opencode/output/skills/${loadedSkill.skillDir}/mcp.json`,
		],
	}));

	const registry: Registry = {
		$schema: "https://ocx.kdco.dev/schemas/v2/registry.json",
		name: "phil-ai",
		version: "1.0.0",
		author: "pjbeyer",
		components,
	};

	await writeFile(outputPath, `${JSON.stringify(registry, null, "\t")}\n`);
}
