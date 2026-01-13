/**
 * Template constants for scaffold command
 * Source: .specify/memory/constitution.md lines 206-366
 */

export const PLUGIN_INDEX_TEMPLATE = `/**
 * {{pluginName}} - OpenCode Plugin Entry
 * 
 * Loads commands from commands/*.md and registers them with OpenCode.
 * This enables the same commands to work on both Claude Code and OpenCode.
 */

import type { Plugin } from '@opencode-ai/plugin';
import path from 'path';

interface CommandFrontmatter {
  description?: string;
  agent?: string;
  model?: string;
  subtask?: boolean;
}

interface ParsedCommand {
  name: string;
  frontmatter: CommandFrontmatter;
  template: string;
}

function parseFrontmatter(content: string): { frontmatter: CommandFrontmatter; body: string } {
  const frontmatterRegex = /^---\\n([\\s\\S]*?)\\n---\\n([\\s\\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, body: content.trim() };
  }

  const [, yamlContent, body] = match;
  const frontmatter: CommandFrontmatter = {};

  for (const line of yamlContent.split('\\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();

    if (key === 'description') frontmatter.description = value;
    if (key === 'agent') frontmatter.agent = value;
    if (key === 'model') frontmatter.model = value;
    if (key === 'subtask') frontmatter.subtask = value === 'true';
  }

  return { frontmatter, body: body.trim() };
}

async function loadCommands(): Promise<ParsedCommand[]> {
  const commands: ParsedCommand[] = [];
  // Commands are in the parent directory relative to dist/
  const commandDir = path.join(import.meta.dir, '..', 'commands');
  const glob = new Bun.Glob('**/*.md');

  for await (const file of glob.scan({ cwd: commandDir, absolute: true })) {
    const content = await Bun.file(file).text();
    const { frontmatter, body } = parseFrontmatter(content);

    const relativePath = path.relative(commandDir, file);
    const name = relativePath.replace(/\\.md$/, '').replace(/\\//g, '-');

    commands.push({
      name,
      frontmatter,
      template: body,
    });
  }

  return commands;
}

export const {{PluginExportName}}: Plugin = async () => {
  const commands = await loadCommands();

  return {
    async config(config) {
      config.command = config.command ?? {};

      for (const cmd of commands) {
        config.command[cmd.name] = {
          template: cmd.template,
          description: cmd.frontmatter.description,
          agent: cmd.frontmatter.agent,
          model: cmd.frontmatter.model,
          subtask: cmd.frontmatter.subtask,
        };
      }
    },
  };
};
`;

export const PACKAGE_JSON_TEMPLATE = `{
  "name": "{{packageName}}",
  "version": "{{version}}",
  "description": "{{description}}",
  "author": {
    "name": "{{authorName}}",
    "email": "{{authorEmail}}"
  },
  "license": "MIT",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "repository": {
    "type": "git",
    "url": "{{repositoryUrl}}"
  },
  "publishConfig": {
    "access": "public"
  },
  "files": [
    "dist",
    "commands"
  ],
  "scripts": {
    "build": "bun build ./src/index.ts --outdir dist --target bun --format esm",
    "prepublishOnly": "bun run build"
  },
  "dependencies": {
    "@opencode-ai/plugin": "^1.0.85"
  },
  "devDependencies": {
    "bun-types": "latest",
    "typescript": "^5.0.0"
  }
}
`;

export const TSCONFIG_TEMPLATE = `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src",
    "types": ["bun-types"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
`;

export const MARKETPLACE_TEMPLATE = `{
  "name": "{{marketplaceName}}",
  "description": "{{description}}",
  "owner": {
    "name": "{{authorName}}",
    "email": "{{authorEmail}}",
    "url": "{{repositoryUrl}}"
  },
  "plugins": [
    {
      "name": "{{pluginName}}",
      "version": "{{version}}",
      "description": "{{description}}",
      "source": {
        "source": "url",
        "url": "{{repositoryUrl}}"
      },
      "author": {
        "name": "{{authorName}}",
        "email": "{{authorEmail}}"
      },
      "license": "MIT"
    }
  ]
}
`;

export const GITIGNORE_ENTRIES = ["dist/", "node_modules/"];
