# Getting started

## 1. Prerequisites

The core stack requires:

- Node.js 20 or newer.
- `agent-reach` on `PATH`.
- `opencli` on `PATH`.
- Network access for live extraction.
- A connected, already authenticated browser/OpenCLI session where the target
  platform requires login.

Optional components:

- `bili` enables Bilibili's required metadata fallback and its audio download
  path.
- A Groq or OpenAI key configured in Agent Reach enables ASR.
- Media codecs such as ffmpeg may be needed by the external media/transcription
  stack for some formats; this repository does not invoke ffmpeg directly.

There are no npm runtime dependencies. Do not run `npm install` merely to use
the project; the code uses Node's built-in modules.

## 2. Verify the tools

From the repository root:

```bash
node --version
agent-reach --version
opencli --version
npm run doctor
```

`npm run doctor` runs both `agent-reach doctor --json` and `opencli doctor`.
It exits nonzero if Agent Reach fails or if OpenCLI reports a failed/missing
browser-bridge check.

List the registry implemented by this project:

```bash
npm run platforms
```

This is not the same as Agent Reach's entire platform catalog. It is the set of
URL adapters currently implemented and tested by this extraction stack.

## 3. Configure optional transcription

Agent Reach owns provider credentials; this project never reads or stores API
keys directly. Configure one provider using stdin so the key is not placed in
the command's argument list:

```bash
agent-reach configure groq-key --stdin
```

or:

```bash
agent-reach configure openai-key --stdin
```

Enter the key on standard input and finish the stream. Re-run `npm run doctor`
after configuration. A valid key can still fail because of provider quota,
billing, format, size, or rate limits.

## 4. Install the Agent Skill

Project scope makes the skill travel with this repository:

```bash
npm run install:agents -- --scope project
```

User scope makes the same canonical skill available in other local projects:

```bash
npm run install:agents -- --scope user
```

Verify either scope without modifying it:

```bash
npm run check:agents -- --scope project
npm run check:agents -- --scope user
```

See [Agent compatibility](../skills/social-media-extract/references/compatibility.md)
for paths, supported clients, subset installation, and copy mode.

## 5. Inspect a plan

Planning is offline and is the safest first operation:

```bash
npm run plan -- "https://www.youtube.com/watch?v=VIDEO_ID" --comments
```

Review:

- detected `platform`;
- declared `capabilities`;
- exact commands in `steps`;
- which steps are `required`;
- conditional audio and instruction post-processing.

`extract --dry-run` produces the same plan form without creating an evidence
bundle:

```bash
npm run extract -- "URL" --audio --instructions --dry-run
```

## 6. Run an extraction

Basic post extraction:

```bash
npm run extract -- "URL" --out output
```

Request comments and downloaded media when supported:

```bash
npm run extract -- "URL" --out output --comments --media
```

Request transcript evidence without authorizing third-party ASR:

```bash
npm run extract -- "URL" --out output --transcript
```

Authorize audio fallback and instruction indexing:

```bash
npm run extract -- "URL" \
  --out output \
  --audio \
  --instructions \
  --provider groq
```

Audio is sent to the configured provider only if platform transcript/subtitle
evidence is empty. Cross-provider fallback is off unless
`--allow-provider-fallback` is also present.

## 7. Evaluate the result

The command prints a compact JSON summary with `ok`, `output`, `platform`,
evidence count, optional instruction count, and `gaps`.

Do not rely on `ok` alone. Open the bundle's `manifest.json`, `record.json`, and
raw files. A missing transcript is represented as a gap; it does not prove the
source contains no speech. See [Output and evidence](output-and-evidence.md).
