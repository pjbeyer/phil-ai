/**
 * Utility functions for scaffold command
 */

/**
 * Convert a kebab-case string to PascalCase
 * @example toPascalCase("my-plugin") // "MyPlugin"
 * @example toPascalCase("phil-ai-learning") // "PhilAiLearning"
 */
export function toPascalCase(name: string): string {
	return name
		.split("-")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join("");
}
