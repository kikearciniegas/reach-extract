// Copyright (c) 2026 Rafael Arciniegas

import test from "node:test";
import assert from "node:assert/strict";
import { normalize, parseOutput } from "../skills/social-media-extract/scripts/lib/normalize.mjs";

test("parses JSON and preserves plain text", () => {
  assert.deepEqual(parseOutput('{"title":"Hello"}'), { title: "Hello" });
  assert.equal(parseOutput("plain transcript"), "plain transcript");
  assert.equal(parseOutput("  "), null);
});

test("normalizes and deduplicates common evidence fields", () => {
  const outputs = [{
    ok: true,
    non_empty: true,
    label: "video",
    evidence: "post",
    data: {
      title: "Demo",
      description: "Useful caption",
      author: { username: "alice" },
      thumbnail_url: "https://example.com/thumb.jpg",
      view_count: 42,
      nested: { title: "Demo" },
    },
  }];
  const record = normalize(outputs, {
    runId: "run",
    platform: "youtube",
    url: "https://youtu.be/id",
    options: {},
  });
  assert.deepEqual(record.content.title, ["Demo"]);
  assert.deepEqual(record.content.text, ["Useful caption"]);
  assert.deepEqual(record.content.authors, ["alice"]);
  assert.deepEqual(record.content.media, ["https://example.com/thumb.jpg"]);
  assert.equal(record.content.metrics.view_count, 42);
  assert.deepEqual(record.gaps, []);
});

test("reports requested evidence gaps", () => {
  const record = normalize([], {
    runId: "run",
    platform: "instagram",
    url: "https://instagram.com/p/id",
    options: { comments: true, media: true, transcript: true },
  });
  assert.deepEqual(record.gaps, ["post", "comments", "media", "transcript"]);
});

test("classifies comment and transcript step text", () => {
  const record = normalize([
    { ok: true, non_empty: true, label: "comments", evidence: "comments", data: [{ text: "A reply" }] },
    { ok: true, non_empty: true, label: "transcript", evidence: "transcript", data: [{ content: "Spoken words" }] },
  ], {
    runId: "run",
    platform: "youtube",
    url: "https://youtu.be/id",
    options: { comments: true, transcript: true },
  });
  assert.deepEqual(record.content.comments, ["A reply"]);
  assert.deepEqual(record.content.transcript, ["Spoken words"]);
});

test("does not mistake transcript metadata titles for spoken words", () => {
  const record = normalize([
    { ok: true, non_empty: true, label: "transcript", evidence: "transcript", data: { title: "Episode title", status: "empty" } },
  ], {
    runId: "run",
    platform: "xiaoyuzhou",
    url: "https://example.com",
    options: { audio: true },
  });
  assert.deepEqual(record.content.title, ["Episode title"]);
  assert.deepEqual(record.content.transcript, []);
  assert.deepEqual(record.gaps, ["post", "transcript"]);
});
