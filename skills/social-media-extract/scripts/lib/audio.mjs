// Copyright (c) 2026 Rafael Arciniegas

import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { run } from "./runner.mjs";

const MEDIA_EXTENSIONS = new Set([
  ".aac", ".aif", ".aiff", ".flac", ".m4a", ".mp3", ".mp4", ".mpeg", ".mov", ".ogg",
  ".opus", ".wav", ".webm", ".mkv",
]);

async function mediaFiles(root) {
  const found = [];
  async function walk(dir) {
    let entries;
    try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const target = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(target);
      else if (MEDIA_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) found.push(target);
    }
  }
  await walk(root);
  return found.sort();
}

function rawBase(index, label) {
  return `${String(index + 1).padStart(2, "0")}-${label}`;
}

async function saveRaw(rawDir, index, label, result) {
  const base = rawBase(index, label);
  await Promise.all([
    writeFile(path.join(rawDir, `${base}.stdout`), result.stdout ?? ""),
    writeFile(path.join(rawDir, `${base}.stderr`), result.stderr ?? ""),
  ]);
}

function bilibiliTarget(url) {
  return url.match(/BV[0-9A-Za-z]+/)?.[0] ?? url;
}

export function bilibiliAudioArgs(url, mediaDir) {
  return ["audio", bilibiliTarget(url), "--no-split", "-o", mediaDir];
}

export function transcribeArgs(source, output, options = {}) {
  const args = ["transcribe", source, "--provider", options.provider ?? "auto", "-o", output];
  if (options.allowProviderFallback) args.push("--allow-provider-fallback");
  return args;
}

export async function runAudioFallback({ platform, url, outDir, options, startIndex = 0 }) {
  const rawDir = path.join(outDir, "raw");
  const mediaDir = path.join(outDir, "media");
  const transcriptDir = path.join(outDir, "transcript");
  await Promise.all([mkdir(rawDir, { recursive: true }), mkdir(mediaDir, { recursive: true }), mkdir(transcriptDir, { recursive: true })]);

  const operations = [];
  if (platform === "bilibili") {
    const prepArgs = bilibiliAudioArgs(url, mediaDir);
    const prep = await run("bili", prepArgs, { timeoutMs: Math.max(options.timeoutMs ?? 90_000, 300_000) });
    await saveRaw(rawDir, startIndex + operations.length, "bilibili-audio", prep);
    operations.push({
      label: "bilibili-audio",
      evidence: "media",
      command: "bili",
      args: prepArgs,
      required: false,
      ...prep,
      data: prep.ok ? prep.stdout.trim() || null : null,
      non_empty: prep.ok && Boolean(prep.stdout.trim()),
    });
  }

  let sources = platform === "youtube" ? [url] : await mediaFiles(mediaDir);
  sources = sources.slice(0, options.maxAudioItems ?? 5);
  if (sources.length === 0) {
    const message = `No transcribable audio/video source was downloaded for ${platform}.`;
    const empty = { ok: false, code: null, stdout: "", stderr: message, timed_out: false, started_at: new Date().toISOString(), duration_ms: 0 };
    await saveRaw(rawDir, startIndex + operations.length, "audio-source", empty);
    operations.push({ label: "audio-source", evidence: "transcript", command: "agent-reach", args: [], required: false, ...empty, data: null, non_empty: false });
    return operations;
  }

  for (const [index, source] of sources.entries()) {
    const output = path.join(transcriptDir, `asr-${String(index + 1).padStart(2, "0")}.txt`);
    const args = transcribeArgs(source, output, options);
    const result = await run("agent-reach", args, { timeoutMs: Math.max(options.timeoutMs ?? 90_000, 600_000) });
    let transcript = "";
    try { transcript = await readFile(output, "utf8"); } catch {}
    await saveRaw(rawDir, startIndex + operations.length, `audio-transcript-${index + 1}`, { ...result, stdout: transcript || result.stdout });
    operations.push({
      label: `audio-transcript-${index + 1}`,
      evidence: "transcript",
      command: "agent-reach",
      args,
      required: false,
      ...result,
      stdout: transcript || result.stdout,
      stderr: result.stderr || (!result.ok ? result.stdout.trim() : ""),
      data: transcript || null,
      non_empty: Boolean(transcript.trim()),
    });
  }
  return operations;
}
