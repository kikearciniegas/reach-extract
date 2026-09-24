# Desktop application support

Run `npm run package:desktop` to create all artifacts under `dist/`. The command
also writes `manifest.json` with SHA-256 hashes. Prebuilt packages are available
from the [latest GitHub release](https://github.com/kikearciniegas/reach-extract/releases/latest).

See [Distribution formats and verification](distribution-format.md) for archive
contents, local builds, and checksum verification.

## Claude Desktop skills

Artifact: `reach-extract-claude-desktop.zip`

Open Customize → Skills, choose Create skill → Upload a skill, upload the ZIP,
and enable Social Media Extract. The archive contains one top-level
`social-media-extract/` folder.

Claude's hosted environment may not expose the operator's local Agent Reach,
OpenCLI, authenticated browser, Node.js, ffmpeg, or ASR configuration. In that
case the skill uses its documented reduced-capability workflow and works from
content the user uploads or pastes.

Official instructions: <https://support.claude.com/en/articles/12512180-use-skills-in-claude>

## Claude Code and Cowork plugin

Artifact: `reach-extract-claude-plugin.zip`

The native Anthropic plugin includes `.claude-plugin/plugin.json`, a public
marketplace catalog, and the canonical skill. In Cowork, open Customize →
Plugins and add `https://github.com/kikearciniegas/reach-extract` as a
marketplace or upload the plugin ZIP. In Claude Code, add that repository as a
marketplace and install `reach-extract@reach-extract`.

The namespaced skill command is `/reach-extract:social-media-extract`. See
[Claude Code and Cowork plugin](claude-plugin.md) for exact commands and
validation.

Official documentation: <https://code.claude.com/docs/en/plugins> and
<https://claude.com/docs/cowork/guide/plugins>

## ChatGPT and Codex

Artifact: `reach-extract-chatgpt-plugin.zip`

The repository root is a portable Agent Plugin with `plugin.json`;
`.codex-plugin/plugin.json` is the OpenAI compatibility overlay. Public ChatGPT
availability requires upload, review, approval, and publication through the
OpenAI plugin portal. See [ChatGPT plugin submission](chatgpt-plugin-submission.md).

Official packaging documentation: <https://developers.openai.com/plugins/build/plugins>

## Gemini Apps and desktop

Artifact: `reach-extract-gemini-instructions.md`

Create a Gem in the Gemini web app, name it `Reach Extract`, paste the artifact
into the Gem instructions, and save it. Gemini Apps cannot be assumed to expose
the local extractor or authenticated browser session; the adapter explicitly
limits itself to content actually retrieved in the session or supplied by the
user.

Official instructions: <https://support.google.com/gemini/answer/15146780>

## Capability matrix

| Surface | Skill instructions | Local extractor | Authenticated browser state | Distribution |
| --- | --- | --- | --- | --- |
| Codex app/CLI | yes | yes, when installed | local-session dependent | filesystem skill or plugin |
| Claude Code | yes | yes, when installed | local-session dependent | native plugin or skill |
| Gemini CLI | yes | yes, when installed | local-session dependent | filesystem skill |
| Claude Cowork | yes | environment dependent | not the operator's local session | native plugin or skill ZIP |
| ChatGPT | yes after publication | surface dependent | not the operator's local session | plugin ZIP plus review |
| Gemini Apps/Desktop | reduced adapter | no assumed access | no assumed access | Gem instructions |

Account plans, regions, uploads, enablement, and marketplace acceptance remain
under each application provider's control.
