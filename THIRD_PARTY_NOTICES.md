# Third-party notices, ownership recognition, and disclaimer

Last reviewed: 2026-09-22.

WORX Reach Extract is an independent project authored by Rafael Arciniegas. It
uses or interoperates with third-party software, services, websites, APIs,
platforms, trademarks, and content. Those materials are not owned by Rafael
Arciniegas merely because they are named, invoked, indexed, or linked here.

The project [MIT License](LICENSE) applies only to original WORX Reach Extract
materials. It does not replace, extend, restrict, sublicense, or otherwise alter
any third party's license, terms, privacy policy, acceptable-use rules,
copyright, patent, trademark, database right, or other rights.

## Distribution boundary

This repository has no npm runtime dependencies and does not vendor the source
or binaries of the tools below. They are separately installed prerequisites or
optional tools invoked through command-line interfaces. Their own distributions
include authoritative license texts and dependency notices, which must be
retained and reviewed when those tools are copied or redistributed.

Versions below were observed during the review and are not pinned by this
repository unless explicitly stated. Upgrades can change dependencies and
licenses.

## Direct tools and development components

| Component | Observed version | Ownership recognition | License |
| --- | ---: | --- | --- |
| [Node.js](https://github.com/nodejs/node) | 26.9.0 | Node.js contributors, the OpenJS Foundation ecosystem, and the respective owners of bundled third-party code | MIT-style Node.js license plus component-specific notices in Node's `LICENSE` |
| [Agent Reach](https://github.com/Panniantong/agent-reach) | 1.5.0 | Agent Reach/Agent Eyes, Neo Reid, and contributors | MIT |
| [OpenCLI](https://github.com/jackwener/opencli) | 1.8.7 | jackwener and contributors | Apache-2.0 |
| [bilibili-cli](https://github.com/jackwener/bilibili-cli) | 0.6.2 | jackwener and contributors | Apache-2.0 |
| [uv](https://github.com/astral-sh/uv) | 0.12.17 | Astral Software Inc. and contributors | MIT OR Apache-2.0 |
| [PyYAML](https://github.com/yaml/pyyaml) | 6.0.3 | Kirill Simonov, current maintainers, and contributors | MIT |

Node.js runs the project. Agent Reach and OpenCLI provide external routing and
site access. bilibili-cli is a Bilibili fallback. uv and PyYAML are used only by
the skill-validation development command. None of those projects endorses or
sponsors WORX Reach Extract.

## Declared direct dependencies of the external tools

The following inventory reflects installed package metadata reviewed on the
date above. These packages remain owned by their respective authors and
contributors and governed by their own licenses.

### Agent Reach core

| Package | Observed version | Declared license |
| --- | ---: | --- |
| feedparser | 6.0.14 | BSD-2-Clause |
| Loguru | 0.7.3 | MIT |
| python-dotenv | 1.2.3 | BSD-3-Clause |
| PyYAML | 6.0.3 | MIT |
| Requests | 2.34.2 | Apache-2.0 |
| Rich | 15.0.0 | MIT |
| yt-dlp | 2026.8.19 | Unlicense |

Agent Reach also declares optional extras such as browser-cookie3, MCP, and
Playwright. They were not installed in the reviewed Agent Reach environment.
If enabled later, their then-current package metadata and license files control.

### OpenCLI

| Package | Observed version | Declared license |
| --- | ---: | --- |
| @mozilla/readability | 0.6.0 | Apache-2.0 |
| cli-table3 | 0.6.5 | MIT |
| commander | 14.0.3 | MIT |
| js-yaml | 4.3.2 | MIT |
| turndown | 7.2.4 | MIT |
| turndown-plugin-gfm | 1.0.2 | MIT |
| undici | 6.28.1 | MIT |
| ws | 8.21.3 | MIT |

### bilibili-cli

| Package | Observed version | Declared license |
| --- | ---: | --- |
| aiohttp | 3.14.3 | Apache-2.0 AND MIT |
| bilibili-api-python | 17.4.2 | GPL-3.0-or-later |
| browser-cookie3 | 0.20.1 | LGPL (see installed package for exact terms) |
| Click | 8.5.0 | BSD-3-Clause |
| PyYAML | 6.0.3 | MIT |
| qrcode | 8.2 | BSD |
| Rich | 15.0.0 | MIT |

PyAV is an optional bilibili-cli audio dependency and was not installed in the
reviewed environment. Its license and the licenses of any multimedia libraries
linked by a particular build must be reviewed before redistribution.

## Transitive dependencies and system components

Each external tool has additional transitive dependencies. Node.js also bundles
or links separately maintained components. This repository does not reproduce
those third-party license texts because it does not distribute those packages.
The authoritative inventory is the `LICENSE`, `NOTICE`, package metadata, and
dependency files shipped with the exact external installation being used.

Some environments may provide ffmpeg or other codecs to external download or
ASR tooling. ffmpeg licensing depends on the specific build and enabled
libraries. WORX Reach Extract does not bundle or directly invoke ffmpeg.

## Services, APIs, platforms, and products

The project can interact with or mention Agent Reach, OpenCLI, Groq, OpenAI,
Chrome, Codex, Claude, Gemini, GitHub Copilot, Cursor, OpenCode, Windsurf,
Devin, Xiaohongshu, X/Twitter, Bilibili, V2EX, Reddit, Facebook, Instagram,
YouTube, Xiaoyuzhou, LinkedIn, Xueqiu, and other adapters exposed by separately
installed tools.

All names, logos, service marks, trademarks, websites, APIs, platform software,
and platform-provided data are owned by or licensed to their respective owners.
Reference is solely descriptive and for interoperability. It does not imply
affiliation, authorization, certification, sponsorship, or endorsement in
either direction. No trademark license is granted by this repository.

Use of each service or platform is subject to its own current terms, policies,
technical controls, account permissions, geographic restrictions, and fees.
The MIT License for this project does not authorize access to or use of any
third-party service.

## Third-party and user content

Posts, reels, videos, images, captions, audio, comments, profiles, metadata, and
other extracted materials remain owned or controlled by their creators,
publishers, platforms, licensors, or other applicable rightsholders. Extraction
does not transfer ownership and does not establish permission to reproduce,
publish, train on, redistribute, commercialize, or create derivative works.

Users are responsible for determining whether their access, processing,
storage, quotation, transcription, and downstream use are lawful and permitted.
They must obtain any required consent or license and respect privacy,
confidentiality, publicity, copyright, database, contractual, and related
rights.

## Warranty and responsibility disclaimer

Third-party tools and services are provided under their own warranties and
disclaimers. Rafael Arciniegas and WORX Reach Extract do not control and make no
representation or warranty regarding their availability, security, accuracy,
legality, continued compatibility, output, licensing status, or fitness for a
particular purpose.

This notice is informational and is not legal advice. When redistributing a
combined environment, executable, container, application bundle, or modified
third-party component, perform a license review against the exact artifacts
being distributed and include every notice and license required by their
rightsholders.
