// Copyright (c) 2026 Rafael Arciniegas

import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function markdownFiles(dir) {
  const result = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...markdownFiles(target));
    else if (entry.name.endsWith(".md")) result.push(target);
  }
  return result;
}

function filesWithExtension(dir, extension) {
  const result = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...filesWithExtension(target, extension));
    else if (entry.name.endsWith(extension)) result.push(target);
  }
  return result;
}

test("all local documentation links resolve", () => {
  const files = [
    path.join(root, "README.md"),
    path.join(root, "NOTICE.md"),
    path.join(root, "THIRD_PARTY_NOTICES.md"),
    ...markdownFiles(path.join(root, "docs")),
    ...markdownFiles(path.join(root, "skills", "social-media-extract")),
  ];
  const failures = [];
  const linkPattern = /!?(?:\[[^\]]*\])\(([^)]+)\)/g;
  for (const file of files) {
    const body = readFileSync(file, "utf8");
    for (const match of body.matchAll(linkPattern)) {
      const raw = match[1].trim().replace(/^<|>$/g, "");
      if (!raw || raw.startsWith("#") || /^(?:https?:|mailto:)/i.test(raw)) continue;
      const withoutFragment = raw.split("#", 1)[0];
      const target = path.resolve(path.dirname(file), decodeURIComponent(withoutFragment));
      if (!existsSync(target)) failures.push(`${path.relative(root, file)} -> ${raw}`);
    }
  }
  assert.deepEqual(failures, []);
});

test("built-in extraction help documents every public option", () => {
  const script = path.join(root, "skills", "social-media-extract", "scripts", "reach-extract.mjs");
  const result = spawnSync(process.execPath, [script, "--help"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  for (const option of [
    "--out", "--platform", "--comments", "--media", "--transcript", "--audio",
    "--instructions", "--provider", "--allow-provider-fallback", "--max-audio-items",
    "--timeout-ms", "--no-fallback", "--dry-run",
  ]) {
    assert.match(result.stdout, new RegExp(`(?:^|\\s)${option}(?:\\s|$)`), option);
  }
});

test("CLI reference documents extraction and installer options", () => {
  const reference = readFileSync(path.join(root, "docs", "cli-reference.md"), "utf8");
  const extraction = spawnSync(process.execPath, [
    path.join(root, "skills", "social-media-extract", "scripts", "reach-extract.mjs"),
    "--help",
  ], { encoding: "utf8" }).stdout;
  const installer = spawnSync(process.execPath, [
    path.join(root, "scripts", "install-agent-skill.mjs"),
    "--help",
  ], { encoding: "utf8" }).stdout;
  const options = new Set(`${extraction}\n${installer}`.match(/--[a-z][a-z-]*/g));
  for (const option of options) assert.ok(reference.includes(option), `${option} missing from CLI reference`);
});

test("authorship and copyright notices remain attached to distributable files", () => {
  const notice = "Copyright (c) 2026 Rafael Arciniegas";
  const packageMetadata = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
  assert.equal(packageMetadata.author, "Rafael Arciniegas");
  assert.equal(packageMetadata.license, "MIT");

  const skill = readFileSync(path.join(root, "skills", "social-media-extract", "SKILL.md"), "utf8");
  assert.match(skill, /Authored by Rafael Arciniegas/);
  const frontmatter = skill.slice(4, skill.indexOf("\n---\n", 4));
  assert.doesNotMatch(frontmatter, /^metadata:/m);
  assert.ok(skill.includes(notice));
  assert.ok(readFileSync(path.join(root, "NOTICE.md"), "utf8").includes(notice));
  assert.ok(readFileSync(path.join(root, "skills", "social-media-extract", "NOTICE.md"), "utf8").includes(notice));
  assert.match(readFileSync(path.join(root, "LICENSE"), "utf8"), /^MIT License/);
  assert.match(readFileSync(path.join(root, "skills", "social-media-extract", "LICENSE"), "utf8"), /^MIT License/);

  const thirdParty = readFileSync(path.join(root, "THIRD_PARTY_NOTICES.md"), "utf8");
  const skillThirdParty = readFileSync(path.join(root, "skills", "social-media-extract", "THIRD_PARTY_NOTICES.md"), "utf8");
  for (const component of ["Node.js", "Agent Reach", "OpenCLI", "bilibili-cli", "PyYAML", "Groq", "OpenAI"]) {
    assert.ok(thirdParty.includes(component), `${component} missing from root third-party notice`);
  }
  assert.match(thirdParty, /does not imply[\s\S]+endorsement/i);
  assert.match(thirdParty, /does not transfer ownership/i);
  assert.match(skillThirdParty, /respective owners/i);
  assert.match(skillThirdParty, /not legal advice/i);

  const sourceFiles = [
    path.join(root, "build_facebook_actions.py"),
    path.join(root, "extract_facebook_reels.mjs"),
    path.join(root, "index_facebook_reels.mjs"),
    path.join(root, "inspect_missing_reels.mjs"),
    ...filesWithExtension(path.join(root, "scripts"), ".mjs"),
    ...filesWithExtension(path.join(root, "skills", "social-media-extract", "scripts"), ".mjs"),
    ...filesWithExtension(path.join(root, "test"), ".mjs"),
  ];
  for (const file of sourceFiles) {
    assert.ok(readFileSync(file, "utf8").split("\n").slice(0, 3).join("\n").includes(notice), path.relative(root, file));
  }
});
