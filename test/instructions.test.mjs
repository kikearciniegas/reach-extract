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

test("recognizes Spanish imperatives without a sequence cue", () => {
  const result = extractInstructions([
    { ok: true, evidence: "transcript", label: "asr", data: "Abre la aplicación. Configura tu cuenta. El cielo es azul." },
  ], { platform: "instagram", url: "https://www.instagram.com/reel/ABC/" });
  assert.deepEqual(result.steps.map((item) => item.text), ["Abre la aplicación.", "Configura tu cuenta."]);
  assert.equal(result.stats.candidates, 2);
});

const asr = (data) => [{ ok: true, evidence: "transcript", label: "asr", data }];
const reel = { platform: "instagram", url: "https://www.instagram.com/reel/ABC/" };
const UNSUPPORTED = "instructions: unsupported-language";

test("recognizes Spanish tú-form instructions spoken in a reel", () => {
  const result = extractInstructions(asr(
    "eliges uno de los modelos que te gusten, le das a copiar el prompt, te vas a la otra aplicación y le pegas todo el texto. Ahí ya te sale el resultado. Si lo quieres, comenta la palabra GUIA abajo.",
  ), reel);
  assert.ok(result.stats.candidates >= 1, `expected candidates, got ${result.stats.candidates}`);
  assert.equal(result.language, "es");
  assert.deepEqual(result.gaps, []);
});

test("matches Spanish instructions without accents and in any case", () => {
  const result = extractInstructions(asr("ELIGES UNO Y LE DAS A COPIAR. Despues suscribete al canal. Ve a la configuracion, dale a guardar."), reel);
  assert.equal(result.stats.candidates, 3);
});

test("still extracts the same instructions in English", () => {
  const result = extractInstructions(asr(
    "Pick one of the models you like, hit copy prompt, go to the other app and paste all the text. The result shows up right there. If you want it, comment the word GUIDE below.",
  ), reel);
  assert.ok(result.stats.candidates >= 1, `expected candidates, got ${result.stats.candidates}`);
  assert.equal(result.language, "en");
  assert.deepEqual(result.gaps, []);
});

test("Spanish narrative yields zero candidates and no language gap", () => {
  const result = extractInstructions(asr(
    "Ayer fuimos a la playa con mis primos. El agua estaba muy fría y el cielo tenía un color precioso. Mi abuela nos contó historias de cuando era joven, y todos nos reímos mucho.",
  ), reel);
  assert.equal(result.language, "es");
  assert.equal(result.stats.candidates, 0);
  assert.deepEqual(result.gaps, []);
});

test("reports an unsupported-language gap instead of a clean zero", () => {
  for (const text of [
    "Primeiro você escolhe um modelo, depois copia o prompt e cola na outra aplicação. Comente a palavra GUIA para receber o link.",
    "Choisis un modèle, puis copie le prompt et colle-le dans l'autre application. Commente le mot GUIDE pour recevoir le lien.",
  ]) {
    const result = extractInstructions(asr(text), reel);
    assert.ok(result.language && !["es", "en"].includes(result.language), `language: ${result.language}`);
    assert.deepEqual(result.gaps, [UNSUPPORTED]);
  }
});

test("empty transcripts record no language gap", () => {
  const result = extractInstructions([], reel);
  assert.equal(result.basis, "none");
  assert.deepEqual(result.gaps, []);
});
