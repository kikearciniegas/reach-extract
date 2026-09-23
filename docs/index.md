# Documentation index

This documentation separates operator guidance from the compact references an
LLM agent loads only when needed.

## Operators and users

| Document | Use it for |
| --- | --- |
| [Getting started](getting-started.md) | Prerequisites, first setup, health checks, and first extraction |
| [CLI reference](cli-reference.md) | Every command, option, exit code, and installer status |
| [Configuration](configuration.md) | Browser state, transcription providers, timeouts, limits, and output location |
| [Output and evidence](output-and-evidence.md) | Bundle layout, provenance, gaps, and interpreting results |
| [Audio and instruction extraction](audio-and-instructions.md) | ASR consent, provider behavior, supported sources, and classifier behavior |
| [Security and privacy](security-and-privacy.md) | Read-only guarantees, credentials, personal data, external transmission, and platform controls |
| [Troubleshooting](troubleshooting.md) | Diagnostics and common failure modes |

## Maintainers

| Document | Use it for |
| --- | --- |
| [Architecture](architecture.md) | Modules, control flow, invariants, and extension points |
| [Development and maintenance](development.md) | Tests, validation, platform additions, schema changes, and releases |
| [Legacy Facebook prototypes](legacy-facebook-prototypes.md) | Scope and risks of the preserved one-off browser scripts |

## Agent-facing canonical references

These live inside the portable skill so any compatible agent can load them
relative to `SKILL.md`:

- [Skill workflow](../skills/social-media-extract/SKILL.md)
- [Platform routing](../skills/social-media-extract/references/platforms.md)
- [Normalized schema](../skills/social-media-extract/references/schema.md)
- [Operations and acceptance](../skills/social-media-extract/references/operations.md)
- [Agent compatibility](../skills/social-media-extract/references/compatibility.md)

The root [README](../README.md) is the short project entry point.
Authorship and usage terms are recorded in the [copyright notice](../NOTICE.md).
Third-party ownership and disclaimers are recorded in the
[third-party notices](../THIRD_PARTY_NOTICES.md).
