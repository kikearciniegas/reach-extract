# Distribution formats and verification

The canonical source is `skills/social-media-extract/`. Application packages
adapt that source without maintaining separate copies of the full skill.

| File | Intended use |
| --- | --- |
| `reach-extract-claude-desktop.zip` | Standalone skill upload in Claude |
| `reach-extract-claude-plugin.zip` | Claude Code or Cowork native plugin |
| `reach-extract-chatgpt-plugin.zip` | OpenAI plugin testing and submission |
| `reach-extract-gemini-instructions.md` | Reduced-capability Gemini Gem |
| `manifest.json` | Version and SHA-256 hashes |

`plugin.json` is the portable Agent Plugin manifest. The
`.codex-plugin/plugin.json` overlay declares the skills directory and OpenAI
interface. `.claude-plugin/plugin.json` is the native Anthropic manifest, and
`.claude-plugin/marketplace.json` makes the repository a Claude marketplace.
Every manifest and `package.json` uses the same semantic version.

## Build and verify

Install Node.js 20 or newer and the system `zip` utility, then run:

```bash
npm run package:desktop
```

Select another directory with `npm run package:desktop -- --out /absolute/path`.
The builder removes and recreates only that selected directory, packages an
allowlist of project paths, and hashes the results.

On macOS or Linux, compare a downloaded release with `manifest.json`:

```bash
shasum -a 256 reach-extract-claude-desktop.zip
shasum -a 256 reach-extract-claude-plugin.zip
shasum -a 256 reach-extract-chatgpt-plugin.zip
shasum -a 256 reach-extract-gemini-instructions.md
```

On Windows PowerShell, run `Get-FileHash <file> -Algorithm SHA256`. Do not
install an artifact whose digest differs from the manifest.

`npm test` builds packages in a temporary directory and verifies their layouts
and hashes. CI also validates the skill and all plugin manifests, runs Claude
Code's official strict validator, checks documentation, and exercises a dry-run
filesystem installation plan.
