// Copyright (c) 2026 Rafael Arciniegas

const hostMatches = (host, suffixes) =>
  suffixes.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));

const step = (label, evidence, args, required = false) => ({
  label,
  evidence,
  command: "opencli",
  args: [...args, "-f", "json"],
  required,
});

const cliStep = (label, evidence, command, args, required = false) => ({
  label,
  evidence,
  command,
  args,
  required,
});

function redditId(url) {
  const match = url.pathname.match(/\/comments\/([a-z0-9]+)/i);
  if (match) return match[1];
  if (url.hostname === "redd.it") return url.pathname.split("/").filter(Boolean)[0];
  return null;
}

function v2exId(url) {
  return url.pathname.match(/^\/t\/(\d+)/)?.[1] ?? null;
}

function bilibiliTarget(url) {
  return url.href.match(/BV[0-9A-Za-z]+/)?.[0] ?? url.href;
}

function xiaoyuzhouId(url) {
  return url.pathname.match(/\/episode\/([^/?#]+)/)?.[1] ?? url.pathname.split("/").filter(Boolean).at(-1);
}

function webRead(url) {
  return ["web", "read", "--url", url.href, "--stdout", "true", "--download-images", "false"];
}

function isInstagramProfileUrl(url) {
  const segments = url.pathname.split("/").filter(Boolean);
  return segments.length === 1 || (
    segments.length === 2 && new Set(["reels", "tagged"]).has(segments[1].toLowerCase())
  );
}

export const PLATFORMS = [
  {
    name: "xiaohongshu",
    hosts: ["xiaohongshu.com", "xhslink.com"],
    capabilities: ["text", "caption", "comments", "image", "video"],
    buildSteps: (url, o) => [
      step("note", "post", ["xiaohongshu", "note", url.href], true),
      ...(o.comments ? [step("comments", "comments", ["xiaohongshu", "comments", url.href])] : []),
      ...(o.media || o.audio ? [step("media", "media", ["xiaohongshu", "download", url.href, "--output", "{OUTPUT_DIR}/media"])] : []),
    ],
  },
  {
    name: "twitter",
    hosts: ["x.com", "twitter.com"],
    capabilities: ["text", "article", "comments", "image", "video"],
    buildSteps: (url, o) => [
      step("thread", "post", ["twitter", "thread", url.href], true),
      ...(o.media || o.audio ? [step("media", "media", ["twitter", "download", "--tweet-url", url.href, "--output", "{OUTPUT_DIR}/media"])] : []),
    ],
  },
  {
    name: "bilibili",
    hosts: ["bilibili.com", "b23.tv"],
    capabilities: ["text", "caption", "video", "audio", "transcript"],
    buildSteps: (url, o) => {
      const target = bilibiliTarget(url);
      return [
        step("opencli-video", "post", ["bilibili", "video", target]),
        cliStep("bili-video", "post", "bili", ["video", target], true),
        step("subtitle", "transcript", ["bilibili", "subtitle", target]),
      ];
    },
  },
  {
    name: "v2ex",
    hosts: ["v2ex.com"],
    capabilities: ["text", "comments"],
    buildSteps: (url, o) => {
      const id = v2exId(url) ?? url.href;
      return [
        step("topic", "post", ["v2ex", "topic", id], true),
        ...(o.comments ? [step("replies", "comments", ["v2ex", "replies", id])] : []),
      ];
    },
  },
  {
    name: "reddit",
    hosts: ["reddit.com", "redd.it"],
    capabilities: ["text", "comments", "image", "video"],
    buildSteps: (url) => [step("read", "post", ["reddit", "read", redditId(url) ?? url.href], true)],
  },
  {
    name: "facebook",
    hosts: ["facebook.com", "fb.watch"],
    capabilities: ["text", "caption", "image", "video"],
    buildSteps: (url) => [step("search", "post", ["facebook", "search", url.href], true)],
  },
  {
    name: "instagram",
    hosts: ["instagram.com"],
    capabilities: ["text", "image", "video"],
    buildSteps: (url, o) => {
      if (isInstagramProfileUrl(url)) {
        throw new Error("Instagram profile enumeration is unsupported; provide a direct /p/, /reel/, or /tv/ URL");
      }
      return [
        step("page", "post", webRead(url), true),
        ...(o.media || o.audio ? [step("media", "media", ["instagram", "download", url.href, "--path", "{OUTPUT_DIR}/media"])] : []),
      ];
    },
  },
  {
    name: "youtube",
    hosts: ["youtube.com", "youtu.be"],
    capabilities: ["text", "caption", "video", "audio", "transcript", "comments"],
    buildSteps: (url, o) => [
      step("video", "post", ["youtube", "video", url.href], true),
      step("transcript", "transcript", ["youtube", "transcript", url.href]),
      ...(o.comments ? [step("comments", "comments", ["youtube", "comments", url.href])] : []),
    ],
  },
  {
    name: "xiaoyuzhou",
    hosts: ["xiaoyuzhoufm.com"],
    capabilities: ["text", "audio", "transcript"],
    buildSteps: (url, o) => {
      const id = xiaoyuzhouId(url);
      return [
        step("episode", "post", ["xiaoyuzhou", "episode", id], true),
        step("transcript", "transcript", ["xiaoyuzhou", "transcript", id, "--output", "{OUTPUT_DIR}/transcript"]),
        ...(o.audio ? [step("audio", "media", ["xiaoyuzhou", "download", id, "--output", "{OUTPUT_DIR}/media"])] : []),
      ];
    },
  },
  {
    name: "linkedin",
    hosts: ["linkedin.com"],
    capabilities: ["text", "image", "video"],
    buildSteps: (url) => [step("page", "post", webRead(url), true)],
  },
  {
    name: "xueqiu",
    hosts: ["xueqiu.com"],
    capabilities: ["text", "comments"],
    buildSteps: (url) => [step("page", "post", webRead(url), true)],
  },
];

export function detectPlatform(input, override) {
  const url = new URL(input);
  if (override) {
    const selected = PLATFORMS.find((item) => item.name === override);
    if (!selected) throw new Error(`Unknown platform: ${override}`);
    return { platform: selected, url };
  }
  const selected = PLATFORMS.find((item) => hostMatches(url.hostname.toLowerCase(), item.hosts));
  if (!selected) throw new Error(`Unsupported social URL host: ${url.hostname}`);
  return { platform: selected, url };
}

export function buildPlan(input, options = {}) {
  const { platform, url } = detectPlatform(input, options.platform);
  const primary = platform.buildSteps(url, options);
  const hasGeneric = primary.some((item) => item.args[0] === "web");
  const fallback = options.fallback !== false && !hasGeneric
    ? [step("page-fallback", "page", webRead(url))]
    : [];
  return {
    platform: platform.name,
    url: url.href,
    capabilities: platform.capabilities,
    steps: [...primary, ...fallback],
  };
}
