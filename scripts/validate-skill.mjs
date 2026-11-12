// Copyright (c) 2026 Rafael Arciniegas

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skillRoot = path.join(root, "skills", "social-media-extract");
const skillPath = path.join(skillRoot, "SKILL.md");
const openAiPath = path.join(skillRoot, "agents", "openai.yaml");

assert.ok(existsSync(skillPath), "SKILL.md is missing");
const body = readFileSync(skillPath, "utf8");
assert.ok(body.startsWith("---\n"), "SKILL.md must start with YAML frontmatter");
const closing = body.indexOf("\n---\n", 4);
assert.ok(closing > 4, "SKILL.md frontmatter is not closed");

const frontmatter = body.slice(4, closing);
assert.match(frontmatter, /^name:\s*social-media-extract\s*$/m, "invalid skill name");
assert.match(frontmatter, /^description:\s*\S.{40,}$/m, "description must explain the skill and when to use it");
assert.match(frontmatter, /^license:\s*MIT\b/m, "skill must declare the MIT license");
assert.doesNotMatch(frontmatter, /^metadata:/m, "OpenAI interface settings belong in agents/openai.yaml");

assert.ok(existsSync(openAiPath), "agents/openai.yaml is missing");
const openAi = readFileSync(openAiPath, "utf8");
for (const key of ["display_name", "short_description", "default_prompt"]) {
  assert.match(openAi, new RegExp(`^\\s{2}${key}:\\s*\\S`, "m"), `interface.${key} is missing`);
}
assert.match(openAi, /^interface:\s*$/m, "agents/openai.yaml must define interface");

for (const relative of ["LICENSE", "NOTICE.md", "THIRD_PARTY_NOTICES.md", "scripts/reach-extract.mjs"]) {
  assert.ok(existsSync(path.join(skillRoot, relative)), `${relative} is missing`);
}

console.log("Skill validation passed: social-media-extract");
