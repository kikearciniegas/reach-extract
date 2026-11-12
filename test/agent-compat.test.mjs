// Copyright (c) 2026 Rafael Arciniegas

import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  buildInstallPlan,
  installPlan,
  parseAgentSelection,
  SUPPORTED_AGENTS,
} from "../scripts/lib/agent-compat.mjs";

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "reach-agent-compat-"));
  const skill = path.join(root, "skills", "social-media-extract");
  await mkdir(skill, { recursive: true });
  await writeFile(path.join(skill, "SKILL.md"), "---\nname: social-media-extract\ndescription: test\n---\n");
  return root;
}

test("all supported agents collapse to three non-duplicating discovery paths", async () => {
  const root = await fixture();
  const plan = buildInstallPlan({
    projectRoot: root,
    homeDir: path.join(root, "home"),
    scope: "project",
    agents: parseAgentSelection("all"),
  });
  assert.equal(plan.length, 3);
  assert.deepEqual(new Set(plan.map((entry) => entry.group)), new Set(["universal", "codex", "claude"]));
  assert.deepEqual(parseAgentSelection("all"), [...SUPPORTED_AGENTS]);
});

test("project installation creates portable relative links and is idempotent", async () => {
  const root = await fixture();
  const plan = buildInstallPlan({ projectRoot: root, scope: "project", agents: parseAgentSelection("all") });
  const first = await installPlan(plan);
  assert.ok(first.every((entry) => entry.status === "installed"));
  for (const entry of first) {
    assert.equal(path.isAbsolute(await readlink(entry.target)), false);
  }
  const second = await installPlan(plan);
  assert.ok(second.every((entry) => entry.status === "installed" && !entry.action));
});

test("copy mode creates usable independent skill folders", async () => {
  const root = await fixture();
  const homeDir = path.join(root, "home");
  const plan = buildInstallPlan({
    projectRoot: root,
    homeDir,
    scope: "user",
    agents: parseAgentSelection("codex,gemini"),
  });
  const result = await installPlan(plan, { copy: true });
  assert.equal(result.length, 2);
  for (const entry of result) {
    assert.match(await readFile(path.join(entry.target, "SKILL.md"), "utf8"), /social-media-extract/);
  }
});

test("unknown agents and existing conflicting paths fail safely", async () => {
  assert.throws(() => parseAgentSelection("hal-9000"), /Unsupported agent/);
  const root = await fixture();
  const plan = buildInstallPlan({ projectRoot: root, scope: "project", agents: ["codex"] });
  await mkdir(plan[0].target, { recursive: true });
  await assert.rejects(() => installPlan(plan), /Refusing to overwrite/);
});
