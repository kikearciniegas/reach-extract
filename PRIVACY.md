# Privacy and data handling

## Project behavior

Reach Extract has no project-operated server, account system, analytics, or
telemetry. The software runs locally and writes extraction bundles to the output
directory chosen by the operator.

The project does not itself collect or receive those bundles. GitHub receives
the normal account and usage data associated with visiting or contributing to
this repository under GitHub's own policies.

When a release package is uploaded to Claude, ChatGPT, Gemini, or another
hosted agent, prompts, uploaded evidence, and tool results are processed by
that provider under the user's account settings and the provider's terms and
privacy policy. This project does not control or receive that hosted data.

## Data processed by an extraction

Depending on the requested source and options, output can contain names,
handles, captions, comments, images, audio, transcripts, engagement data,
account-visible content, URLs, and other personal or copyrighted information.
Raw evidence is intentionally preserved and is not anonymized or automatically
redacted.

Requests are sent to the selected social platform through Agent Reach, OpenCLI,
or another documented adapter. When the operator explicitly enables audio
fallback, media or a media URL can also be sent to the configured Groq or
OpenAI transcription provider. Those independent services apply their own
terms and privacy policies.

## Operator responsibilities

Before extraction, confirm that access and processing are lawful, authorized,
necessary, and consistent with the platform's terms. Use the least data and
fewest options needed. Store outputs in an approved location with appropriate
access controls, encryption, backup rules, and retention limits. Delete them
when their purpose ends.

Do not commit extraction output, session material, cookies, access tokens,
private URLs, or personal datasets to this repository. Sanitize diagnostics
before opening an issue or pull request. Vulnerability material belongs in a
[private security advisory](https://github.com/kikearciniegas/reach-extract/security/advisories/new).

## Requests and contact

The repository maintainer cannot access or delete data stored only on an
operator's machine or in an operator-selected third-party service. Requests
about GitHub or a transcription/social platform must be directed to that
service. For repository-specific privacy concerns, open a public issue only if
it contains no sensitive information; otherwise use private vulnerability
reporting.
