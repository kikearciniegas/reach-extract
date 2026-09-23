// Copyright (c) 2026 Rafael Arciniegas

import test from "node:test";
import assert from "node:assert/strict";
import { extractInstructions, transcriptSegments } from "../skills/social-media-extract/scripts/lib/instructions.mjs";

const transcriptOutput = [{
  ok: true,
  evidence: "transcript",
  label: "subtitle",
  data: [
    { from: 1.2, to: 4.8, content: "First, install the package." },
    { from: 5, to: 9, content: "Then run `npm test`. Do not commit secrets." },
    { from: 10, to: 12, content: "The sky is blue." },
  ],
}];

test("retains transcript timing and provenance", () => {
  const segments = transcriptSegments(transcriptOutput);
  assert.equal(segments[0].start, 1.2);
  assert.equal(segments[0].end, 4.8);
  assert.equal(segments[0].source_step, "subtitle");
});

test("extracts evidence-linked instructions without inventing prose", () => {
  const result = extractInstructions(transcriptOutput, { platform: "youtube", url: "https://youtu.be/id" });
  assert.equal(result.basis, "transcript");
  assert.equal(result.steps.length, 1);
  assert.equal(result.commands.length, 1);
  assert.equal(result.warnings.length, 1);
  assert.equal(result.steps[0].text, "First, install the package.");
  assert.equal(result.steps[0].evidence.quote, result.steps[0].text);
  assert.equal(result.stats.candidates, 3);
});

test("returns an empty evidence set for non-instructional speech", () => {
  const result = extractInstructions([{ ok: true, evidence: "transcript", label: "asr", data: "The sky is blue." }], { platform: "test", url: "https://example.com" });
  assert.equal(result.basis, "transcript");
  assert.equal(result.stats.candidates, 0);
});

test("keeps unpunctuated transcript lines as separate instructions", () => {
  const result = extractInstructions([
    { ok: true, evidence: "transcript", label: "asr", data: "Install the package\nRun npm test" },
  ], { platform: "test", url: "https://example.com" });
  assert.equal(result.steps.length, 1);
  assert.equal(result.commands.length, 1);
});

test("splits procedural clauses merged by ASR punctuation", () => {
  const result = extractInstructions([
    { ok: true, evidence: "transcript", label: "groq-asr", data: "First, install the package, then run npm test. Do not commit secrets." },
  ], { platform: "fixture", url: "local://speech.aiff" });
  assert.equal(result.steps.length, 1);
  assert.equal(result.steps[0].text, "First, install the package.");
  assert.equal(result.commands.length, 1);
  assert.equal(result.commands[0].text.toLowerCase(), "then run npm test.");
  assert.equal(result.warnings.length, 1);
});
