// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Rafael Arciniegas

// scripts/protect-main.sh against a fake gh serving GitHub's GET shape:
// a live rule equal to the body is "(no difference)"; a dropped required check
// and admins not included are diff lines; "Branch not protected" (no rule yet)
// is a CREATE; any other refusal still REFUSES. No network: any gh call other
// than the GET and the PUT exits 9. Needs bash and jq.

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(root, "scripts", "protect-main.sh");
const REPO = /^REPO=(\S+)$/m.exec(readFileSync(SCRIPT, "utf8"))[1];
const REQUIRED = JSON.parse(readFileSync(path.join(root, ".github", "required-checks.json"), "utf8"));
const dir = mkdtempSync(path.join(tmpdir(), "protect-main-"));
after(() => rmSync(dir, { recursive: true, force: true }));
// GET: the rule file if present, else the error (stdout body, stderr line, exit 1). PUT: saves the body, then serves "after".
writeFileSync(path.join(dir, "gh"), `#!/bin/sh
echo "$*" >> "$GH_DIR/calls"
case "$*" in
  "api repos/${REPO}/branches/main/protection")
    [ -f "$GH_DIR/rule" ] && { cat "$GH_DIR/rule"; exit 0; }
    cat "$GH_DIR/err.out"; cat "$GH_DIR/err.txt" >&2; exit 1 ;;
  "api -X PUT repos/${REPO}/branches/main/protection --input -")
    cat > "$GH_DIR/put"; cp "$GH_DIR/after" "$GH_DIR/rule"; echo '{}'; exit 0 ;;
esac
exit 9
`);
chmodSync(path.join(dir, "gh"), 0o755);

// GitHub's GET shape: booleans wrapped as {enabled}, checks as {context, app_id}, extra fields the PUT does not take.
const live = (checks, admins = true) => ({
  url: "https://api.github.invalid/x",
  required_status_checks: { strict: true, contexts: checks, checks: checks.map((context) => ({ context, app_id: 15368 })) },
  enforce_admins: { url: "x", enabled: admins },
  required_pull_request_reviews: { url: "x", dismiss_stale_reviews: true, require_code_owner_reviews: false, require_last_push_approval: false, required_approving_review_count: 0 },
  required_linear_history: { enabled: true }, allow_force_pushes: { enabled: false }, allow_deletions: { enabled: false },
  required_conversation_resolution: { enabled: true }, lock_branch: { enabled: false }, allow_fork_syncing: { enabled: false },
  required_signatures: { enabled: false }, block_creations: { enabled: false },
});
function run(mode, gh) {
  const d = mkdtempSync(path.join(dir, "gh-"));
  writeFileSync(path.join(d, "calls"), "");
  if (gh.rule !== undefined) writeFileSync(path.join(d, "rule"), typeof gh.rule === "string" ? gh.rule : JSON.stringify(gh.rule));
  if (gh.err) { writeFileSync(path.join(d, "err.out"), gh.err.out); writeFileSync(path.join(d, "err.txt"), `${gh.err.line}\n`); }
  if (gh.after) writeFileSync(path.join(d, "after"), JSON.stringify(gh.after));
  const r = spawnSync("bash", [SCRIPT, mode], { env: { PATH: `${dir}:${process.env.PATH}`, GH_DIR: d }, encoding: "utf8" });
  const calls = readFileSync(path.join(d, "calls"), "utf8").trim().split("\n").filter(Boolean);
  return { status: r.status, stdout: r.stdout, stderr: r.stderr, calls, puts: calls.filter((c) => c.includes("-X PUT")),
    put: () => JSON.parse(readFileSync(path.join(d, "put"), "utf8")) };
}
const dryRun = (rule) => {
  const r = run("--dry-run", { rule });
  return { status: r.status, out: r.stdout.split("=== live -> body\n")[1] ?? r.stdout + r.stderr };
};
// gh's own answers to GET .../protection: stdout carries the body, stderr "gh: <message> (HTTP <code>)".
const ghErr = (message, code) =>
  ({ out: JSON.stringify({ message, documentation_url: "https://docs.github.com/x", status: String(code) }), line: `gh: ${message} (HTTP ${code})` });
const NOT_PROTECTED = ghErr("Branch not protected", 404);
const checksOf = (b) => b.required_status_checks.checks.map((c) => `${c.context} @${c.app_id}`);

test("a live rule equal to the body: (no difference)", () => {
  const r = dryRun(live(REQUIRED));
  assert.equal(r.status, 0);
  assert.equal(r.out.trim(), "(no difference)");
});
test("control: a dropped required check is a diff line", () => {
  const r = dryRun(live(REQUIRED.slice(1)));
  assert.equal(r.status, 0);
  assert.ok(r.out.includes(`+      "${REQUIRED[0]} @15368"`), r.out);
});
test("control: admins not included is a diff line", () => {
  const r = dryRun(live(REQUIRED, false));
  assert.equal(r.status, 0);
  assert.match(r.out, /^-\s+"enforce_admins": false,\n\+\s+"enforce_admins": true,$/m);
});
test("first apply: \"Branch not protected\" -> one PUT of the body, read back, exit 0", () => {
  const r = run("--apply", { err: NOT_PROTECTED, after: live(REQUIRED) });
  assert.equal(r.stderr, "");
  assert.equal(r.status, 0);
  assert.equal(r.puts.length, 1);
  assert.equal(r.calls.length, 3); // GET, PUT, read-back GET
  assert.deepEqual(checksOf(r.put()), REQUIRED.map((c) => `${c} @15368`));
  assert.equal(r.put().enforce_admins, true);
  assert.equal(r.stdout, `applied and read back: ${REQUIRED.map((c) => `${c} @15368`).sort().join(", ")}\n`); // the script sorts
});
test("apply whose read-back differs: FAILED, exit 1", () => {
  const r = run("--apply", { rule: live(REQUIRED, false), after: live(REQUIRED, false) });
  assert.equal(r.status, 1);
  assert.equal(r.puts.length, 1);
  assert.match(r.stderr, /FAILED: the read-back differs/);
});
test("dry-run on an unprotected branch: no write; the full body and a CREATE plan are printed", () => {
  const r = run("--dry-run", { err: NOT_PROTECTED });
  assert.equal(r.status, 0);
  assert.equal(r.puts.length, 0);
  const [head, plan] = r.stdout.split("=== live -> body\n");
  const body = JSON.parse(head.replace("=== PUT body\n", ""));
  assert.deepEqual(checksOf(body), REQUIRED.map((c) => `${c} @15368`));
  assert.equal(body.enforce_admins, true);
  assert.equal(plan, "(no rule yet: --apply would CREATE it)\n");
});
// Negative controls: only that exact 404 means "no rule yet"; a plan refusal is never a CREATE.
for (const [name, gh] of [
  ["404 \"Upgrade to GitHub Pro…\" (plan lacks protection)", { err: ghErr("Upgrade to GitHub Pro or make this repository public to enable this feature.", 404) }],
  ["403 \"Upgrade to GitHub Pro…\"", { err: ghErr("Upgrade to GitHub Pro or make this repository public to enable this feature.", 403) }],
  ["404 \"Branch not found\"", { err: ghErr("Branch not found", 404) }],
  ["garbage JSON on a 200", { rule: "not json {" }],
]) {
  for (const mode of ["--dry-run", "--apply"]) {
    test(`control: ${name}, ${mode}: REFUSED, no PUT`, () => {
      const r = run(mode, { ...gh, after: live(REQUIRED) });
      assert.equal(r.status, 1);
      assert.equal(r.puts.length, 0);
      assert.ok(r.stderr.includes(`REFUSED: could not read the live rule for ${REPO} main`), r.stderr);
      assert.ok(!r.stdout.includes("CREATE"));
    });
  }
}
