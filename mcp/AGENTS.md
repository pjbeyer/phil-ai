# MCP Package (@phil-ai/mcp)

Model Context Protocol server exposing phil-ai tools via stdio transport.

## Structure

```
mcp/src/
├── tools/
│   ├── learning.ts   # capture_learning, list_learnings
│   ├── docs.ts       # generate_docs, optimize_docs
│   ├── context.ts    # optimize_context, load_context
│   └── workflow.ts   # work_start, work_finish
├── server.ts         # MCP server entry point
└── index.ts          # Library exports
```

## Running the Server

```bash
# Via binary (defined in package.json)
bunx phil-ai-mcp

# Direct execution
bun mcp/src/server.ts
```

The server uses stdio transport and logs to stderr.

## Available Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `capture_learning` | Capture a new learning | `title`, `problem`, `solution` |
| `list_learnings` | List captured learnings | - |
| `generate_docs` | Generate documentation | `type` |
| `optimize_docs` | Optimize for tokens | - |
| `work_start` | Start a work item | `title` |
| `work_finish` | Finish current work | - |

## Adding New Tools

1. Create or update file in `tools/`
2. Export tool definition with `name`, `description`, `inputSchema`, `handler`
3. Add to `allTools` array in `server.ts`

### Tool Structure

```typescript
export const myTool = {
  name: 'my_tool',
  description: 'What the tool does',
  inputSchema: {
    type: 'object' as const,
    properties: {
      param1: { type: 'string', description: 'Parameter description' },
    },
    required: ['param1'],
  },
  handler: async (params: Record<string, unknown>) => {
    // Tool implementation
    return {
      content: [{ type: 'text' as const, text: 'Result' }],
    };
  },
};
```

## Dependencies

- `@modelcontextprotocol/sdk` - MCP protocol implementation
- Tools are currently stubs; will integrate with `@phil-ai/shared` storage

## Integration Points

```typescript
// Import tools for programmatic use
import { learningTools, docsTools, contextTools, workflowTools } from '@phil-ai/mcp';

// All tools combined
const allTools = [...learningTools, ...docsTools, ...contextTools, ...workflowTools];
```
