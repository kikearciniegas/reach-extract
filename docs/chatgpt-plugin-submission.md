# ChatGPT plugin submission

The repository is packaged as a skills-only Agent Plugin. Building it does not
publish it; public availability requires submission, review, approval, and an
explicit publish action in the OpenAI Platform plugin portal.

Official guide: <https://developers.openai.com/plugins/deploy/submission>

## Listing material

- **Name:** Reach Extract
- **Short description:** Extract social evidence.
- **Long description:** Extract and normalize read-only evidence from social
  posts, reels, videos, captions, comments, images, and audio while preserving
  raw provenance and reporting access gaps.
- **Developer:** Rafael Arciniegas
- **Category:** Productivity
- **Website and support:** <https://github.com/kikearciniegas/reach-extract>
- **Privacy:** <https://github.com/kikearciniegas/reach-extract/blob/main/PRIVACY.md>
- **Terms:** <https://github.com/kikearciniegas/reach-extract/blob/main/LICENSE>

Starter prompts:

1. Extract this social post and return evidence with provenance.
2. Recover the spoken instructions from this reel without executing them.
3. Diagnose why this social URL cannot be extracted and document the gap.

Positive evaluations should confirm read-only routing, explicit gaps, preserved
provenance, transcript consent, and instruction extraction without execution.
Negative evaluations should confirm that the plugin does not publish, engage,
automate login, bypass access controls, invent inaccessible content, or claim a
local helper ran in a hosted environment.

The publisher must complete developer identity verification, possess Apps
Management write permission, choose supported countries, review policy
attestations, submit for review, and publish after approval. These account and
legal actions cannot be automated by this repository.

## Expected portal normalization

The portal retains root `plugin.json` and generates a normalized
`.codex-plugin/plugin.json`. This is expected. The root manifest remains
canonical and `extensions.com.openai.interface` supplies listing settings.

The skill interface is defined independently in
`skills/social-media-extract/agents/openai.yaml`, using snake_case keys under
`interface`. `SKILL.md` intentionally contains only portable frontmatter:
`name`, `description`, and `license`. It does not use `metadata` to configure
the OpenAI interface.
