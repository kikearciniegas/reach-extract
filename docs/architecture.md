# Architecture

## Repository layout

```text
.
├── README.md
├── package.json
├── docs/                         Human/operator documentation
├── scripts/
│   ├── install-agent-skill.mjs   Cross-agent installer CLI
│   └── lib/agent-compat.mjs      Discovery-path planning and safe linking
├── skills/social-media-extract/
│   ├── SKILL.md                  Portable agent entry point
│   ├── agents/openai.yaml        Codex UI metadata and invocation policy
│   ├── references/               Agent-loaded conditional documentation
│   └── scripts/
│       ├── reach-extract.mjs     Extraction CLI and orchestration
│       └── lib/
│           ├── platforms.mjs     URL detection and read-only command plans
│           ├── runner.mjs        Process execution and raw capture
│           ├── normalize.mjs     Permissive evidence normalization
│           ├── audio.mjs         Conditional media discovery and ASR
│           └── instructions.mjs  Transcript-grounded instruction indexing
├── test/                         Offline Node test suite
└── *_facebook_*.mjs/.py          Preserved legacy prototypes
```

The skill folder is canonical. `.agents`, `.codex`, and `.claude` discovery
entries point to it; they are not separate implementations.

## Extraction flow

```text
URL + options
    │
    ▼
detect platform ──► build read-only plan ──► plan/dry-run output
    │
    ▼ extract
execute steps sequentially
    ├── raw/<step>.stdout
    └── raw/<step>.stderr
    │
    ▼
parse JSON or preserve plain text
    │
    ▼
normalize evidence ──► record.json + evidence.jsonl
    │
    ├── transcript present ─────────────────────┐
    │                                           │
    └── no transcript + --audio                 │
          └── download/find media ─► ASR ───────┤
                                                ▼
                                      --instructions?
                                                │
                                                ▼
                                      instructions.json
```

After all stages, the CLI writes `manifest.json`, prints a compact summary, and
sets the exit code based on required-step success.

## Module responsibilities

### `reach-extract.mjs`

- Parses CLI arguments.
- Runs diagnostics or prints the platform registry.
- Calls `buildPlan` for `plan`, `extract`, and dry-run.
- Creates the timestamped output directory only for live extraction.
- Orchestrates execution, normalization, conditional ASR, instruction indexing,
  manifest writing, summary printing, and exit status.

### `platforms.mjs`

- Matches exact hosts or subdomains; it does not use substring matching.
- Extracts stable IDs for Reddit, V2EX, Bilibili, and Xiaoyuzhou when useful.
- Constructs argument arrays rather than shell strings.
- Adds `-f json` to OpenCLI steps.
- Adds a generic `opencli web read` fallback unless disabled or already primary.
- Marks the minimum platform-specific step as required.

### `runner.mjs`

- Uses `spawn` with `shell: false`, preventing shell interpretation of URLs and
  arguments.
- Inherits the current environment and optionally accepts a working directory.
- Buffers stdout/stderr, records start time and duration, and sends `SIGTERM`
  after timeout.
- Serializes plan steps; there is no hidden concurrency against a platform.
- Writes raw streams before parsing stdout as JSON or text.

### `normalize.mjs`

- Recursively walks heterogeneous adapter responses.
- Recognizes common text, author, metric, and media URL keys.
- Classifies text according to both field name and step evidence kind.
- Deduplicates identical values within an evidence kind while keeping the first
  provenance pointer.
- Builds requested-evidence gaps independently from process exit codes.

The normalizer is intentionally permissive because adapters do not share a
single response schema. Raw output remains authoritative.

### `audio.mjs`

- Creates `media`, `transcript`, and `raw` directories as needed.
- Uses `bili audio` for Bilibili preparation.
- Uses the URL directly for YouTube.
- Recursively discovers known audio/video extensions for other platforms.
- Caps the number of sources, calls Agent Reach ASR, and records each operation
  as another normalizable output.

### `instructions.mjs`

- Reads only successful outputs explicitly labeled `transcript`.
- Preserves timestamps and source paths when present.
- Splits transcript text into candidate sentences, including common ASR clause
  joins.
- Uses conservative multilingual cues and imperative/command patterns.
- Emits evidence-linked candidates, not rewritten instructions and not actions.

### Agent installer

`agent-compat.mjs` maps eight named clients into three discovery groups:
universal `.agents`, Codex, and Claude. It resolves existing paths, preflights
all conflicts, uses relative project links and absolute user links, and never
overwrites. `install-agent-skill.mjs` supplies the CLI and output formats.

## Core invariants

1. Every platform step is explicitly declared in the registry.
2. Commands are argument arrays and never pass through a shell.
3. Raw stdout/stderr are retained even when parsing or normalization fails.
4. Process success and evidence presence are separate facts.
5. ASR requires `--audio` and only fills missing transcript evidence.
6. Cross-provider audio transmission requires a second explicit flag.
7. Extracted instructions are evidence indexes, not execution authorization.
8. Login and anti-abuse controls are not automated or bypassed.
9. Existing skill discovery paths are never overwritten.

## Current limitations

- Adapter responses can change independently of this project.
- The entire extraction is single-URL and sequential.
- There is no retry scheduler, resume command, bundle merger, or automatic
  retention policy.
- Metrics with the same normalized key use the latest walked value and do not
  carry per-value provenance.
- Instruction classification is pattern-based rather than semantic and may
  miss implicit directions or flag quoted commands.
- Facebook, LinkedIn, Xueqiu, and some Instagram fields rely on generic or
  incomplete page evidence; gaps must remain visible.
