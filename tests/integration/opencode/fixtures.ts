import { cp, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PROJECT_ROOT = join(import.meta.dir, "..", "..", "..");

export interface TestFixture {
  dir: string;
  cleanup: () => Promise<void>;
}

export async function createFixture(): Promise<TestFixture> {
  const dir = await mkdtemp(join(tmpdir(), "phil-ai-test-"));

  const pluginSrc = join(PROJECT_ROOT, ".opencode", "plugins");
  const skillsSrc = join(PROJECT_ROOT, ".opencode", "skills");
  const pluginDst = join(dir, ".opencode", "plugins");
  const skillsDst = join(dir, ".opencode", "skills");

  await mkdir(pluginDst, { recursive: true });
  await mkdir(skillsDst, { recursive: true });

  try {
    await cp(pluginSrc, pluginDst, { recursive: true });
    await cp(skillsSrc, skillsDst, { recursive: true });
  } catch {
    return {
      dir,
      cleanup: async () => {
        await rm(dir, { recursive: true, force: true }).catch(() => undefined);
      },
    };
  }

  return {
    dir,
    cleanup: async () => {
      await rm(dir, { recursive: true, force: true }).catch(() => undefined);
    },
  };
}

export async function createFixtureWithFile(
  filename: string,
  content: string,
): Promise<TestFixture> {
  const fixture = await createFixture();
  await writeFile(join(fixture.dir, filename), content);
  return fixture;
}
