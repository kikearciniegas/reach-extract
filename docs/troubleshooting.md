# Troubleshooting

Start with:

```bash
npm run doctor
npm run platforms
```

Then inspect the failed bundle's `manifest.json` and matching `raw/*.stderr`.
Do not discard raw evidence while diagnosing normalization.

## Command not found

### `agent-reach` or `opencli`

Confirm the executable is on `PATH` in the same shell or agent environment that
runs Node:

```bash
agent-reach --version
opencli --version
```

GUI agents can inherit a different `PATH` than an interactive terminal. Restart
the agent after changing shell or package-manager configuration.

### `bili`

Bilibili declares `bili video` as its required fallback. If it is missing,
Bilibili extraction can finish with required-step failure even if an optional
OpenCLI step produced partial data. Install/configure the supported Bilibili CLI
or use another platform route; do not substitute yt-dlp in this stack.

## Browser bridge disconnected

Symptoms include OpenCLI doctor failures, missing tabs, or authenticated
adapters returning no data.

1. Open the intended browser profile.
2. Log in manually to the platform.
3. Connect/enable the OpenCLI bridge.
4. Run `opencli doctor`.
5. Retry `plan`, then one extraction.

Do not copy cookies directly from the browser or automate login.

## Successful exit but empty content

The runner tracks `non_empty` separately from process success. Check:

- the step's `.stdout` and `.stderr`;
- whether stdout is an empty array/object-like response;
- `manifest.json.steps[].non_empty`;
- `record.json.gaps`;
- whether the platform changed its response fields.

Required empty steps produce exit code 2. Optional empty steps produce gaps.

## Unsupported URL host

The URL hostname must match a registered host exactly or as a subdomain. Use
`npm run platforms` to see accepted names and hosts. `--platform NAME` can
override detection for a compatible alternate host, but it cannot make an
incompatible URL valid.

Invalid URLs fail before output creation.

## Missing captions or transcript

First request platform evidence without external ASR:

```bash
npm run extract -- "URL" --transcript
```

If a transcript gap remains and external transmission is authorized, add
`--audio` and a configured provider. Some platforms have no stable media source
route, so the gap can remain even with `--audio`.

An empty transcript response is not proof of silence.

## Audio provider failure

Check:

- `agent-reach transcribe --help`;
- whether the intended provider key is configured;
- provider quota/billing and rate limits;
- media size, duration, extension, and accessibility;
- `raw/*audio-transcript*.stderr`;
- whether the operation timed out.

Use `--provider groq` or `--provider openai` for deterministic selection. Add
`--allow-provider-fallback` only when sending the same audio to another provider
is authorized.

## No transcribable media source

The bundle contains an optional `audio-source` failure stating that no source
was downloaded. Confirm the platform has an audio preparation route, inspect
the `media/` directory, and examine the download step. Facebook currently has
no stable arbitrary-reel download path in the maintained registry.

## Timeout

Increase the ordinary step timeout:

```bash
npm run extract -- "URL" --timeout-ms 180000
```

The runner terminates timed-out children with `SIGTERM`. Bilibili audio already
gets at least five minutes and ASR at least ten minutes. A larger timeout does
not solve authentication, risk controls, or an inaccessible URL.

## Rate limit, challenge, or Bilibili HTTP 412

Stop requests to that platform, retain the error, and wait for platform state
to recover. HTTP 412 on Bilibili is commonly a risk-control response in the
current environment, not a parser error. Do not retry in a tight loop or bypass
the control.

## Requested evidence absent from normalization

If raw JSON clearly contains the field but `record.json` does not:

1. Identify the exact raw key and JSON path.
2. Compare it with key sets in `normalize.mjs`.
3. Add the smallest appropriate key/pattern.
4. Add a fixture-based normalization test.
5. Keep the original raw file as the source of truth.

Do not broadly classify every string as text; that introduces metadata noise.

## Agent skill is missing

```bash
npm run check:agents -- --scope project
npm run check:agents -- --scope user
```

- `missing`: run the corresponding install command.
- `conflict`: inspect the path manually; the installer will not overwrite it.
- `installed`: restart the agent so it rescans skills.

Cloud agents may not see local user-level paths. Commit project-scope discovery
links and the canonical skill when the remote client supports repository skills.

## Duplicate skill entries

Avoid creating native links for every agent in addition to `.agents/skills`.
The supplied installer creates only `.agents`, `.codex`, and `.claude` targets.
Remove manually created duplicates only after resolving their exact target and
confirming they are not independent user data.

## Validator cannot download PyYAML

`npm run validate:skill` uses `uv` and may need network access the first time it
resolves PyYAML. Retry from a network-enabled development shell or pre-populate
the uv cache. This is a development check, not a runtime requirement.
