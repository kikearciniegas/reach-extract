// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Rafael Arciniegas

// This repo's own workflows (.github/workflows/*.yml), per the ci-flow design:
// every check in .github/required-checks.json is a job of a workflow that every
// pull request runs, with no job-level if: and no workflow-level paths filter, so
// it reports on every PR event; and node-version is one exact x.y.z everywhere
// (never `latest` or a bare major, which turn CI red on a release with no change
// in the tree). Each rule has a negative control, caught by its reason.

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, ".github", "workflows");
const WORKFLOWS = Object.fromEntries(
  readdirSync(dir).filter((f) => /\.ya?ml$/.test(f)).map((f) => [f, readFileSync(path.join(dir, f), "utf8")]),
);
const REQUIRED = JSON.parse(readFileSync(path.join(root, ".github", "required-checks.json"), "utf8"));

// shortcut: a line reader for the block-style YAML these workflows use (top-level keys
// at column 0, events and job ids at 2, their keys at 4); use a YAML parser if a
// workflow ever writes `on:` or `jobs:` in flow style.
function section(text, key) {
  const lines = text.split("\n");
  const start = lines.indexOf(`${key}:`);
  if (start < 0) return [];
  const end = lines.findIndex((l, i) => i > start && /^\S/.test(l));
  return lines.slice(start + 1, end < 0 ? undefined : end);
}
function children(lines) {
  const out = {};
  let cur;
  for (const l of lines) {
    const m = /^ {2}([\w-]+):/.exec(l);
    if (m) out[(cur = m[1])] = [];
    else if (cur && /^ {4}/.test(l)) out[cur].push(l);
  }
  return out;
}
const unquote = (s) => s.trim().replace(/^(["'])(.*)\1$/, "$2");

function problems(workflows, required) {
  const out = [];
  const jobs = [];
  for (const [file, text] of Object.entries(workflows)) {
    const on = children(section(text, "on"));
    for (const [ev, body] of Object.entries(on)) {
      if (body.some((l) => /^ {4}paths(-ignore)?:/.test(l))) out.push(`${file}: ${ev} has a workflow-level paths filter`);
    }
    const types = (on.pull_request ?? []).find((l) => /^ {4}types:/.test(l));
    if (types && !["opened", "synchronize", "reopened"].every((t) => types.includes(t))) out.push(`${file}: pull_request types miss opened/synchronize/reopened`);
    for (const [id, body] of Object.entries(children(section(text, "jobs")))) {
      const name = body.find((l) => /^ {4}name:/.test(l));
      jobs.push({ file, id, name: name ? unquote(name.replace(/^ {4}name:/, "")) : id, gated: body.some((l) => /^ {4}if:/.test(l)), pr: "pull_request" in on });
    }
  }
  for (const r of required) {
    const job = jobs.find((j) => j.pr && (j.name === r || j.id === r));
    if (!job) out.push(`required check ${r} is not a job of a pull_request workflow`);
    else if (job.gated) out.push(`required check ${r} has an if:`);
  }
  const pins = Object.values(workflows).flatMap((t) => [...t.matchAll(/node-version:\s*["']?([^"'\s#]+)/g)].map((m) => m[1]));
  if (!pins.length) out.push("no node-version pin");
  for (const v of new Set(pins)) if (!/^\d+\.\d+\.\d+$/.test(v)) out.push(`node-version ${v} is not exact (latest / a bare major drift)`);
  if (new Set(pins).size > 1) out.push(`node-version has ${new Set(pins).size} different pins`);
  return out;
}

const mut = (file, from, to) => {
  const text = WORKFLOWS[file].replace(from, to);
  if (text === WORKFLOWS[file]) throw new Error(`control matched nothing in ${file}: ${from}`);
  return { ...WORKFLOWS, [file]: text };
};

test("required checks report on every PR event; node pinned exactly", () => {
  assert.deepEqual(problems(WORKFLOWS, REQUIRED), []);
  assert.ok(REQUIRED.length > 0);
});

const controls = [
  ["node latest", mut("ci.yml", /node-version: "[^"]+"/, 'node-version: "latest"'), REQUIRED, /node-version latest is not exact/],
  ["node bare major", mut("ci.yml", /node-version: "[^"]+"/, 'node-version: "20"'), REQUIRED, /node-version 20 is not exact/],
  ["two node pins", mut("release.yml", /node-version: "[^"]+"/, 'node-version: "20.0.0"'), REQUIRED, /node-version has 2 different pins/],
  ["paths filter", mut("ci.yml", "  pull_request:\n", "  pull_request:\n    paths: ['skills/**']\n"), REQUIRED, /ci\.yml: pull_request has a workflow-level paths filter/],
  ["types without synchronize", mut("ci.yml", "  pull_request:\n", "  pull_request:\n    types: [opened]\n"), REQUIRED, /ci\.yml: pull_request types miss/],
  ["required job gated", mut("ci.yml", "    name: Test\n", "    name: Test\n    if: github.event_name == 'push'\n"), REQUIRED, /required check Test has an if:/],
  ["required job's workflow not run on PRs", mut("ci.yml", /\n {2}pull_request:\n {4}branches: \[main\]/, ""), REQUIRED, /required check Test is not a job of a pull_request workflow/],
  ["required job missing", WORKFLOWS, [...REQUIRED, "nope"], /required check nope is not a job/],
];
for (const [label, workflows, required, reason] of controls) {
  test(`control caught: ${label}`, () => {
    assert.ok(problems(workflows, required).some((p) => reason.test(p)), problems(workflows, required).join("; ") || "no problem found");
  });
}
