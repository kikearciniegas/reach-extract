# Output and evidence

## Bundle naming

Live extraction resolves `--out` to an absolute path and creates:

```text
<out>/<ISO timestamp with colons and dots replaced>-<platform>/
```

Example:

```text
output/2026-09-22T12-30-45-123Z-youtube/
```

Runs are append-only by naming convention. The stack does not reuse, merge, or
delete earlier bundles.

## Bundle layout

```text
<bundle>/
├── manifest.json
├── record.json
├── evidence.jsonl
├── instructions.json       Only with --instructions
├── raw/
│   ├── 01-video.stdout
│   ├── 01-video.stderr
│   └── ...
├── media/                  Created when download/audio preparation needs it
└── transcript/             Created for ASR output
```

Raw file names use a one-based, zero-padded execution index plus a sanitized
step label. Audio fallback continues indexing after ordinary plan steps.

## `manifest.json`

The manifest is the execution ledger:

- `schema_version`: currently `0.1.0`;
- `run_id`: timestamp-derived identifier;
- `request.url` and `request.platform`;
- `request.options`: resolved CLI option object, including defaults;
- `steps[]`: label, evidence kind, required flag, command array, success,
  non-empty status, exit code, timeout status, start time, duration, and stderr
  summary.

The command array records what was attempted. It does not include shell
expansion because the runner does not use a shell.

## `record.json`

The record is a searchable index over successful outputs. Its top-level fields
are:

- `schema_version`
- `run_id`
- `source`
- `content`
- `evidence`
- `gaps`
- `provenance`

`content` groups normalized values into `title`, `text`, `comments`,
`transcript`, `authors`, `media`, and `metrics`. These are convenience views;
use `evidence` when source location matters.

## `evidence.jsonl`

Each line is one object from `record.json.evidence`:

```json
{
  "kind": "transcript",
  "value": "First, install the package.",
  "source_step": "transcript",
  "source_path": "$[0].content"
}
```

Supported normalized kinds are `title`, `text`, `comment`, `transcript`,
`author`, and `media`. Metrics live in `content.metrics` rather than evidence
entries.

Evidence is deduplicated by normalized kind and JSON value. If two raw paths
contain the same value, the first observed path is retained in the normalized
index; both remain available in raw output.

## `instructions.json`

Written only with `--instructions`. It contains:

- `basis`: `transcript` or `none`;
- `steps`, `prerequisites`, `warnings`, and `commands` arrays;
- original candidate text;
- category and heuristic confidence;
- start/end timestamps when provided upstream;
- an `evidence` object with quote, source step, and source path;
- `stats.transcript_segments` and `stats.candidates`.

Step entries also receive a one-based `order`. Categories are mutually
exclusive; warning checks take precedence, then prerequisites, commands, and
ordinary steps.

## Gaps

`record.json.gaps` lists requested evidence kinds not found:

- `post` is always requested;
- `comments` follows `--comments`;
- `media` follows `--media`;
- `transcript` follows `--transcript`, `--audio`, or `--instructions`.

A gap means “not captured by this run.” It must not be converted into a claim
about the source. For example, a transcript gap does not mean the video is
silent, and a comments gap does not mean there are no comments.

## Success interpretation

Three signals answer different questions:

| Signal | Question answered |
| --- | --- |
| Step `ok` | Did the child process exit successfully before timeout? |
| Step `non_empty` | Did stdout parse into non-empty JSON/text? |
| `record.gaps` | Was each requested evidence kind normalized? |

A usable result normally requires a detected platform, a non-empty primary
read, written raw and normalized artifacts, and explicit gaps. See the
[operational acceptance criteria](../skills/social-media-extract/references/operations.md).

## Schema stability

The canonical machine-readable shape is documented in the
[schema reference](../skills/social-media-extract/references/schema.md).
Consumers should check `schema_version`, ignore unknown additive fields, and
avoid assuming platform-specific raw shapes. A breaking normalized-shape change
requires a schema version bump and updated fixtures/tests.
