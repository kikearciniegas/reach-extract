// Copyright (c) 2026 Rafael Arciniegas

import test from "node:test";
import assert from "node:assert/strict";
import { buildPlan, detectPlatform } from "../skills/social-media-extract/scripts/lib/platforms.mjs";

const cases = [
  ["https://www.xiaohongshu.com/explore/abc?xsec_token=t", "xiaohongshu"],
  ["https://x.com/example/status/123", "twitter"],
  ["https://www.bilibili.com/video/BV1abc123", "bilibili"],
  ["https://www.v2ex.com/t/123456", "v2ex"],
  ["https://www.reddit.com/r/test/comments/abc123/title/", "reddit"],
  ["https://www.facebook.com/reel/123", "facebook"],
  ["https://www.instagram.com/reel/ABC/", "instagram"],
  ["https://youtu.be/abcdefghijk", "youtube"],
  ["https://www.xiaoyuzhoufm.com/episode/abc", "xiaoyuzhou"],
  ["https://www.linkedin.com/posts/example", "linkedin"],
  ["https://xueqiu.com/123/456", "xueqiu"],
];

test("detects supported platform URLs", () => {
  for (const [url, expected] of cases) assert.equal(detectPlatform(url).platform.name, expected);
});

test("builds read-only platform plans", () => {
  for (const [url] of cases) {
    const plan = buildPlan(url, { comments: true, media: true, transcript: true });
    assert.ok(plan.steps.length > 0);
    for (const item of plan.steps) {
      assert.ok(new Set(["opencli", "bili"]).has(item.command));
      if (item.command === "opencli") {
        assert.equal(item.args.at(-2), "-f");
        assert.equal(item.args.at(-1), "json");
      }
      assert.doesNotMatch(item.args.join(" "), /\b(?:login|post|publish|like|follow|comment)\b/i);
    }
  }
});

test("extracts stable identifiers", () => {
  const reddit = buildPlan("https://www.reddit.com/r/test/comments/abc123/title/", { fallback: false });
  assert.equal(reddit.steps[0].args[2], "abc123");
  const v2ex = buildPlan("https://www.v2ex.com/t/123456", { comments: true, fallback: false });
  assert.equal(v2ex.steps[0].args[2], "123456");
  const podcast = buildPlan("https://www.xiaoyuzhoufm.com/episode/episode123", { fallback: false });
  assert.equal(podcast.steps[0].args[2], "episode123");
});

test("uses the web adapter's named URL option", () => {
  const instagram = buildPlan("https://www.instagram.com/reel/ABC/", { fallback: false });
  assert.deepEqual(instagram.steps[0].args.slice(0, 4), ["web", "read", "--url", "https://www.instagram.com/reel/ABC/"]);
});

test("audio mode adds platform media download steps", () => {
  for (const url of [
    "https://www.xiaohongshu.com/explore/abc?xsec_token=t",
    "https://x.com/example/status/123",
    "https://www.instagram.com/reel/ABC/",
    "https://www.xiaoyuzhoufm.com/episode/episode123",
  ]) {
    const plan = buildPlan(url, { audio: true, fallback: false });
    assert.ok(plan.steps.some((item) => item.evidence === "media"));
  }
});
