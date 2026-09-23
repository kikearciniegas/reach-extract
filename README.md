# WORX Reach Extract

WORX Reach Extract is a read-only social-content extraction stack and portable
Agent Skill. It routes supported URLs through Agent Reach and OpenCLI, preserves
raw command output, normalizes evidence, optionally transcribes audio, and can
identify evidence-linked instructions without executing them.

The canonical skill is [`skills/social-media-extract`](skills/social-media-extract/SKILL.md).
It follows the open Agent Skills format and is installed through links rather
than duplicated copies.

## What it does

- Detects supported platforms from a supplied URL.
- Builds an inspectable, read-only command plan before extraction.
- Collects posts, captions, text, comments, media references, authors, metrics,
  subtitles, and transcripts when the selected adapter exposes them.
- Stores untouched stdout and stderr alongside normalized JSON evidence.
- Uses ASR only when requested and when platform transcript evidence is empty.
- Extracts steps, prerequisites, warnings, and shell commands from transcript
  evidence while retaining quotes, timestamps, and provenance.
- Installs as one shared skill for Codex, Claude Code, Gemini CLI, GitHub
  Copilot, Cursor, OpenCode, and Windsurf/Devin.

It does not publish, like, comment, follow, automate login, bypass platform
controls, execute extracted instructions, or treat an empty successful process
as proof that content was captured.

## Requirements

- Node.js 20 or newer.
- Agent Reach available as `agent-reach`.
- OpenCLI available as `opencli`.
- An existing authenticated browser/OpenCLI session for platforms that require
  login.
- Optional: `bili` for Bilibili fallback and a configured Groq or OpenAI
  transcription key for audio fallback.

See [Getting started](docs/getting-started.md) for setup and verification.

## Quick start

```bash
npm test
npm run doctor
npm run platforms
npm run plan -- "https://www.youtube.com/watch?v=VIDEO_ID"
npm run extract -- "URL" --out output --comments --media
```

Extract spoken instructions only when the user has authorized transcription:

```bash
npm run extract -- "URL" \
  --out output \
  --audio \
  --instructions \
  --provider groq
```

`plan` and `extract --dry-run` do not contact the social platform. Ordinary
`extract` runs the serialized read plan and writes a timestamped evidence
bundle.

## Output bundle

Each extraction creates `<output>/<timestamp>-<platform>/` containing:

| Path | Purpose |
| --- | --- |
| `manifest.json` | Request options, exact commands, timing, exit status, and errors |
| `record.json` | Normalized content, evidence index, gaps, and provenance |
| `evidence.jsonl` | One normalized evidence item per line |
| `instructions.json` | Optional transcript-grounded instructions |
| `raw/*.stdout` | Untouched standard output for each attempted step |
| `raw/*.stderr` | Untouched standard error for each attempted step |
| `media/` | Optional downloaded media used for evidence or transcription |
| `transcript/` | Optional ASR transcript files |

The complete contract is in [Output and evidence](docs/output-and-evidence.md)
and the canonical [normalized schema](skills/social-media-extract/references/schema.md).

## Cross-agent installation

```bash
# Discoverable only while working in this repository
npm run install:agents -- --scope project

# Discoverable in every local project for this OS user
npm run install:agents -- --scope user

# Read-only verification
npm run check:agents -- --scope project
npm run check:agents -- --scope user
```

Three discovery paths avoid duplicate registrations:

| Discovery path | Agents served |
| --- | --- |
| `.agents/skills/` | Gemini CLI, GitHub Copilot, Cursor, OpenCode, Windsurf/Devin, and compatible clients |
| `.codex/skills/` | OpenAI Codex |
| `.claude/skills/` | Claude Code |

Links are the default, so canonical changes propagate immediately. `--copy` is
available for filesystems that cannot create links, but copies do not update
automatically. See [Agent compatibility](skills/social-media-extract/references/compatibility.md).

## Documentation

- [Documentation index](docs/index.md)
- [Getting started](docs/getting-started.md)
- [CLI reference](docs/cli-reference.md)
- [Architecture](docs/architecture.md)
- [Configuration](docs/configuration.md)
- [Output and evidence](docs/output-and-evidence.md)
- [Audio and instruction extraction](docs/audio-and-instructions.md)
- [Security and privacy](docs/security-and-privacy.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Development and maintenance](docs/development.md)
- [Legacy Facebook prototypes](docs/legacy-facebook-prototypes.md)
- [Platform routing reference](skills/social-media-extract/references/platforms.md)
- [Operational acceptance criteria](skills/social-media-extract/references/operations.md)

## Development checks

```bash
npm test
npm run docs:check
npm run validate:skill
```

The test suite is offline. Live platform extraction is intentionally separate
because it depends on account state, browser connectivity, platform controls,
and user authorization.

## Security and privacy

- Report vulnerabilities privately through [GitHub Security Advisories](https://github.com/kikearciniegas/reach-extract/security/advisories/new); do not disclose exploitable details in a public issue.
- Review the [security policy](SECURITY.md) for supported versions and response expectations.
- Review the [privacy policy](PRIVACY.md) before processing personal, private,
  account-visible, or copyrighted content.
- Repository automation uses least-privilege permissions, pinned actions,
  CodeQL analysis, dependency review, Dependabot, secret scanning, and protected
  updates to `main`.

## Authorship and license

Authored by **Rafael Arciniegas**.

Copyright (c) 2026 Rafael Arciniegas.

Released under the [MIT License](LICENSE). See [NOTICE.md](NOTICE.md) for the
project attribution, and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for
third-party ownership recognition, license information, and disclaimers.
