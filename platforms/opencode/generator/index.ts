import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CoreSkillSchema } from "@phil-ai/shared/schemas";
import { writeDevPlugin } from "./output-dev.js";
import { writePlugin } from "./output.js";
import { type SkillArtifact, transformSkillToArtifact } from "./transform.js";
import { validateGeneratedOutput } from "./validate.js";
import { generateRegistry } from "./registry.js";

const ROOT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SKILLS_DIR = join(ROOT_DIR, "core", "skills");
const PROD_OUTPUT_DIR = join(ROOT_DIR, "platforms", "opencode", "output");
const DEV_PLUGINS_DIR = join(ROOT_DIR, ".opencode", "plugins");
const DEV_SKILLS_DIR = join(ROOT_DIR, ".opencode", "skills");

interface LoadedSkill {
	skillDir: string;
	sourcePath: string;
	skill: ReturnType<typeof CoreSkillSchema.parse>;
}

export async function generateAll(): Promise<SkillArtifact[]> {
	const loadedSkills = await loadCoreSkills();
	const skillArtifacts: SkillArtifact[] = [];

	for (const loadedSkill of loadedSkills) {
		const artifact = await transformSkillToArtifact(
			loadedSkill.skill,
			loadedSkill.sourcePath,
		);
		skillArtifacts.push(artifact);
		console.log(`Processed: ${loadedSkill.skill.name}`);
	}

	const outputDir = await writePlugin(skillArtifacts, "0.1.0", PROD_OUTPUT_DIR);
	await generateRegistry(loadedSkills, join(ROOT_DIR, "registry.jsonc"));
	const validation = await validateGeneratedOutput(outputDir, {
		expectedSkillDirs: skillArtifacts.map((artifact) => artifact.skillDir),
		pluginEntryPath: join(outputDir, "src", "index.ts"),
		requirePackageJson: true,
	});

	if (!validation.valid) {
		throw new Error(`Validation failed: ${validation.errors.join("; ")}`);
	}

	console.log(`OpenCode plugin generated at ${outputDir}`);
	return skillArtifacts;
}

export async function generateDev(): Promise<SkillArtifact[]> {
	const loadedSkills = await loadCoreSkills();
	const mcpServerPath = join(ROOT_DIR, "mcp", "dist", "server.js");
	const skillArtifacts: SkillArtifact[] = [];

	for (const loadedSkill of loadedSkills) {
		const devSkillDir = `${loadedSkill.skillDir}-dev`;
		const artifact = await transformSkillToArtifact(
			loadedSkill.skill,
			loadedSkill.sourcePath,
			{
				skillNameSuffix: "-dev",
				skillDirName: devSkillDir,
				mcpCommand: "bun",
				mcpArgs: ["run", mcpServerPath],
			},
		);
		skillArtifacts.push(artifact);
		console.log(`Processed (dev): ${loadedSkill.skill.name}`);
	}

	const result = await writeDevPlugin(skillArtifacts, DEV_PLUGINS_DIR, DEV_SKILLS_DIR);
	const validation = await validateGeneratedOutput(ROOT_DIR, {
		expectedSkillDirs: skillArtifacts.map((artifact) => artifact.skillDir),
		skillsRoot: result.skillsDir,
		pluginEntryPath: result.pluginPath,
		requirePackageJson: false,
	});

	if (!validation.valid) {
		throw new Error(`Validation failed: ${validation.errors.join("; ")}`);
	}

	console.log(`Dev plugin generated at ${result.pluginPath}`);
	return skillArtifacts;
}

async function loadCoreSkills(): Promise<LoadedSkill[]> {
	const dirEntries = await readdir(SKILLS_DIR, { withFileTypes: true });
	const loadedSkills: LoadedSkill[] = [];

	for (const entry of dirEntries) {
		if (!entry.isDirectory()) {
			continue;
		}

		const skillDir = entry.name;
		const skillPath = join(SKILLS_DIR, skillDir, "skill.json");
		const sourcePath = join(SKILLS_DIR, skillDir);

		try {
			const content = await readFile(skillPath, "utf-8");
			const skillData = JSON.parse(content);
			const skill = CoreSkillSchema.parse(skillData);
			loadedSkills.push({
				skillDir,
				sourcePath,
				skill,
			});
		} catch (err) {
			console.error(`Failed to process ${skillDir}:`, err);
		}
	}

	return loadedSkills;
}

if (import.meta.main) {
	const run = process.argv.includes("--dev") ? generateDev : generateAll;

	run()
		.then((artifacts) => {
			console.log(`\nGenerated OpenCode plugin with ${artifacts.length} skills`);
		})
		.catch((err) => {
			console.error("Generation failed:", err);
			process.exit(1);
		});
}
