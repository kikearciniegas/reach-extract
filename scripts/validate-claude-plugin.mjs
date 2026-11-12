#!/usr/bin/env node
// Copyright (c) 2026 Rafael Arciniegas

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageData = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const manifest = JSON.parse(readFileSync(path.join(root, ".claude-plugin", "plugin.json"), "utf8"));
const marketplace = JSON.parse(readFileSync(path.join(root, ".claude-plugin", "marketplace.json"), "utf8"));

assert.equal(manifest.name, "reach-extract");
assert.equal(manifest.displayName, "Reach Extract");
assert.equal(manifest.version, packageData.version);
assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
assert.ok(manifest.description?.trim());
assert.equal(manifest.author?.name, "Rafael Arciniegas");
assert.equal(manifest.license, "MIT");
assert.equal(manifest.skills, "./skills/");
for (const field of ["homepage", "repository"]) {
  assert.match(manifest[field], /^https:\/\//);
  assert.doesNotThrow(() => new URL(manifest[field]));
}
assert.ok(existsSync(path.join(root, "skills", "social-media-extract", "SKILL.md")));

assert.equal(marketplace.name, "reach-extract");
assert.equal(marketplace.version, packageData.version);
assert.equal(marketplace.owner?.name, manifest.author.name);
assert.equal(marketplace.plugins?.length, 1);
const [entry] = marketplace.plugins;
assert.equal(entry.name, manifest.name);
assert.equal(entry.displayName, manifest.displayName);
assert.equal(entry.version, manifest.version);
assert.equal(entry.source, "./");
assert.equal(entry.strict, true);
assert.equal(entry.repository, manifest.repository);
console.log("Claude plugin validation passed: reach-extract");
