#!/usr/bin/env node
// Copyright (c) 2026 Rafael Arciniegas

import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  const options = { out: path.join(root, "dist") };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--out") {
      if (!argv[index + 1]) throw new Error("--out requires a path");
      options.out = path.resolve(argv[++index]);
    } else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  return options;
}

function zip(cwd, output, entries) {
  const result = spawnSync("zip", ["-rq", output, ...entries, "-x", "*/.DS_Store"], {
    cwd, encoding: "utf8", shell: false,
  });
  if (result.error?.code === "ENOENT") throw new Error("zip is required to build desktop distributions");
  if (result.status !== 0) throw new Error(result.stderr.trim() || `zip exited ${result.status}`);
}

async function digest(filePath) {
  return createHash("sha256").update(await readFile(filePath)).digest("hex");
}

async function main() {
  const { out } = parseArgs(process.argv.slice(2));
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });

  const files = {
    "claude-skill": path.join(out, "reach-extract-claude-desktop.zip"),
    "claude-plugin": path.join(out, "reach-extract-claude-plugin.zip"),
    chatgpt: path.join(out, "reach-extract-chatgpt-plugin.zip"),
    gemini: path.join(out, "reach-extract-gemini-instructions.md"),
  };

  zip(path.join(root, "skills"), files["claude-skill"], ["social-media-extract"]);
  zip(root, files["claude-plugin"], [
    ".claude-plugin", "skills/social-media-extract", "assets", "README.md",
    "LICENSE", "NOTICE.md", "PRIVACY.md", "SECURITY.md", "THIRD_PARTY_NOTICES.md",
  ]);
  zip(root, files.chatgpt, [
    "plugin.json", ".codex-plugin", "skills/social-media-extract", "assets",
    "LICENSE", "NOTICE.md", "PRIVACY.md", "SECURITY.md", "THIRD_PARTY_NOTICES.md",
  ]);
  await copyFile(path.join(root, "adapters", "gemini", "GEM_INSTRUCTIONS.md"), files.gemini);

  const manifest = {
    version: JSON.parse(await readFile(path.join(root, "package.json"), "utf8")).version,
    generated_at: new Date().toISOString(),
    files: [],
  };
  for (const [target, filePath] of Object.entries(files)) {
    manifest.files.push({ target, file: path.basename(filePath), sha256: await digest(filePath) });
  }
  await writeFile(path.join(out, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify({ output: out, ...manifest }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
