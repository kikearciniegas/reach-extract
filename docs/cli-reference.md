# CLI reference

There are two command-line interfaces: the extraction CLI inside the portable
skill and the repository-level agent installer.

## Extraction CLI

Direct form:

```bash
node skills/social-media-extract/scripts/reach-extract.mjs COMMAND [arguments]
```

The npm aliases are `doctor`, `platforms`, `plan`, and `extract`.

### `doctor`

```bash
npm run doctor
```

Runs Agent Reach and OpenCLI diagnostics concurrently and prints:

```json
{
  "agent_reach": { "ok": true, "data": {}, "error": null },
  "opencli": { "ok": true, "output": "...", "error": null }
}
```

OpenCLI is treated as unhealthy if its output contains `[FAIL]` or `[MISSING]`
even when its process exits successfully.

### `platforms`

```bash
npm run platforms
```

Prints each implemented platform's name, recognized hosts, and declared
capabilities. It performs no network access.

### `plan URL`

```bash
npm run plan -- "URL" [options]
```

Detects the platform, serializes exact read commands, and lists conditional
post-processing. It does not execute the steps or write a bundle.

### `extract URL`

```bash
npm run extract -- "URL" [options]
```

Executes steps sequentially, stores raw output, normalizes evidence, optionally
runs audio fallback and instruction extraction, then prints a summary.

### Extraction options

| Option | Meaning |
| --- | --- |
| `--out DIR` | Output root; default `output` |
| `--platform NAME` | Override URL-based platform detection |
| `--comments` | Request comments/replies where implemented |
| `--media` | Request downloadable media where implemented |
| `--transcript` | Mark transcript as requested without enabling ASR |
| `--audio` | Authorize audio fallback when platform transcript evidence is empty |
| `--instructions` | Write `instructions.json`; also makes transcript a requested evidence kind |
| `--provider auto|groq|openai` | Select ASR provider; default `auto` |
| `--allow-provider-fallback` | Let `auto` send audio to the next configured provider after failure |
| `--max-audio-items N` | Transcribe at most 1–20 downloaded media files; default 5 |
| `--timeout-ms N` | Positive per-step timeout in milliseconds; default 90,000 |
| `--no-fallback` | Disable the lower-confidence generic page-read fallback |
| `--dry-run` | Print the plan and perform no extraction |

Options with values fail when the value is missing or invalid. Unknown options
and unsupported hosts fail before creating an output directory.

### Extraction exit codes

| Code | Meaning |
| --- | --- |
| `0` | Command completed; for extraction, no required step failed or returned empty content |
| `1` | Usage error, unsupported input, internal error, missing executable, or failed doctor check |
| `2` | Extraction finished and wrote its bundle, but at least one required step failed or was empty |

Optional failures and evidence gaps do not by themselves produce exit code 2.
Inspect `manifest.json` and `record.json.gaps` regardless of the code.

## Agent installer CLI

```bash
node scripts/install-agent-skill.mjs install [options]
node scripts/install-agent-skill.mjs check [options]
```

### Commands

| Command | Behavior |
| --- | --- |
| `install` | Preflight every target, then create missing links/copies if no conflicts exist |
| `check` | Read-only status check; exits 1 if any target is missing or conflicting |

### Installer options

| Option | Meaning |
| --- | --- |
| `--scope project|user` | Target repository-local or home-directory discovery; default `project` |
| `--agents all|a,b,c` | Select clients; default `all` |
| `--copy` | Copy the skill instead of linking it |
| `--dry-run` | Preflight and print status without writing |
| `--json` | Print the status array as JSON |
| `--project-root PATH` | Override canonical repository root; intended primarily for tests |
| `--home PATH` | Override user home target; intended primarily for tests |
| `--help` | Print usage |

Accepted agent names are `codex`, `claude`, `gemini`, `copilot`, `cursor`,
`opencode`, `windsurf`, and `devin`.

### Installer statuses

| Status | Meaning |
| --- | --- |
| `missing` | Target does not exist |
| `installed` | Target resolves to the canonical skill |
| `conflict` | Target exists but does not resolve to the canonical skill |
| `installed (linked)` | This run created a link |
| `installed (copied)` | This run created a standalone copy |

The installer preflights all targets and refuses to overwrite conflicts. It has
no uninstall or force mode.
