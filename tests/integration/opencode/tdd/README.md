# TDD for OpenCode Skills

## Iron Law

> "NO SKILL WITHOUT A FAILING TEST FIRST. Write skill before testing? Delete it. Start over."

Every skill change starts with a failing test. If the test never fails first, the test is not proving behavior.

## Red -> Green -> Refactor

1. Red
   - Write a focused failing test for the new behavior.
   - Run only that test and verify it fails for the expected reason.
2. Green
   - Implement the smallest skill/tool change that makes the test pass.
   - Re-run the same test to confirm success.
3. Refactor
   - Improve prompt wording, parameters, guardrails, and output structure.
   - Re-run tests to confirm behavior is unchanged.

## Pressure Scenarios

Each skill test suite should include pressure cases that stress real failure modes:

- Ambiguous prompts where tool use is optional
- Large context prompts with multiple asks
- Conflicting priorities where the skill must still execute
- Error conditions such as missing context or malformed tool arguments

Pressure scenarios prevent shallow pass cases and catch rationalization loops.

## Writing a New Skill Test

1. Copy `tests/integration/opencode/tdd/template.test.ts`.
2. Rename it to `<skill-name>.test.ts`.
3. Set `SKILL_NAME` and replace placeholder prompts.
4. Add baseline (without skill), success path, and pressure scenarios.
5. Run Red -> Green -> Refactor before shipping the skill.

## Running TDD Tests

Run one skill suite:

```bash
RUN_HEADLESS_TESTS=true bun test tests/integration/opencode/tdd/<skill-name>.test.ts
```

Run all TDD suites:

```bash
RUN_HEADLESS_TESTS=true bun test tests/integration/opencode/tdd
```

## Cost Considerations

Headless integration tests call real models and can be expensive.

- Keep prompts concise and deterministic.
- Scope runs to one file while iterating.
- Use short timeouts during Red/Green loops.
- Avoid rerunning the full suite unless behavior changes across skills.
