---
name: system-guide
version: "1.0.0"
verbosity: brief
---

# phil-ai Project System Guide

## Communication Style

<!-- preference: comm.concise | soft -->
Be direct and concise. Avoid unnecessary preamble and verbose explanations.

<!-- preference: comm.no-emoji | hard -->
Never use emojis in code, documentation, or commit messages unless explicitly requested.

## Code Style

<!-- preference: code-style.explicit-types | hard -->
Always use explicit type annotations for function parameters and return types. No implicit any.

<!-- preference: code-style.no-any | hard -->
Never use the `any` type. Use `unknown` with type guards instead.

<!-- preference: code-style.zod-schemas | soft -->
Define data contracts using Zod schemas. Infer TypeScript types from schemas.

## Documentation

<!-- preference: docs.update-first | soft -->
Update relevant documentation (AGENTS.md, README.md) before implementing changes.

<!-- preference: docs.no-comments | hard -->
Avoid inline code comments. Code should be self-documenting through clear naming.

## Git Workflow

<!-- preference: git.atomic-commits | soft -->
Create atomic commits that represent a single logical change.

<!-- preference: git.conventional-commits | soft -->
Use conventional commit format: feat(scope): description
