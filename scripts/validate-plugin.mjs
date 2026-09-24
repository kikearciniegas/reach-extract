// Copyright (c) 2026 Rafael Arciniegas

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageData = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const portable = JSON.parse(readFileSync(path.join(root, "plugin.json"), "utf8"));
const overlay = JSON.parse(readFileSync(path.join(root, ".codex-plugin", "plugin.json"), "utf8"));

for (const manifest of [portable, overlay]) {
  assert.equal(manifest.name, "reach-extract");
  assert.equal(manifest.version, packageData.version);
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
  assert.ok(manifest.description?.trim());
  assert.ok(manifest.author?.name?.trim());
}

assert.equal(portable.$schema, "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json");
const ui = portable.extensions?.["com.openai"]?.interface;
for (const field of ["displayName", "shortDescription", "longDescription", "developerName", "category"]) {
  assert.ok(ui?.[field]?.trim(), `missing interface.${field}`);
}
assert.ok(ui.displayName.length <= 30);
assert.ok(ui.shortDescription.length <= 30);
assert.ok(ui.developerName.length <= 80);
for (const field of ["websiteURL", "privacyPolicyURL", "termsOfServiceURL"]) {
  assert.doesNotThrow(() => new URL(ui[field]));
  assert.match(ui[field], /^https:\/\//);
  assert.ok(ui[field].length <= 1024);
}
assert.ok(Array.isArray(ui.defaultPrompt) && ui.defaultPrompt.length >= 1 && ui.defaultPrompt.length <= 3);
for (const prompt of ui.defaultPrompt) assert.ok(prompt.length <= 128);
for (const relative of [ui.composerIcon, ui.logo]) {
  assert.ok(relative.startsWith("./assets/"));
  assert.ok(existsSync(path.join(root, relative)), `missing asset: ${relative}`);
}
assert.equal(overlay.skills, "./skills/");
assert.equal(overlay.interface.displayName, ui.displayName);
console.log("Plugin validation passed: reach-extract");
