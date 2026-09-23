#!/usr/bin/env node
// Copyright (c) 2026 Rafael Arciniegas
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildPlan, PLATFORMS } from "./lib/platforms.mjs";
import { normalize, parseOutput } from "./lib/normalize.mjs";
import { executePlan, run } from "./lib/runner.mjs";
import { runAudioFallback } from "./lib/audio.mjs";
import { extractInstructions } from "./lib/instructions.mjs";

function usage() {
  return `Usage:
  reach-extract.mjs doctor
  reach-extract.mjs platforms
  reach-extract.mjs plan URL [options]
  reach-extract.mjs extract URL [options]

Options:
  --out DIR                       Output root (extract only; default: output)
  --platform NAME                 Override URL-based platform detection
  --comments                      Request comments or replies where supported
  --media                         Request downloaded media where supported
  --transcript                    Mark transcript evidence as requested
  --audio                         Authorize ASR when platform transcript is empty
  --instructions                  Write evidence-linked instructions.json
  --provider auto|groq|openai     ASR provider (default: auto)
  --allow-provider-fallback       Allow auto ASR to try another configured provider
  --max-audio-items N             Transcribe 1-20 downloaded items (default: 5)
  --timeout-ms N                  Per-step timeout in milliseconds (default: 90000)
  --no-fallback                   Disable generic web page fallback
  --dry-run                       Print the plan without extracting
`;
}

function parseArgs(argv) {
  const command = argv[0];
  const positional = [];
  const options = { fallback: true, out: "output", timeoutMs: 90_000 };
  for (let i = 1; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--comments") options.comments = true;
    else if (arg === "--media") options.media = true;
    else if (arg === "--transcript") options.transcript = true;
    else if (arg === "--audio") options.audio = true;
    else if (arg === "--instructions") options.instructions = true;
    else if (arg === "--allow-provider-fallback") options.allowProviderFallback = true;
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--no-fallback") options.fallback = false;
    else if (arg === "--out" || arg === "--platform" || arg === "--timeout-ms" || arg === "--provider" || arg === "--max-audio-items") {
      const value = argv[++i];
      if (!value) throw new Error(`${arg} requires a value`);
      if (arg === "--out") options.out = value;
      else if (arg === "--platform") options.platform = value;
      else if (arg === "--provider") {
        if (!new Set(["auto", "groq", "openai"]).has(value)) throw new Error(`Invalid provider: ${value}`);
        options.provider = value;
      } else if (arg === "--max-audio-items") {
        options.maxAudioItems = Number(value);
        if (!Number.isInteger(options.maxAudioItems) || options.maxAudioItems < 1 || options.maxAudioItems > 20) throw new Error("--max-audio-items must be an integer from 1 to 20");
      } else {
        options.timeoutMs = Number(value);
        if (!Number.isFinite(options.timeoutMs) || options.timeoutMs < 1) throw new Error("--timeout-ms must be a positive number");
      }
    } else if (arg.startsWith("--")) throw new Error(`Unknown option: ${arg}`);
    else positional.push(arg);
  }
  return { command, positional, options };
}

function publicStep(item) {
  return { label: item.label, evidence: item.evidence, required: item.required, command: [item.command, ...item.args] };
}

function postprocessPlan(options) {
  return [
    ...(options.audio ? [{
      label: "audio-fallback",
      when: "platform transcript/subtitle evidence is empty",
      command: ["agent-reach", "transcribe", "<URL_OR_DOWNLOADED_MEDIA>", "--provider", options.provider ?? "auto"],
      cross_provider_fallback: Boolean(options.allowProviderFallback),
    }] : []),
    ...(options.instructions ? [{
      label: "instruction-extraction",
      when: "transcript evidence exists",
      command: ["local", "extract-evidence-linked-instructions"],
    }] : []),
  ];
}

function runId() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function doctor() {
  const [reach, opencli] = await Promise.all([
    run("agent-reach", ["doctor", "--json"], { timeoutMs: 60_000 }),
    run("opencli", ["doctor"], { timeoutMs: 60_000 }),
  ]);
  const opencliText = `${opencli.stdout}\n${opencli.stderr}`;
  const opencliHealthy = opencli.ok && !/\[(?:FAIL|MISSING)\]/.test(opencliText);
  const result = {
    agent_reach: { ok: reach.ok, data: parseOutput(reach.stdout), error: reach.stderr.trim() || null },
    opencli: { ok: opencliHealthy, output: opencli.stdout.trim(), error: opencli.stderr.trim() || null },
  };
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = reach.ok && opencliHealthy ? 0 : 1;
}

async function main() {
  const { command, positional, options } = parseArgs(process.argv.slice(2));
  if (!command || command === "help" || command === "--help") {
    console.log(usage());
    return;
  }
  if (command === "doctor") return doctor();
  if (command === "platforms") {
    console.log(JSON.stringify(PLATFORMS.map(({ name, hosts, capabilities }) => ({ name, hosts, capabilities })), null, 2));
    return;
  }
  if (command !== "plan" && command !== "extract") throw new Error(`Unknown command: ${command}`);
  const input = positional[0];
  if (!input) throw new Error(`${command} requires a URL`);
  const plan = buildPlan(input, options);
  if (command === "plan" || options.dryRun) {
    console.log(JSON.stringify({ ...plan, steps: plan.steps.map(publicStep), postprocess: postprocessPlan(options) }, null, 2));
    return;
  }

  const id = runId();
  const outDir = path.resolve(options.out, `${id}-${plan.platform}`);
  await mkdir(outDir, { recursive: true });
  let outputs = await executePlan(plan, outDir, options);
  let record = normalize(outputs, { runId: id, platform: plan.platform, url: plan.url, options });
  if (options.audio && record.content.transcript.length === 0) {
    const audioOutputs = await runAudioFallback({ platform: plan.platform, url: plan.url, outDir, options, startIndex: outputs.length });
    outputs = [...outputs, ...audioOutputs];
    record = normalize(outputs, { runId: id, platform: plan.platform, url: plan.url, options });
  }
  const instructions = options.instructions
    ? extractInstructions(outputs, { platform: plan.platform, url: plan.url })
    : null;
  const manifest = {
    schema_version: "0.1.0",
    run_id: id,
    request: { url: plan.url, platform: plan.platform, options },
    steps: outputs.map((item) => ({
      ...publicStep(item),
      ok: item.ok,
      non_empty: item.non_empty,
      exit_code: item.code,
      timed_out: item.timed_out,
      started_at: item.started_at,
      duration_ms: item.duration_ms,
      error: item.stderr.trim() || null,
    })),
  };
  await Promise.all([
    writeFile(path.join(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`),
    writeFile(path.join(outDir, "record.json"), `${JSON.stringify(record, null, 2)}\n`),
    writeFile(path.join(outDir, "evidence.jsonl"), record.evidence.map((item) => JSON.stringify(item)).join("\n") + (record.evidence.length ? "\n" : "")),
    ...(instructions ? [writeFile(path.join(outDir, "instructions.json"), `${JSON.stringify(instructions, null, 2)}\n`)] : []),
  ]);
  const requiredFailure = outputs.some((item) => item.required && (!item.ok || !item.non_empty));
  console.log(JSON.stringify({
    ok: !requiredFailure,
    output: outDir,
    platform: plan.platform,
    evidence: record.evidence.length,
    instructions: instructions?.stats.candidates ?? null,
    gaps: record.gaps,
  }, null, 2));
  if (requiredFailure) process.exitCode = 2;
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
