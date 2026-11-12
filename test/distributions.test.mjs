// Copyright (c) 2026 Rafael Arciniegas

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8", ...options });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout;
}

function archiveEntries(archive) {
  return run("unzip", ["-Z1", archive]).trim().split("\n").filter(Boolean);
}

test("desktop distributions contain the expected portable layouts", () => {
  const out = mkdtempSync(path.join(os.tmpdir(), "reach-extract-distributions-"));
  try {
    run(process.execPath, ["scripts/build-distributions.mjs", "--out", out]);
    const packageData = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
    const manifest = JSON.parse(readFileSync(path.join(out, "manifest.json"), "utf8"));
    assert.equal(manifest.version, packageData.version);
    assert.deepEqual(manifest.files.map(({ target }) => target), [
      "claude-skill", "claude-plugin", "chatgpt", "gemini",
    ]);
    for (const entry of manifest.files) {
      const body = readFileSync(path.join(out, entry.file));
      assert.equal(createHash("sha256").update(body).digest("hex"), entry.sha256);
    }

    const skillEntries = archiveEntries(path.join(out, "reach-extract-claude-desktop.zip"));
    assert.ok(skillEntries.includes("social-media-extract/SKILL.md"));
    assert.ok(skillEntries.includes("social-media-extract/agents/openai.yaml"));
    assert.ok(skillEntries.includes("social-media-extract/references/platforms.md"));
    assert.ok(skillEntries.every((entry) => entry.startsWith("social-media-extract/")));

    const claudeEntries = archiveEntries(path.join(out, "reach-extract-claude-plugin.zip"));
    for (const expected of [
      ".claude-plugin/plugin.json", ".claude-plugin/marketplace.json",
      "skills/social-media-extract/SKILL.md", "skills/social-media-extract/scripts/reach-extract.mjs",
      "LICENSE", "PRIVACY.md",
    ]) assert.ok(claudeEntries.includes(expected), `Claude plugin archive is missing ${expected}`);

    const pluginEntries = archiveEntries(path.join(out, "reach-extract-chatgpt-plugin.zip"));
    for (const expected of [
      "plugin.json", ".codex-plugin/plugin.json", "skills/social-media-extract/SKILL.md",
      "skills/social-media-extract/agents/openai.yaml", "assets/reach-extract-logo.svg",
    ]) assert.ok(pluginEntries.includes(expected), `plugin archive is missing ${expected}`);

    const gemini = readFileSync(path.join(out, "reach-extract-gemini-instructions.md"), "utf8");
    assert.match(gemini, /cannot be assumed to run this project's local Agent Reach/i);
    assert.match(gemini, /Never claim those tools ran/i);
    assert.match(gemini, /ask the user to paste or upload/i);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});
