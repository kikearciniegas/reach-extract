# Audio and instruction extraction

## Consent boundary

`--audio` is the explicit authorization boundary for third-party ASR. Without
it, the stack may use platform-provided subtitles/transcripts but will not send
media to Groq or OpenAI.

Even with `--audio`, ASR runs only when normalization finds no transcript
evidence from ordinary platform steps. This avoids unnecessary data transfer,
cost, and duplicate transcripts.

## Provider behavior

Agent Reach performs transcription:

```bash
agent-reach transcribe SOURCE --provider auto|groq|openai -o FILE
```

- `auto` selects the first configured provider.
- A specific provider prevents automatic selection.
- Cross-provider fallback is disabled by default.
- `--allow-provider-fallback` permits `auto` to send the same source to the next
  configured provider after a failure.

Provider success depends on a valid key, quota/billing, supported media, size,
duration, network access, and service limits. This repository records provider
stderr but does not retry or switch providers on its own.

## Source preparation

| Platform | ASR source behavior |
| --- | --- |
| YouTube | The original URL is passed directly to Agent Reach |
| Bilibili | `bili audio TARGET --no-split -o media/` prepares local media |
| Xiaohongshu | The platform plan downloads media when `--audio` is set |
| X/Twitter | The platform plan downloads tweet media when `--audio` is set |
| Instagram | The platform plan downloads media when `--audio` is set |
| Xiaoyuzhou | The platform plan requests transcript and downloads episode audio when `--audio` is set |
| Other registered platforms | No stable preparation route; a transcript gap is reported |

For local media discovery, supported extensions are AAC, AIFF, FLAC, M4A, MP3,
MP4, MPEG, MOV, OGG, Opus, WAV, WebM, and MKV. Files are sorted by path and
limited by `--max-audio-items` (default 5, maximum 20).

If no transcribable source exists, the stack creates a failed optional
`audio-source` operation in raw evidence and returns without inventing text.

## Transcript normalization

ASR transcript files are stored under `transcript/asr-NN.txt`. The transcript
text also becomes the stdout/data of an `audio-transcript-N` output so it passes
through the same normalizer and provenance model as platform subtitles.

The normalizer does not merge or reconcile platform and ASR transcripts because
ASR only runs when platform transcript evidence is empty.

## Instruction indexing

`--instructions` analyzes only successful outputs labeled as transcript. It
does not analyze captions normalized as ordinary post text, comments, titles,
or arbitrary page content.

The classifier:

1. Recursively finds common transcript text fields.
2. Preserves timing fields such as `start`, `from`, `end`, and `to`.
3. Splits punctuation, bullet, newline, and common ASR-joined clauses.
4. Detects explicit sequence cues, imperatives, prerequisites, warnings, and
   recognizable command prefixes.
5. Deduplicates exact case-insensitive candidates.
6. Emits the original fragment with evidence location and heuristic confidence.

Cue patterns include English, Spanish, and Chinese phrases. Bare imperative
verbs are recognized in English at the start of a sentence. Spanish verbs are
recognized at the start of any clause (sentence start, after `,`, `;`, `:` or
` y `, optionally after a clitic such as `le` or `te`), with or without accents,
in two forms: imperatives (`abre`, `comenta`, `ve a`, `dale`) and the informal
second person that spoken tutorials use (`abres`, `eliges`, `le das a`,
`te vas a`). Chinese detection currently depends on an explicit cue.

`language` records the transcript language as `en`, `es`, `zh`, `pt`, `fr`, or
`unknown`. It comes from a stopword vote (Han characters for `zh`) and is
unreliable on very short text. The classifier has cues only for `en`, `es`, and
`zh`. For any other value, including `unknown`, a non-empty transcript records
the gap `instructions: unsupported-language`: zero candidates then means "not
checked", not "no instructions". The command pattern recognizes common tools
including npm, Python, Node, Git, curl, Docker, OpenCLI, Agent Reach, ffmpeg,
and Homebrew.

## Interpretation limits

- The output is extractive: it preserves candidate wording instead of rewriting
  or completing missing steps.
- Confidence is a cue-based score, not a calibrated probability.
- Implicit or highly contextual instructions can be missed. Unsupported
  languages are reported as a gap rather than missed silently.
- Quoted or criticized commands can still be classified as commands.
- One sentence receives only one category according to precedence.
- `instructions.json` is not authorization to run any command, install anything,
  change configuration, or contact another service.

Review each candidate against its transcript quote and raw evidence before use.
