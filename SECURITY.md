# Security policy

## Supported versions

Security fixes are applied to the latest commit on `main`. Older commits,
forks, copied skill folders, legacy Facebook prototype scripts, and modified
distributions are not supported.

## Report a vulnerability

Report suspected vulnerabilities through
[GitHub private vulnerability reporting](https://github.com/kikearciniegas/reach-extract/security/advisories/new).
Do not include exploit details, credentials, private URLs, personal data, or
unredacted extraction output in a public issue.

Include only the minimum information needed to reproduce the problem:

- affected commit and component;
- impact and prerequisites;
- a minimal, sanitized reproduction;
- suggested mitigation, if known; and
- a safe way to contact you.

You should receive an acknowledgement within seven calendar days. Validation,
remediation, disclosure timing, and credit will be coordinated through the
private advisory. Please allow a reasonable remediation period before public
disclosure. This policy does not authorize accessing other people's accounts or
data, evading platform controls, disrupting services, or retaining data beyond
what is necessary to report the issue.

## Security boundaries

The maintained extractor is read-only, but it processes untrusted social
content and may invoke local CLIs or explicitly authorized transcription
providers. Extracted instructions are evidence, never execution authorization.
Do not submit real credentials or sensitive personal data as test fixtures.

See [Security and privacy](docs/security-and-privacy.md) and
[Privacy](PRIVACY.md) for operational safeguards and data handling.
