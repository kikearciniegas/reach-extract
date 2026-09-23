# Configuration

The project deliberately has no `.env` contract and no local credential file.
Configuration is split among CLI options, Agent Reach, OpenCLI, and the user's
existing browser session.

## Project options

| Concern | Default | Control |
| --- | --- | --- |
| Output root | `output` | `--out DIR` |
| Step timeout | 90,000 ms | `--timeout-ms N` |
| Generic web fallback | Enabled | `--no-fallback` |
| Comments | Not requested | `--comments` |
| Media download | Not requested | `--media` |
| Transcript requirement | Not requested | `--transcript`, `--audio`, or `--instructions` |
| ASR | Disabled | `--audio` |
| ASR provider | `auto` | `--provider auto|groq|openai` |
| Cross-provider ASR fallback | Disabled | `--allow-provider-fallback` |
| Maximum local media items sent to ASR | 5 | `--max-audio-items 1..20` |

The timeout applies to ordinary plan steps. Bilibili audio preparation receives
at least 300 seconds and transcription receives at least 600 seconds, even when
the general timeout is smaller.

## Agent Reach

Agent Reach owns API tokens, cookies imported through its explicit commands,
proxy settings, and transcription-provider selection. Useful configuration
keys exposed by the installed CLI include:

- `proxy`
- `github-token`
- `groq-key`
- `openai-key`
- `twitter-cookies`
- `youtube-cookies`
- `xhs-cookies`

Prefer stdin for secrets:

```bash
agent-reach configure groq-key --stdin
agent-reach configure openai-key --stdin
```

Do not put secrets in repository files, examples, shell history, manifests, or
bug reports. Use `agent-reach configure --help` for the installed version's
current options.

## OpenCLI and browser state

OpenCLI is responsible for site adapters and its Browser Bridge. This project:

- invokes only the read routes defined in the platform registry;
- inherits the current process environment;
- uses the browser/profile state OpenCLI already controls;
- does not select a Chrome profile itself;
- does not automate login or scrape browser cookie stores.

Run `opencli doctor` when authenticated adapters stop working. Log in manually
in the intended browser profile, connect the bridge, then rerun the plan.

## Platform override

`--platform NAME` bypasses hostname-based selection but does not change the URL.
Use it only when detection is ambiguous or a compatible alternate host is not
yet registered:

```bash
npm run plan -- "https://alternate.example/item" --platform youtube
```

Accepted names are those printed by `npm run platforms`. An incompatible URL
can still make the selected adapter fail.

## Output location and retention

`--out` is resolved against the process working directory. Every run creates a
new timestamped child folder. The stack does not rotate or delete old bundles.
Operators are responsible for access control, retention, backup, and deletion
because raw output can contain personal or account-visible data.

## Agent installation configuration

The installer defaults to project scope, all supported agents, and symlinks.
Use `--agents` for a subset and `--copy` only if links are unavailable:

```bash
npm run install:agents -- --scope user --agents codex,claude
npm run install:agents -- --scope project --copy
```

Existing non-matching targets are conflicts and are never overwritten. There is
no force option.
