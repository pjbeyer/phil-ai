import type {
	EventContextType,
	EventRoleType,
} from "../schemas/events.js";
import {
	SystemRegistryEntrySchema,
	type SystemRegistryEntry,
} from "../schemas/registry.js";
import { getConfigPaths } from "../storage/directories.js";
import { readYamlUnsafe } from "../storage/yaml.js";

export interface ValidateRegistryResult {
	valid: SystemRegistryEntry[];
	errors: string[];
}

export async function loadRegistry(
	configPath: string = getConfigPaths().systems,
): Promise<SystemRegistryEntry[]> {
	const rawRegistry = await readYamlUnsafe<unknown>(configPath);

	if (rawRegistry === null) {
		return [];
	}

	if (!Array.isArray(rawRegistry)) {
		throw new Error("Invalid systems registry: expected top-level array");
	}

	const { valid, errors } = validateRegistry(rawRegistry);
	if (errors.length > 0) {
		throw new Error(`Invalid systems registry:\n${errors.join("\n")}`);
	}

	return valid;
}

export function getSystemsByContext(
	entries: SystemRegistryEntry[],
	context: EventContextType,
): SystemRegistryEntry[] {
	return entries.filter((entry) => entry.context === context);
}

export function getSystemsByRole(
	entries: SystemRegistryEntry[],
	role: EventRoleType,
): SystemRegistryEntry[] {
	return entries.filter((entry) => entry.role === role);
}

export function validateRegistry(entries: unknown[]): ValidateRegistryResult {
	const valid: SystemRegistryEntry[] = [];
	const errors: string[] = [];

	for (const [index, entry] of entries.entries()) {
		const parsed = SystemRegistryEntrySchema.safeParse(entry);
		if (parsed.success) {
			valid.push(parsed.data);
			continue;
		}

		const issueMessage = parsed.error.issues
			.map((issue) => {
				const issuePath = issue.path.length > 0 ? issue.path.join(".") : "(root)";
				return `${issuePath}: ${issue.message}`;
			})
			.join("; ");

		errors.push(`Entry ${index}: ${issueMessage}`);
	}

	return { valid, errors };
}
