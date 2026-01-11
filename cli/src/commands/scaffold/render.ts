/**
 * Template rendering with variable substitution
 */

/**
 * Render a template string by replacing {{placeholder}} with values
 * @param template Template string with {{placeholders}}
 * @param data Key-value pairs for substitution
 * @returns Rendered string
 */
export function render(template: string, data: Record<string, string>): string {
	let result = template;
	for (const [key, value] of Object.entries(data)) {
		result = result.replaceAll(`{{${key}}}`, value);
	}
	return result;
}
