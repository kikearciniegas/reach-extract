# Legacy Facebook prototypes

Four root-level files predate the maintained portable skill. They are preserved
as historical, task-specific experiments and are not called by
`reach-extract.mjs`, npm scripts, or tests.

## Status and safety

These scripts:

- are tied to a specific Facebook profile/reel collection;
- contain a fixed OpenCLI browser session alias (`ab42xheb`);
- assume an authenticated interactive browser;
- execute JavaScript inside Facebook pages;
- use fixed output filenames in the repository root;
- may generate hundreds of requests and scroll actions;
- are not covered by the maintained read-plan safety tests;
- may stop working whenever Facebook markup or embedded data changes.

Do not run them as a general extractor. Review and parameterize them in an
isolated branch/workspace before any reuse. Respect login, privacy, rate limits,
and platform controls.

## `index_facebook_reels.mjs`

Purpose: discover numeric reel IDs from one profile's reels tab.

Behavior:

1. Reuses or opens the hardcoded profile reels tab.
2. Selects the browser tab in session `ab42xheb`.
3. Collects `/reel/<id>` links into `window.__agentReachIds`.
4. Scrolls up to 80 times, pausing 700 ms between scrolls.
5. Stops after the collection reaches at least 400 IDs and remains stable for
   five iterations, or after the loop limit.
6. Writes `agent-reach-facebook-reel-ids.json`.

It has no CLI options and overwrites its fixed ID file.

## `extract_facebook_reels.mjs`

Purpose: extract public written descriptions from indexed reels.

Arguments:

```text
node extract_facebook_reels.mjs [concurrency=5] [limit=0]
```

Important implementation detail: the current `pending` list is hardcoded to a
single reel ID, so the indexed ID list is not used as the extraction queue.
`limit=0` means no slicing limit, but it still applies only to that hardcoded
pending list.

The script opens multiple browser tabs, searches embedded page JSON for message
text associated with the reel ID, waits and retries once when empty, appends
JSON Lines to `agent-reach-facebook-reels.jsonl`, and closes created tabs.

## `inspect_missing_reels.mjs`

Purpose: inspect one hardcoded reel that did not yield expected text/captions.

It opens a tab, waits, clicks visible “See more” buttons, recursively searches
embedded JSON for `captions_url`, prints a body excerpt and caption metadata,
then closes the tab. The reel ID list is hardcoded.

## `build_facebook_actions.py`

Purpose: transform the prototype JSONL descriptions into a categorized Markdown
report of suggested actions.

Inputs and output are fixed paths in the repository root:

- input: `agent-reach-facebook-reels.jsonl`;
- output: `facebook-video-suggested-actions.md`.

The script contains:

- manual text replacements for selected reel IDs;
- manual action overrides;
- regex-based topic classification;
- regex-based directive detection;
- promotional-call filtering;
- exact repeated-recommendation consolidation;
- links back to source reels.

It is dataset-specific content processing, not the maintained transcript
instruction extractor. Its heuristics and manual overrides must not be merged
into the general skill without independent fixtures and a clear use case.

## Generated files

The repository `.gitignore` excludes the main prototype artifacts:

- `agent-reach-*.json`
- `agent-reach-*.jsonl`
- `reel*.jpg`
- `facebook-video-suggested-actions.md`

Deleting or regenerating those artifacts is outside the maintained extractor's
workflow.
