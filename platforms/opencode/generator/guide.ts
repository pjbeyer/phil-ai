import { loadMergedGuide, formatGuideForAgent } from "@phil-ai/shared";

export async function getGuideContent(projectPath: string): Promise<string | null> {
	const guide = await loadMergedGuide({ projectPath });
	if (!guide) return null;
	return formatGuideForAgent(guide);
}
