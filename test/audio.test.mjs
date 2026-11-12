// Copyright (c) 2026 Rafael Arciniegas

import test from "node:test";
import assert from "node:assert/strict";
import { bilibiliAudioArgs, transcribeArgs } from "../skills/social-media-extract/scripts/lib/audio.mjs";

test("transcription uses one provider by default", () => {
  assert.deepEqual(transcribeArgs("clip.mp4", "out.txt", {}), [
    "transcribe", "clip.mp4", "--provider", "auto", "-o", "out.txt",
  ]);
});

test("cross-provider fallback is explicit", () => {
  assert.deepEqual(transcribeArgs("clip.mp4", "out.txt", { provider: "groq", allowProviderFallback: true }), [
    "transcribe", "clip.mp4", "--provider", "groq", "-o", "out.txt", "--allow-provider-fallback",
  ]);
});

test("Bilibili audio is downloaded once into the evidence bundle", () => {
  assert.deepEqual(bilibiliAudioArgs("https://www.bilibili.com/video/BV1abc123", "/tmp/bundle/media"), [
    "audio", "BV1abc123", "--no-split", "-o", "/tmp/bundle/media",
  ]);
});
