// Copyright (c) 2026 Rafael Arciniegas

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";

const execFileAsync = promisify(execFile);
const session = "ab42xheb";
const idsPath = new URL("./agent-reach-facebook-reel-ids.json", import.meta.url).pathname;

async function opencli(args, timeout = 30000) {
  const { stdout } = await execFileAsync("opencli", args, {
    timeout,
    maxBuffer: 8 * 1024 * 1024,
  });
  return stdout.trim();
}

const tabs = JSON.parse(await opencli(["browser", session, "tab", "list"]));
let tab = tabs.find((item) => item.url.includes("sk=reels_tab"))?.page;
if (!tab) {
  tab = JSON.parse(await opencli([
    "browser", session, "open",
    "https://www.facebook.com/profile.php?id=100091065962204&sk=reels_tab",
  ])).page;
}
await opencli(["browser", session, "tab", "select", tab]);
await opencli([
  "browser", session, "eval",
  `window.__agentReachIds=window.__agentReachIds||{};
   for(const a of document.querySelectorAll("a[href*='/reel/']")){
     const id=a.href.match(/\\/reel\\/(\\d+)/)?.[1];
     if(id)window.__agentReachIds[id]=true;
   }
   JSON.stringify({count:Object.keys(window.__agentReachIds).length})`,
  "--tab", tab,
]);

let last = 0;
let stable = 0;
for (let i = 0; i < 80 && stable < 5; i++) {
  await opencli(["browser", session, "scroll", "down", "--amount", "1400", "--tab", tab]);
  await new Promise((resolve) => setTimeout(resolve, 700));
  const result = JSON.parse(await opencli([
    "browser", session, "eval",
    `for(const a of document.querySelectorAll("a[href*='/reel/']")){
       const id=a.href.match(/\\/reel\\/(\\d+)/)?.[1];
       if(id)window.__agentReachIds[id]=true;
     }
     JSON.stringify({count:Object.keys(window.__agentReachIds).length,height:document.body.scrollHeight,y:scrollY})`,
    "--tab", tab,
  ]));
  if (result.count >= 400 && result.count === last) stable++;
  else stable = 0;
  last = result.count;
  process.stdout.write(`scroll=${i + 1} count=${result.count}\n`);
}

const ids = JSON.parse(await opencli([
  "browser", session, "eval",
  "JSON.stringify(Object.keys(window.__agentReachIds||{}))",
  "--tab", tab,
]));
fs.writeFileSync(idsPath, JSON.stringify(ids));
process.stdout.write(`done count=${ids.length} file=${idsPath}\n`);
