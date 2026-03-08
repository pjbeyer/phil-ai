import { spawn } from "node:child_process";
import { cp, mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { HEADLESS_CONFIG } from "./config";

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

export interface HeadlessMessage {
  role: "user" | "assistant" | "tool";
  content: string;
  toolCalls?: ToolCall[];
}

export interface HeadlessResult {
  sessionId: string;
  messages: HeadlessMessage[];
  toolCalls: ToolCall[];
  exitCode: number;
  rawOutput: string;
  duration: number;
  error?: string;
}

export interface RunOptions {
  dir?: string;
  model?: string;
  timeout?: number;
  extraArgs?: string[];
}

interface JsonEvent {
  type?: string;
  role?: string;
  content?: string;
  text?: string;
  sessionId?: string;
  sessionID?: string;
  part?: {
    type?: string;
    text?: string;
    tool?: string;
    sessionID?: string;
    state?: {
      input?: Record<string, unknown>;
      status?: string;
    };
  };
}

const PROJECT_ROOT = join(import.meta.dir, "..", "..", "..");

export async function runHeadless(
  prompt: string,
  options: RunOptions = {},
): Promise<HeadlessResult> {
  const model = options.model ?? HEADLESS_CONFIG.model;
  const timeout = options.timeout ?? HEADLESS_CONFIG.timeout;

  let workdir = options.dir ?? HEADLESS_CONFIG.workdir;
  let tempDir: string | undefined;

  if (!workdir) {
    tempDir = await mkdtemp(join(tmpdir(), "phil-ai-test-"));
    workdir = tempDir;

    const pluginSrc = join(PROJECT_ROOT, ".opencode", "plugins");
    const skillsSrc = join(PROJECT_ROOT, ".opencode", "skills");
    const pluginDst = join(workdir, ".opencode", "plugins");
    const skillsDst = join(workdir, ".opencode", "skills");

    await mkdir(pluginDst, { recursive: true });
    await mkdir(skillsDst, { recursive: true });
    await cp(pluginSrc, pluginDst, { recursive: true });
    await cp(skillsSrc, skillsDst, { recursive: true });
  }

  const args = [
    "run",
    prompt,
    "--format",
    "json",
    "-m",
    model,
    ...(options.extraArgs ?? []),
  ];

  const startTime = Date.now();

  return new Promise<HeadlessResult>((resolve) => {
    let rawOutput = "";
    let errorOutput = "";

    const proc = spawn("opencode", args, {
      cwd: workdir,
      env: { ...process.env },
      timeout,
    });

    proc.stdout.on("data", (data: Buffer) => {
      rawOutput += data.toString();
    });

    proc.stderr.on("data", (data: Buffer) => {
      errorOutput += data.toString();
    });

    proc.on("close", async (code) => {
      const duration = Date.now() - startTime;

      if (tempDir) {
        await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
      }

      const parsed = parseOutput(rawOutput);

      if (HEADLESS_CONFIG.debug) {
        console.error("=== Headless Debug Output ===");
        console.error("Exit code:", code);
        console.error("Duration:", duration, "ms");
        console.error("Raw output length:", rawOutput.length);
        console.error("Tool calls:", parsed.toolCalls.length);
        if (errorOutput) {
          console.error("Stderr:", errorOutput);
        }
      }

      const base: HeadlessResult = {
        ...parsed,
        exitCode: code ?? 1,
        rawOutput,
        duration,
      };

      if (code === 0) {
        resolve(base);
        return;
      }

      resolve({
        ...base,
        error: errorOutput || "Headless run failed",
      });
    });

    proc.on("error", async (err) => {
      if (tempDir) {
        await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
      }
      resolve({
        sessionId: "",
        messages: [],
        toolCalls: [],
        exitCode: 1,
        rawOutput,
        duration: Date.now() - startTime,
        error: err.message,
      });
    });
  });
}

function parseOutput(raw: string): {
  messages: HeadlessMessage[];
  toolCalls: ToolCall[];
  sessionId: string;
} {
  const messages: HeadlessMessage[] = [];
  const toolCalls: ToolCall[] = [];
  let sessionId = "";

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("{")) {
      continue;
    }

    let event: JsonEvent;
    try {
      event = JSON.parse(trimmed) as JsonEvent;
    } catch {
      continue;
    }

    sessionId = event.sessionID ?? event.sessionId ?? event.part?.sessionID ?? sessionId;

    if (event.type === "text") {
      const text = event.part?.text ?? event.text ?? event.content ?? "";
      if (text) {
        messages.push({
          role: (event.role as HeadlessMessage["role"]) ?? "assistant",
          content: text,
        });
      }
      continue;
    }

    if (event.type === "tool_use") {
      const toolName = event.part?.tool ?? "";
      const args = event.part?.state?.input ?? {};
      const toolCall: ToolCall = { name: toolName, args };
      toolCalls.push(toolCall);
      messages.push({ role: "tool", content: JSON.stringify(toolCall), toolCalls: [toolCall] });
    }
  }

  return { messages, toolCalls, sessionId };
}
