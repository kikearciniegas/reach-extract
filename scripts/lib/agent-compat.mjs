// Copyright (c) 2026 Rafael Arciniegas

import { cp, lstat, mkdir, readlink, realpath, symlink } from "node:fs/promises";
import path from "node:path";

export const SKILL_NAME = "social-media-extract";

export const AGENT_GROUPS = Object.freeze({
  codex: "codex",
  claude: "claude",
  gemini: "universal",
  copilot: "universal",
  cursor: "universal",
  opencode: "universal",
  windsurf: "universal",
  devin: "universal",
});

export const SUPPORTED_AGENTS = Object.freeze(Object.keys(AGENT_GROUPS));

const RELATIVE_ROOTS = Object.freeze({
  universal: path.join(".agents", "skills"),
  codex: path.join(".codex", "skills"),
  claude: path.join(".claude", "skills"),
});

export function parseAgentSelection(value = "all") {
  const requested = value.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  const agents = requested.includes("all") ? [...SUPPORTED_AGENTS] : requested;
  const unknown = agents.filter((agent) => !(agent in AGENT_GROUPS));
  if (unknown.length) {
    throw new Error(`Unsupported agent(s): ${unknown.join(", ")}. Supported: ${SUPPORTED_AGENTS.join(", ")}`);
  }
  return [...new Set(agents)];
}

export function buildInstallPlan({ projectRoot, homeDir, scope = "project", agents = SUPPORTED_AGENTS }) {
  if (!projectRoot) throw new Error("projectRoot is required");
  if (scope !== "project" && scope !== "user") throw new Error("scope must be project or user");
  if (scope === "user" && !homeDir) throw new Error("homeDir is required for user scope");

  const source = path.resolve(projectRoot, "skills", SKILL_NAME);
  const base = scope === "project" ? path.resolve(projectRoot) : path.resolve(homeDir);
  const groups = [...new Set(agents.map((agent) => AGENT_GROUPS[agent]))];

  return groups.map((group) => ({
    group,
    agents: agents.filter((agent) => AGENT_GROUPS[agent] === group),
    source,
    target: path.join(base, RELATIVE_ROOTS[group], SKILL_NAME),
    scope,
  }));
}

async function statOrNull(filePath) {
  try {
    return await lstat(filePath);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function pointsToSource(target, source) {
  const stat = await statOrNull(target);
  if (!stat) return false;
  try {
    return (await realpath(target)) === (await realpath(source));
  } catch {
    if (!stat.isSymbolicLink()) return false;
    const link = await readlink(target);
    return path.resolve(path.dirname(target), link) === path.resolve(source);
  }
}

export async function inspectPlan(plan) {
  return Promise.all(plan.map(async (entry) => {
    const stat = await statOrNull(entry.target);
    if (!stat) return { ...entry, status: "missing" };
    if (await pointsToSource(entry.target, entry.source)) return { ...entry, status: "installed" };
    return { ...entry, status: "conflict" };
  }));
}

export async function installPlan(plan, { copy = false, dryRun = false } = {}) {
  const sourceSkill = path.join(plan[0]?.source ?? "", "SKILL.md");
  if (!(await statOrNull(sourceSkill))) throw new Error(`Canonical skill not found: ${sourceSkill}`);

  const inspected = await inspectPlan(plan);
  const conflicts = inspected.filter((entry) => entry.status === "conflict");
  if (conflicts.length) {
    throw new Error(`Refusing to overwrite existing path(s): ${conflicts.map((entry) => entry.target).join(", ")}`);
  }
  if (dryRun) return inspected;

  for (const entry of inspected) {
    if (entry.status === "installed") continue;
    await mkdir(path.dirname(entry.target), { recursive: true });
    if (copy) {
      await cp(entry.source, entry.target, { recursive: true, errorOnExist: true });
    } else {
      const linkTarget = entry.scope === "project"
        ? path.relative(path.dirname(entry.target), entry.source)
        : entry.source;
      await symlink(linkTarget, entry.target, process.platform === "win32" ? "junction" : "dir");
    }
    entry.status = "installed";
    entry.action = copy ? "copied" : "linked";
  }
  return inspected;
}
