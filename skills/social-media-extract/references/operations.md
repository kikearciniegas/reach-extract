# Operations and acceptance

## Acceptance criteria

An extraction is usable when all of the following hold:

1. The platform was detected or explicitly selected.
2. At least one primary read command returned parseable, non-empty content.
3. Raw output, normalized output, and a manifest were written.
4. Requested-but-missing captions, transcript, comments, or media are listed in
   `record.json.gaps`.
5. When instructions are requested, `instructions.json` contains only items
   linked to transcript evidence; an empty result is valid and must not be
   filled with inferred advice.

Exit code `0` alone is not evidence of content.

## Failure handling

- Browser bridge disconnected: stop authenticated extraction and ask the user
  to enable the OpenCLI extension in an already logged-in Chrome session.
- Login required/expired: ask the user to log in manually. Do not automate it.
- Rate limit/challenge: stop that platform, retain raw error output, and report
  the condition. Do not loop around anti-abuse controls.
- Unsupported direct-detail route: retain the lower-confidence generic page
  result and report missing evidence fields.
- Partial batch: keep successful bundles; do not erase them because another URL
  failed.
- Audio fallback: use platform subtitles first. Run ASR only with explicit
  `--audio`; never silently enable cross-provider fallback.

## Data handling

Extract only URLs placed in scope by the user. Raw output can contain personal
data visible to their account, so store it under the chosen output directory
and do not transmit it to another service unless separately authorized.
Audio transcription sends the source media to the configured Groq or OpenAI
provider. The default `auto` mode uses only the first configured provider.
