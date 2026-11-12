# Agent compatibility

This skill follows the open Agent Skills specification: a directory containing
`SKILL.md` with `name` and `description` frontmatter, plus optional scripts,
references, and assets. The canonical directory is
`skills/social-media-extract`; discovery paths should link to it rather than
forking its contents.

## Verified discovery matrix

| Agent | Project path | User path | Invocation |
| --- | --- | --- | --- |
| OpenAI Codex | `.codex/skills/social-media-extract` | `~/.codex/skills/social-media-extract` | Automatic by description or explicit skill mention |
| Claude Code | `.claude/skills/social-media-extract` | `~/.claude/skills/social-media-extract` | Automatic or `/social-media-extract` |
| Gemini CLI | `.agents/skills/social-media-extract` | `~/.agents/skills/social-media-extract` | Automatic or `/skills` |
| GitHub Copilot | `.agents/skills/social-media-extract` | `~/.agents/skills/social-media-extract` | Automatic or Copilot skill UI/CLI |
| Cursor | `.agents/skills/social-media-extract` | `~/.agents/skills/social-media-extract` | Automatic or `/social-media-extract` |
| OpenCode | `.agents/skills/social-media-extract` | `~/.agents/skills/social-media-extract` | Automatic or skill tool |
| Windsurf / Devin | `.agents/skills/social-media-extract` | `~/.agents/skills/social-media-extract` | Automatic or `@social-media-extract` |

The `.agents/skills` standard location is intentionally shared. Creating a
second native link for every compatible agent can make the same skill appear
twice, so the installer creates only the shared path plus the Codex and Claude
paths that those clients require.

## Packaged desktop surfaces

The filesystem installer above is separate from the release packages:

- Claude Code and Cowork can install the native `reach-extract` plugin; its
  skill is namespaced as `/reach-extract:social-media-extract`.
- Claude's Skills interface can upload the standalone skill ZIP.
- ChatGPT/Codex can consume the portable Agent Plugin after installation or
  directory publication.
- Gemini Apps can use the reduced Gem instructions, while Gemini CLI continues
  to use the canonical filesystem skill.

Hosted surfaces may not expose the local terminal, Agent Reach, OpenCLI,
browser authentication, filesystem, or ASR configuration. Use the
reduced-capability workflow in `SKILL.md` whenever those dependencies are not
actually available; never claim a local operation ran based only on the
presence of the skill instructions.

## Installer

From the repository root:

```bash
node scripts/install-agent-skill.mjs install --scope project
node scripts/install-agent-skill.mjs install --scope user
node scripts/install-agent-skill.mjs check --scope user --json
```

Use `--agents codex,claude` to install a subset. Accepted names are `codex`,
`claude`, `gemini`, `copilot`, `cursor`, `opencode`, `windsurf`, and `devin`.
All except Codex and Claude map to the shared `.agents/skills` target.

The default is a symlink. `--copy` creates a standalone copy for environments
where symlinks are unavailable, but future changes to the canonical skill will
not propagate into that copy. Existing non-matching paths are reported as
conflicts and are never overwritten.

## Runtime portability

- Resolve `scripts/reach-extract.mjs` relative to `SKILL.md`, not relative to
  the user's current directory.
- The implementation is plain ESM JavaScript with no package dependencies.
- The agent must have terminal execution and read/write access to the requested
  output directory.
- Platform login remains in the user's existing browser/OpenCLI session. Never
  automate credentials or copy browser cookies.
- Agents without native Agent Skills discovery can still be told to read this
  `SKILL.md` directly and execute its bundled script.
