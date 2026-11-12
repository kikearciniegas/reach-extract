# Instagram: rate limits and profile access

Findings from one field run on 2026-09-23: extracting every reel of a public
creator profile (99 reels) through a logged-in OpenCLI browser session. Every
statement below is marked **verified** (observed in that run or read from the
code) or **hypothesis** (a plausible explanation that was not tested).

## Summary

- At the time of the run, the extractor could not enumerate a profile and
  planned a profile URL exactly like a post URL. The registry now rejects
  profile and profile-tab URLs explicitly instead of returning a misleading
  single page read. (verified, then fixed)
- Both OpenCLI routes that could enumerate the posts failed in the same
  session. `instagram profile` returned HTTP 429 twice, 15 minutes apart.
  `instagram user` returned an HTML page instead of JSON. (verified)
- Per-reel access kept working in that same window. 99 page reads, 99 media
  downloads and 99 transcriptions completed with zero failures and no 429.
  (verified)
- The workaround that worked: collect the reel URLs in the operator's own
  browser, then extract each URL one at a time with spacing. (verified)

## What the registry does for Instagram

`skills/social-media-extract/scripts/lib/platforms.mjs` has one Instagram entry
(verified, code):

| Step | Command | When | Required |
| --- | --- | --- | --- |
| `page` | `opencli web read --url URL …` | always | yes |
| `media` | `opencli instagram download URL --path {OUTPUT_DIR}/media` | `--media` or `--audio` | no |

Consequences at the time of the field run:

- **No URL-shape distinction (fixed).** `instagram.com/<user>` and direct-post
  URLs used to get identical plans. Profile, `/reels/`, and `/tagged/` profile
  URLs now fail during planning with `profile enumeration is unsupported`.
- **`caption` was declared but no step produced it (fixed).** The entry's
  `capabilities` included `caption`, but there is no caption or subtitle step.
  The capability has been removed.
  The post copy only arrives inside the web-read markdown, on its first line:
  `# <display name> on Instagram: "<post copy>"`. The publish time is on a later
  line as `> 发布时间: <ISO timestamp>`. Captions are never present, so `--audio`
  always runs ASR when requested.
- **Doctor cannot see this.** `agent-reach doctor --json` reports Instagram as
  `warn` with `active_backend: null`: login state and commands are not verified
  live, because doctor does not execute platform commands. A 429 on the API
  endpoints is invisible to it.

## Timeline of the failures

All times UTC, 2026-09-23, one browser session, one logged-in account.

| Time | Command | Result |
| --- | --- | --- |
| ~14:35 | `opencli instagram profile <user> -f json` | `Instagram web_profile_info failed: HTTP 429` |
| 14:50 | same, after a 15-minute wait | `HTTP 429` again |
| 14:57 | `reach-extract.mjs extract <reel URL>` (page read) | OK, 8.8 KB, `non_empty: true` |
| 15:03 | `opencli instagram user <user> --limit 120 -f json` | `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON` |
| 14:57 → 15:31 | 39 × page read, then 99 × page read + `instagram download` + ASR, 5–8 s apart | 0 failures, 0 HTTP 429 |

The HTML body returned at 15:03 was not captured, so whether it was a login
wall, a challenge page or a throttle page is **unknown**. To capture it next
time, re-run with `--trace retain-on-failure`.

## Independent recheck

A separate read-only check later on 2026-09-23 reproduced the profile failure
with a public account on OpenCLI 1.8.7:

| Check | Result |
| --- | --- |
| `agent-reach doctor --json` | Instagram `warn`, `active_backend: null`; it reported that the extension was not connected |
| `opencli doctor` seconds later | daemon and extension connected; connectivity OK |
| `opencli instagram profile nasa -f json` | exit 1, `Instagram web_profile_info failed: HTTP 429` |

This independently verifies that a connected OpenCLI bridge does not imply
that the Instagram profile endpoint is usable, and that the higher-level doctor
snapshot can differ from an immediate OpenCLI connectivity check. The recheck
stopped at the first genuine 429, so it did **not** independently retest the
earlier observation that direct-reel page reads and downloads can keep working
during profile-endpoint throttling. Do not turn that earlier single-session
observation into a general guarantee.

## Interpretation

- **Verified:** throttling hit the JSON endpoints behind `instagram profile`
  (`web_profile_info`) and `instagram user`, while page reads and media
  downloads of individual reels kept working in the same session during the
  same period.
- **Hypothesis:** Instagram rate-limits its web API per endpoint and per
  account session, separately from ordinary page loads. A single 15-minute wait
  did not clear it. Recovery time was not measured.
- **Hypothesis:** the profile grid in the browser also paginates through that
  API. If so, a throttled account can see the grid stop loading partway, which
  may explain the partial collections below.

## Enumerating a profile's reels

No maintained route exists. The procedure that worked:

1. Open `instagram.com/<user>/` (the main grid) in the operator's own logged-in
   browser. Do not automate the login.
2. Paste this in the DevTools console. It scrolls the last loaded tile into
   view until no new links appear, collecting links as it goes (the grid
   removes off-screen tiles from the page, so a single final read misses
   them):

   ```js
   (async()=>{const s=new Set();let last=-1,same=0;while(same<6){const a=[...document.querySelectorAll('a[href*="/reel/"],a[href*="/p/"]')];a.forEach(x=>s.add(x.href.split('?')[0]));a.at(-1)?.scrollIntoView({block:'end'});window.scrollBy(0,2000);await new Promise(r=>setTimeout(r,2500));if(s.size===last)same++;else{same=0;last=s.size}}console.log(s.size+'\n'+[...s].join('\n'))})()
   ```

3. Compare the printed count with the post count in the profile header. If it
   is short, run it again later rather than faster.
4. Deduplicate the list against what has already been extracted, and feed only
   the new URLs to the batch.

Observed collection counts for the same 99-reel profile: 39 (manual copy), 31,
47, then 99 (verified). The 47 and the 99 both came from the snippet above; why
one run stopped at 47 and a later one reached 99 was **not determined**.

The 31 came from this earlier snippet, run on the `/reels/` tab. Do not reuse
it:

```js
// Superseded: stopped at 31 of 99 on the /reels/ tab
(async()=>{const s=new Set();let last=0,same=0;while(same<5){document.querySelectorAll('a[href*="/reel/"]').forEach(a=>s.add(a.href.split('?')[0]));window.scrollTo(0,document.body.scrollHeight);await new Promise(r=>setTimeout(r,1500));if(s.size===last)same++;else{same=0;last=s.size}}console.log(s.size+'\n'+[...s].join('\n'))})()
```

It differs from the working snippet in four ways:

- It scrolls only the window (`window.scrollTo`) rather than bringing the last
  tile into view.
- It waits 1.5 s instead of 2.5 s.
- It gives up after 5 unchanged checks instead of 6.
- It collects `/reel/` links only.

That it stalled because the tab scrolls a nested container rather than the
window is a **hypothesis**; which difference mattered was not isolated.

## Detecting a rate limit

- **Verified pitfall:** searching raw output for the bare string `429` gives
  false positives. Web-read markdown embeds long Instagram CDN image URLs whose
  digit runs contain `429`. One batch halted on a successful read for this
  reason.
- Match `HTTP 429` only, and only in `manifest.json.steps[].error` and
  `raw/*.stderr`, never in stdout content.
- Stop the whole batch at the first genuine 429 and keep the bundles already
  written, as [troubleshooting](troubleshooting.md#rate-limit-challenge-or-bilibili-http-412)
  says.

## Batch procedure that worked

- One reel URL per `extract` call, strictly sequential. Never run two batches
  against Instagram at once; queue them.
- 5 s between page-only reads and 8 s between `--audio` extractions.
- Resumable: skip any URL whose output directory already has a
  `manifest.json`.
- Build and consume the URL list inside one shell invocation, and assert its
  size before the first request. A list that resolves to nothing reports
  "0 failed", which looks like success.
- Evidence order: captions (never available), then the post copy (web-read
  first line), then audio. On this profile the post copy of all 99 reels was a
  call to comment a keyword or a hashtag line, so every reel needed ASR.
- Cost: an average of about 3.4 MB of video per reel (341 MB for 99). Delete
  `media/` after transcription if the video is not needed as evidence;
  transcripts and manifests total about 10 MB.

## Transcript quality on Instagram reels

- 33 of 99 reels had music only. ASR returned song lyrics or filler ("you",
  "Thanks for watching", "Outro Music", "Música"). These steps report `ok: true`
  and `non_empty: true`, so the manifest cannot tell them apart from speech.
  (verified)
- Advice in such reels is usually on-screen text, which needs OCR. The
  extractor does not support OCR. Report these reels as a gap rather than as
  "no actions".
- Spanish transcripts gave 0 `--instructions` candidates. For identical content
  the classifier found 0 in Spanish and 1 in English because its bare-imperative
  lexicon was English only. A Spanish imperative lexicon and regression test
  have now been added. Explicit Spanish sequence, prerequisite, and warning cues
  were already supported. That lexicon still missed the informal second person
  that reels use ("eliges", "le das a", "te vas a"); it now covers both forms,
  and transcripts in other languages record an `instructions: unsupported-language`
  gap. See [Audio and instruction extraction](audio-and-instructions.md).
  (verified, then fixed)

## Resolution status

Implemented from this run:

1. Profile, `/reels/`, and `/tagged/` profile URLs fail explicitly during
   planning. The CLI remains intentionally single-URL; batch scheduling and
   profile enumeration are not implied.
2. Instagram no longer advertises caption capability. The generic page result
   remains unstructured post text rather than being relabeled as a caption.
3. Rate-limit guidance consistently checks manifest errors and stderr for
   `HTTP 429`, never successful stdout.
4. The instruction classifier recognizes common bare Spanish imperatives and
   has regression coverage.

Documented but not automated:

- Music-only, lyric, or filler ASR cannot be classified reliably with the
  current evidence. A `no-speech` gap would require an audio/speech detector or
  a measured heuristic to avoid hiding real speech.
- On-screen advice requires OCR, which the extractor does not provide.
- `doctor` checks dependencies and bridge health but does not make a live
  Instagram request. A default live probe would add a platform request and
  could itself affect rate limits; keep it opt-in if one is added later.
- Built-in batch/resume support remains future work. Until then, use the
  sequential, stop-on-error procedure above and retain each completed bundle.
