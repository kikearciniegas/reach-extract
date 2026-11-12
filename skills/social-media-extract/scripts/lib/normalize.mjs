// Copyright (c) 2026 Rafael Arciniegas

const TEXT_KEYS = new Set([
  "text", "caption", "content", "body", "description", "summary", "message",
  "title", "transcript", "subtitle", "subtitles", "markdown", "selftext",
]);
const AUTHOR_KEYS = new Set(["author", "username", "user_name", "screen_name", "nickname", "owner"]);
const METRIC_KEYS = new Set([
  "likes", "like_count", "comments", "comment_count", "shares", "share_count",
  "views", "view_count", "replies", "reply_count", "favorites", "collect_count",
]);
const MEDIA_KEYS = /(?:image|video|audio|media|thumbnail|cover|playback|download).*(?:url|src)|^(?:url|src)$/i;
const MEDIA_URL = /^(?:https?:\/\/|\/\/).+/i;

function scalar(value) {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

export function parseOutput(raw) {
  const value = raw.trim();
  if (!value) return null;
  try { return JSON.parse(value); } catch { return value; }
}

export function normalize(outputs, meta) {
  const evidence = [];
  const metrics = {};
  const seen = new Set();

  function add(kind, value, sourceStep, sourcePath) {
    if (value === null || value === undefined || value === "") return;
    const normalized = typeof value === "string" ? value.trim() : value;
    if (normalized === "") return;
    const key = `${kind}:${JSON.stringify(normalized)}`;
    if (seen.has(key)) return;
    seen.add(key);
    evidence.push({ kind, value: normalized, source_step: sourceStep, source_path: sourcePath });
  }

  function walk(value, sourceStep, stepEvidence, path = "$") {
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, sourceStep, stepEvidence, `${path}[${index}]`));
      return;
    }
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      const lower = key.toLowerCase();
      const childPath = `${path}.${key}`;
      if (scalar(child)) {
        if (TEXT_KEYS.has(lower)) {
          const kind = lower === "title"
            ? "title"
            : stepEvidence === "transcript" || /transcript|subtitle/.test(lower)
              ? "transcript"
              : stepEvidence === "comments"
              ? "comment"
              : "text";
          add(kind, child, sourceStep, childPath);
        }
        if (AUTHOR_KEYS.has(lower)) add("author", child, sourceStep, childPath);
        if (METRIC_KEYS.has(lower) && typeof child !== "boolean") metrics[lower] = child;
        if (MEDIA_KEYS.test(lower) && typeof child === "string" && MEDIA_URL.test(child)) {
          add("media", child.startsWith("//") ? `https:${child}` : child, sourceStep, childPath);
        }
      } else {
        walk(child, sourceStep, stepEvidence, childPath);
      }
    }
  }

  for (const output of outputs) {
    if (!output.ok || output.data === null) continue;
    if (typeof output.data === "string") add(output.evidence === "transcript" ? "transcript" : "text", output.data, output.label, "$raw");
    else walk(output.data, output.label, output.evidence);
  }

  const kinds = (kind) => evidence.filter((item) => item.kind === kind).map((item) => item.value);
  const transcriptRequested = meta.options.transcript || meta.options.audio || meta.options.instructions;
  const requested = ["post", ...(meta.options.comments ? ["comments"] : []), ...(meta.options.media ? ["media"] : []), ...(transcriptRequested ? ["transcript"] : [])];
  const foundStepKinds = new Set(outputs.filter((item) => item.ok && item.non_empty).map((item) => item.evidence));
  const evidenceKindByStep = new Map(outputs.map((item) => [item.label, item.evidence]));
  const gaps = requested.filter((kind) => {
    if (kind === "post") {
      return !evidence.some((item) =>
        (item.kind === "text" || item.kind === "title") &&
        new Set(["post", "page", "article"]).has(evidenceKindByStep.get(item.source_step)),
      );
    }
    if (kind === "comments") return kinds("comment").length === 0;
    if (kind === "transcript") return kinds("transcript").length === 0;
    return kinds(kind).length === 0 && !foundStepKinds.has(kind);
  });

  return {
    schema_version: "0.1.0",
    run_id: meta.runId,
    source: { platform: meta.platform, url: meta.url },
    content: {
      title: kinds("title"),
      text: kinds("text"),
      comments: kinds("comment"),
      transcript: kinds("transcript"),
      authors: kinds("author"),
      media: kinds("media"),
      metrics,
    },
    evidence,
    gaps,
    provenance: { manifest: "manifest.json", raw_dir: "raw" },
  };
}
