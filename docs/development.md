# Development and maintenance

## Local checks

```bash
npm test
npm run docs:check
npm run validate:skill
npm run install:agents -- --scope project --dry-run
```

`npm test` uses Node's built-in test runner and requires no network. The skill
validator checks frontmatter, naming, and scaffold issues. Live extraction is
not part of the offline test suite.

## Test coverage

| Test file | Coverage |
| --- | --- |
| `agent-compat.test.mjs` | Agent grouping, portable links, copy mode, idempotency, and conflict refusal |
| `audio.test.mjs` | Provider fallback flags and Bilibili audio arguments |
| `instructions.test.mjs` | Timing/provenance, classification, empty evidence, and ASR clause splitting |
| `normalize.test.mjs` | JSON/text parsing, field collection, deduplication, gaps, and transcript metadata |
| `platforms.test.mjs` | URL detection, read-only plans, stable IDs, generic web syntax, and media steps |
| `documentation.test.mjs` | Local Markdown links and CLI option documentation |

Tests should assert observable behavior or safety invariants, not generated
wording.

## Add or change a platform

1. Inspect the installed adapter help and confirm a read-only route.
2. Add or update one entry in `PLATFORMS` in `platforms.mjs`.
3. Declare exact host suffixes and honest capabilities.
4. Build steps with stable labels, evidence kinds, command/argument arrays, and
   the minimum necessary required flag.
5. Add URL detection and plan tests.
6. Add identifier parsing tests if the CLI expects an ID rather than a URL.
7. Add normalization fixtures for any new response fields.
8. Update the platform reference and troubleshooting notes.
9. Run offline tests and inspect a dry-run plan before any authorized live test.

Never add write routes to the registry. Preserve platform-specific auth and
anti-abuse boundaries.

## Extend normalization

Normalization recognizes keys rather than platform types. When an adapter adds
a field:

- add only the exact common key or a constrained pattern;
- assign the correct evidence kind;
- preserve `source_step` and `source_path`;
- ensure transcript metadata is not mistaken for spoken content;
- retain raw output regardless of normalization;
- add a representative nested fixture.

If a change alters top-level shape or existing semantics, bump
`schema_version`. Additive recognized values do not necessarily require a bump,
but should be documented.

## Extend instruction extraction

Prefer demonstrated transcript failures over expanding cue patterns
speculatively. Add a test with the original punctuation/language shape and
assert evidence linkage. Keep classification extractive; do not synthesize
missing procedural steps.

Category precedence is warning, prerequisite, command, then step. Changing it
can move existing candidates between arrays and should be treated as a behavior
change.

## Change audio behavior

Maintain these consent invariants:

- no ASR without `--audio`;
- platform transcripts before ASR;
- one provider by default;
- cross-provider fallback only with its explicit flag;
- bounded media item count;
- raw provider output retained;
- no provider failure represented as transcript success.

Test command construction without contacting a provider. Use a small local
fixture for an explicitly authorized end-to-end test.

## Maintain agent compatibility

The skill folder is the source of truth. Update it once and let links propagate.
Do not edit `.agents`, `.codex`, or `.claude` through separate copies.

When adding a client:

1. Confirm its current official discovery path.
2. Prefer the shared `.agents/skills` group when supported.
3. Add a dedicated group only if the client does not scan the shared path.
4. Add unit coverage for grouping and target planning.
5. Update the compatibility matrix and installer help.

Avoid client-specific frontmatter in the canonical `SKILL.md` unless other
clients safely ignore it and the validator accepts it.

## Documentation maintenance

- Keep human explanations in `docs/` and concise agent decision guidance in
  `skills/social-media-extract/references/`.
- Do not duplicate platform or schema contracts across multiple canonical
  files; link to them.
- Update CLI tables whenever argument parsing changes.
- Run `npm run docs:check` after moving or renaming documentation.
- Examples must not contain working credentials, personal cookies, or private
  URLs.

## Release checklist

1. Update behavior and focused tests.
2. Update affected documentation and schema version if required.
3. Update the package and skill metadata versions together for a meaningful
   release.
4. Run `npm test` and `npm run validate:skill`.
5. Run project/user `check:agents` and confirm links resolve to the canonical
   folder.
6. Smoke-test `platforms` and one offline `plan` through an installed link.
7. Perform live tests only with explicit authorization and record platform
   limitations rather than hiding them.

## Non-goals for maintenance

- The preserved Facebook prototypes are not the foundation for new adapters.
- A new feature should not silently broaden account access or external data
  transmission.
- Success should not be defined only by a child process exit code.
- Platform gaps should not be filled with model inference.
