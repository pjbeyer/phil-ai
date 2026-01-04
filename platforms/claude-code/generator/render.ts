export function render(template: string, data: Record<string, string>): string {
	let result = template;
	for (const [key, value] of Object.entries(data)) {
		result = result.replaceAll(`{{${key}}}`, value);
	}
	return result;
}
