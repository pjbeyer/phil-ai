import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

export interface ValidationResult {
	valid: boolean;
	errors: string[];
}

interface ServerConfig {
	command?: unknown;
	args?: unknown;
}

interface McpConfig {
	mcpServers?: Record<string, ServerConfig>;
}

export interface ValidateOutputOptions {
	expectedSkillDirs?: string[];
	skillsRoot?: string;
	pluginEntryPath: string;
	requirePackageJson: boolean;
}

export async function validateGeneratedOutput(
	outputDir: string,
	options: ValidateOutputOptions,
): Promise<ValidationResult> {
	const errors: string[] = [];
	const skillsRoot = options.skillsRoot ?? join(outputDir, "skills");
	const skillDirs = await resolveSkillDirs(skillsRoot, options.expectedSkillDirs, errors);

	for (const skillDir of skillDirs) {
		await validateSkillDirectory(join(skillsRoot, skillDir), skillDir, errors);
	}

	await validatePluginEntryPoint(options.pluginEntryPath, errors);

	if (options.requirePackageJson) {
		await validatePackageJson(join(outputDir, "package.json"), errors);
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}

async function resolveSkillDirs(
	skillsRoot: string,
	expectedSkillDirs: string[] | undefined,
	errors: string[],
): Promise<string[]> {
	if (expectedSkillDirs && expectedSkillDirs.length > 0) {
		return expectedSkillDirs;
	}

	try {
		const entries = await readdir(skillsRoot, { withFileTypes: true });
		return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
	} catch {
		errors.push(`Missing skills directory: ${skillsRoot}`);
		return [];
	}
}

async function validateSkillDirectory(
	skillPath: string,
	skillName: string,
	errors: string[],
): Promise<void> {
	const skillMdPath = join(skillPath, "SKILL.md");
	const mcpJsonPath = join(skillPath, "mcp.json");

	const skillMd = await safeReadFile(skillMdPath);
	if (skillMd === null) {
		errors.push(`Missing SKILL.md for ${skillName}`);
	} else {
		validateFrontmatter(skillMd, skillName, errors);
	}

	const mcpJsonRaw = await safeReadFile(mcpJsonPath);
	if (mcpJsonRaw === null) {
		errors.push(`Missing mcp.json for ${skillName}`);
		return;
	}

	validateMcpJson(mcpJsonRaw, skillName, errors);
}

function validateFrontmatter(content: string, skillName: string, errors: string[]): void {
	const match = content.match(/^---\n([\s\S]*?)\n---/);
	if (!match) {
		errors.push(`Missing YAML frontmatter in ${skillName}/SKILL.md`);
		return;
	}

	const frontmatter = match[1];
	if (!frontmatter?.match(/^name:\s*.+$/m)) {
		errors.push(`Missing frontmatter name in ${skillName}/SKILL.md`);
	}
	if (!frontmatter?.match(/^description:\s*.+$/m)) {
		errors.push(`Missing frontmatter description in ${skillName}/SKILL.md`);
	}
}

function validateMcpJson(content: string, skillName: string, errors: string[]): void {
	let parsed: McpConfig;

	try {
		parsed = JSON.parse(content) as McpConfig;
	} catch {
		errors.push(`Invalid JSON in ${skillName}/mcp.json`);
		return;
	}

	if (!parsed.mcpServers || typeof parsed.mcpServers !== "object") {
		errors.push(`Missing mcpServers in ${skillName}/mcp.json`);
		return;
	}

	const serverEntries = Object.entries(parsed.mcpServers);
	if (serverEntries.length === 0) {
		errors.push(`No MCP servers configured in ${skillName}/mcp.json`);
		return;
	}

	for (const [serverName, serverConfig] of serverEntries) {
		if (typeof serverConfig.command !== "string" || serverConfig.command.length === 0) {
			errors.push(`Invalid command for MCP server ${serverName} in ${skillName}/mcp.json`);
		}

		if (
			!Array.isArray(serverConfig.args) ||
			serverConfig.args.some((arg) => typeof arg !== "string")
		) {
			errors.push(`Invalid args for MCP server ${serverName} in ${skillName}/mcp.json`);
		}
	}
}

async function validatePluginEntryPoint(
	pluginEntryPath: string,
	errors: string[],
): Promise<void> {
	const pluginEntry = await safeReadFile(pluginEntryPath);
	if (pluginEntry === null) {
		errors.push(`Missing plugin entry point: ${pluginEntryPath}`);
		return;
	}

	if (!pluginEntry.match(/export\s+default\s+[\w$]+/)) {
		errors.push(`Plugin entry point must export a default function: ${pluginEntryPath}`);
	}
}

async function validatePackageJson(
	packageJsonPath: string,
	errors: string[],
): Promise<void> {
	const packageJsonContent = await safeReadFile(packageJsonPath);
	if (packageJsonContent === null) {
		errors.push(`Missing package.json: ${packageJsonPath}`);
		return;
	}

	let packageJson: { dependencies?: Record<string, string> };
	try {
		packageJson = JSON.parse(packageJsonContent) as {
			dependencies?: Record<string, string>;
		};
	} catch {
		errors.push(`Invalid JSON in package.json: ${packageJsonPath}`);
		return;
	}

	if (!packageJson.dependencies?.["@opencode-ai/plugin"]) {
		errors.push("package.json must include @opencode-ai/plugin dependency");
	}
}

async function safeReadFile(filePath: string): Promise<string | null> {
	try {
		return await readFile(filePath, "utf-8");
	} catch {
		return null;
	}
}
