# Platform routing

The registry targets the social/community channels documented by Agent Reach,
plus its media and optional professional/finance community channels. Commands
are read-only and emit JSON where the adapter supports it.

| Platform | URL detection | Primary OpenCLI read route | Optional evidence |
|---|---|---|---|
| Xiaohongshu | `xiaohongshu.com`, `xhslink.com` | `xiaohongshu note URL` | comments, download |
| X/Twitter | `x.com`, `twitter.com` | `twitter thread URL` | article, download |
| Bilibili | `bilibili.com`, `b23.tv` | OpenCLI metadata plus `bili video` fallback | subtitle, audio |
| V2EX | `v2ex.com/t/ID` | `v2ex topic ID` | replies |
| Reddit | `reddit.com`, `redd.it` | `reddit read POST_ID` | included comments |
| Facebook | `facebook.com`, `fb.watch` | `facebook search URL` | generic page fallback |
| Instagram | `instagram.com/p/…`, `/reel/…`, `/tv/…` | generic page read | media download |
| YouTube | `youtube.com`, `youtu.be` | `youtube video URL` | transcript, comments |
| Xiaoyuzhou | `xiaoyuzhoufm.com/episode` | `xiaoyuzhou episode URL` | transcript |
| LinkedIn | `linkedin.com` | generic page read | adapter-specific profile posts later |
| Xueqiu | `xueqiu.com` | generic page read | symbol comments later |

Audio fallback coverage is conditional. YouTube is passed directly to
`agent-reach transcribe`; Xiaohongshu, X/Twitter, Instagram, and Xiaoyuzhou use
their OpenCLI download route before ASR; Bilibili uses `bili audio` when that
optional CLI is installed. Facebook currently has no stable arbitrary-reel
download command, so unavailable audio is reported as a gap.

## Important boundaries

- Run `agent-reach doctor --json` first. An `active_backend: null` is a snapshot,
  not proof that the adapter is absent.
- OpenCLI uses the user's existing, explicitly controlled browser session. Never
  read browser cookies or initiate login automatically.
- Xiaohongshu note reads require the complete URL including `xsec_token` when
  the platform issued one. Keep at least 2–3 seconds between requests.
- Reddit requires login. Anonymous JSON endpoints are not a fallback.
- Instagram profile and profile-tab URLs are rejected because the extractor
  cannot enumerate them. Supply a direct `/p/`, `/reel/`, or `/tv/` URL.
  Direct post page reading can be incomplete; downloaded media does not prove
  caption capture. Instagram does not advertise caption capability because the
  generic page route returns post copy only as unstructured text.
- One field run observed Instagram profile API throttling while direct-reel page
  reads and downloads still succeeded; this is not a general guarantee. Treat
  `doctor` as a dependency check, not a live probe of the account's Instagram
  endpoint state.
- Facebook has no stable adapter command for arbitrary post/reel detail in the
  current OpenCLI interface. Preserve the generic fallback result and surface
  missing fields explicitly.
- Do not use yt-dlp for Bilibili. The OpenCLI Bilibili subtitle route is the
  supported path in this stack.
- YouTube transcript success requires non-empty transcript text. Empty caption
  responses may be retried up to three times by a future retry policy; this
  initial runner performs one transparent attempt per plan step.
- Xiaoyuzhou transcript may require locally configured credentials.

## Extending the registry

Add URL host patterns and a `buildSteps` implementation in
`scripts/lib/platforms.mjs`. Every step must use an OpenCLI command classified
as read-only, have a stable label, and declare its evidence kind. Add detection
and planning tests before enabling it by default.
