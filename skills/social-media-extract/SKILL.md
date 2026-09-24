---
name: social-media-extract
description: Extract and normalize evidence and actionable instructions from specific social posts, reels, videos, images, captions, audio, comments, and profile content through Agent Reach and OpenCLI. Use when a user supplies social URLs or asks for reproducible, read-only social-content or spoken-instruction extraction; do not use for publishing, engagement actions, or account automation.
license: MIT. See LICENSE for the full license text.
---

# Social Media Extract

Authored by Rafael Arciniegas. Copyright (c) 2026 Rafael Arciniegas.
Licensed under the [MIT License](LICENSE); see [NOTICE.md](NOTICE.md).
Third-party components and content remain subject to their owners' rights; see
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

The full local workflow requires Node.js 20+, Agent Reach, OpenCLI, network
access, and an existing authenticated session where the platform requires one.
Audio fallback additionally requires a configured ASR provider and may require
ffmpeg. Before invoking any helper, confirm that it exists in the current
runtime. If it does not, use the reduced-capability workflow below instead of
claiming that extraction ran.

Use the bundled script to create a reproducible evidence bundle while preserving
the platform's raw response. Treat extraction success as non-empty content, not
merely a zero exit code.

All relative paths in this file are relative to the directory containing this
`SKILL.md`, regardless of the agent's current working directory. Resolve that
skill root before invoking a bundled script. Do not assume the user's project
contains a top-level `scripts/` directory.

## Workflow

1. Run `agent-reach doctor --json` before authenticated or multi-backend work.
2. Run `node scripts/reach-extract.mjs plan URL` to verify platform detection and
   the exact read commands. Use `--platform NAME` only when URL detection is
   ambiguous.
3. Run `node scripts/reach-extract.mjs extract URL --out OUTPUT_DIR`. Add
   `--comments`, `--media`, `--audio`, or `--instructions` only when requested.
   `--audio` explicitly authorizes transcription through the configured Agent
   Reach provider, but runs only when platform subtitle evidence is empty.
4. Inspect `manifest.json`; do not describe a failed/empty step as successful.
5. Ground conclusions in `record.json` and retain `raw/` as provenance.

The script never logs in and never selects OpenCLI write commands. If the
browser bridge or login state is absent, report the affected platform and ask
the user to connect their existing session; do not retrieve browser cookies or
automate login.

## Reduced-capability hosted workflow

Claude Cowork, ChatGPT, Gemini Apps, and other hosted surfaces may not expose
the operator's local Agent Reach, OpenCLI, browser session, Node.js runtime, or
ASR tools. When those dependencies are unavailable:

1. Do not claim that a URL was opened, extracted, authenticated, transcribed,
   or saved unless the current surface actually performed and returned that
   operation.
2. Ask the user to paste or upload an export, caption, transcript, screenshot,
   or other source content. Normalize only the evidence that is actually
   available.
3. Clearly label missing fields and provenance gaps. Built-in web access may be
   used only when the retrieved content is visible and attributable in the
   current session.
4. Never request passwords, copy cookies, bypass access controls, automate
   login, or infer absent audio or comments from a caption.
5. Recommend the full local Agent Skill in Codex, Claude Code, or Gemini CLI
   when reproducible raw output, authenticated access, ASR, or evidence bundles
   are required.

## Routing

- Read [references/platforms.md](references/platforms.md) when selecting a
  platform route, handling authentication, or diagnosing a platform gap.
- Read [references/schema.md](references/schema.md) when consuming, combining,
  or extending normalized extraction records.
- Read [references/operations.md](references/operations.md) for retries,
  rate-limit behavior, and acceptance criteria.
- Read [references/compatibility.md](references/compatibility.md) only when
  installing, verifying, or troubleshooting discovery in another LLM agent.

Prefer platform-specific OpenCLI commands. The generic `opencli web read`
fallback is evidence with lower confidence and must remain labeled as such.
Do not silently replace an unsupported artifact (for example, spoken audio)
with a caption.

## Commands

```bash
node scripts/reach-extract.mjs doctor
node scripts/reach-extract.mjs platforms
node scripts/reach-extract.mjs plan "URL"
node scripts/reach-extract.mjs extract "URL" --out ./output --comments --media --audio --instructions
```

Use `--dry-run` with `extract` to serialize the command plan without accessing
the network. Use `--no-fallback` when generic page reading is not acceptable.
Use `--provider groq|openai` to select an ASR provider. Never add
`--allow-provider-fallback` unless the user authorizes sending the same audio to
another configured provider, which may incur cost.
