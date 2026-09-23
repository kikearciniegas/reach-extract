// Copyright (c) 2026 Rafael Arciniegas

import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseOutput } from "./normalize.mjs";

export function run(command, args, { timeoutMs = 90_000, cwd } = {}) {
  return new Promise((resolve) => {
    const startedAt = new Date().toISOString();
    const started = Date.now();
    const child = spawn(command, args, { shell: false, env: process.env, cwd });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeoutMs);
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({ ok: false, code: null, stdout, stderr: `${stderr}${error.message}`, timed_out: timedOut, started_at: startedAt, duration_ms: Date.now() - started });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ ok: code === 0 && !timedOut, code, stdout, stderr, timed_out: timedOut, started_at: startedAt, duration_ms: Date.now() - started });
    });
  });
}

function safeName(index, label) {
  return `${String(index + 1).padStart(2, "0")}-${label.replace(/[^a-z0-9-]+/gi, "-").toLowerCase()}`;
}

export async function executePlan(plan, outDir, options = {}) {
  const rawDir = path.join(outDir, "raw");
  await mkdir(rawDir, { recursive: true });
  const outputs = [];
  for (const [index, item] of plan.steps.entries()) {
    const base = safeName(index, item.label);
    const args = item.args.map((value) => value.replaceAll("{OUTPUT_DIR}", outDir));
    const result = await run(item.command, args, { timeoutMs: options.timeoutMs });
    await Promise.all([
      writeFile(path.join(rawDir, `${base}.stdout`), result.stdout),
      writeFile(path.join(rawDir, `${base}.stderr`), result.stderr),
    ]);
    const data = parseOutput(result.stdout);
    const nonEmpty = data !== null && data !== "" && (!Array.isArray(data) || data.length > 0);
    outputs.push({ ...item, ...result, data, non_empty: nonEmpty });
  }
  return outputs;
}
