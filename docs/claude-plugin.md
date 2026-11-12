# Claude Code and Cowork plugin

Reach Extract ships a native Anthropic plugin in addition to its portable
filesystem skill. Both distributions use `skills/social-media-extract`.

## Install from the public marketplace repository

In Claude Code, run inside an interactive session:

```text
/plugin marketplace add kikearciniegas/reach-extract
/plugin install reach-extract@reach-extract
```

Reload plugins if Claude requests it. Invoke the packaged skill as
`/reach-extract:social-media-extract`; an unqualified alias may appear when it
does not conflict.

In Cowork, open Customize → Plugins → Add marketplace, enter
`https://github.com/kikearciniegas/reach-extract`, install Reach Extract, and
enable its skill. Alternatively, upload `reach-extract-claude-plugin.zip` from
the [latest release](https://github.com/kikearciniegas/reach-extract/releases/latest).
The standalone `reach-extract-claude-desktop.zip` is for Customize → Skills.

## Validate locally

```bash
npm run validate:claude
npm run validate:claude:official
```

The official command requires Claude Code on `PATH`. CI installs a pinned
Claude Code version and runs both checks before release packaging.

## Runtime boundary and smoke test

Claude Code can run the bundled Node.js helper when Node.js, Agent Reach,
OpenCLI, network access, and any required authenticated browser session are
available locally. Cowork's hosted environment may not expose those local
dependencies. It must then use the skill's reduced-capability workflow and
must not claim a local extraction or ASR run occurred.

Before directory submission:

1. Install the public repository marketplace or upload the release ZIP.
2. Start a new session and confirm the plugin and skill are enabled.
3. Invoke `/reach-extract:social-media-extract` with a public test URL.
4. Confirm the result either contains attributable evidence or explicitly
   reports the access/runtime gap.
5. Test pasted content and confirm it is normalized without invented fields.
6. Confirm the plugin performs no engagement or login action.

## Submit to Anthropic

- Claude.ai: <https://claude.ai/admin-settings/directory/submissions/plugins/new>
- Anthropic Console: <https://platform.claude.com/plugins/submit>

Official references:

- <https://code.claude.com/docs/en/plugins>
- <https://code.claude.com/docs/en/plugins-reference>
- <https://code.claude.com/docs/en/plugin-marketplaces>
- <https://claude.com/docs/cowork/guide/plugins>
