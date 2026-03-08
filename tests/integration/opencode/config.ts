export const HEADLESS_CONFIG = {
  model: "anthropic/claude-sonnet-4-6",
  timeout: 60_000,
  workdir: undefined as string | undefined,
  debug: process.env.HEADLESS_DEBUG === "true",
  trackCost: true,
} as const;
