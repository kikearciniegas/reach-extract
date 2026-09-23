// Copyright (c) 2026 Rafael Arciniegas

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";

const execFileAsync = promisify(execFile);
const session = "ab42xheb";
const outputPath = new URL("./agent-reach-facebook-reels.jsonl", import.meta.url).pathname;
const idsPath = new URL("./agent-reach-facebook-reel-ids.json", import.meta.url).pathname;
const concurrency = Number(process.argv[2] || 5);
const limit = Number(process.argv[3] || 0);

async function opencli(args, timeout = 45000) {
  const { stdout } = await execFileAsync("opencli", args, {
    timeout,
    maxBuffer: 8 * 1024 * 1024,
  });
  return stdout.trim();
}

function parseJsonOutput(value) {
  return JSON.parse(value);
}

let indexTab = null;
let allIds;
if (fs.existsSync(idsPath)) {
  allIds = JSON.parse(fs.readFileSync(idsPath, "utf8"));
} else {
  const indexPage = parseJsonOutput(await opencli([
    "browser", session, "open",
    "https://www.facebook.com/profile.php?id=100091065962204&sk=reels_tab",
  ]));
  indexTab = indexPage.page;
  await opencli([
    "browser", session, "eval",
    "window.__agentReachIds={}; JSON.stringify({ready:true})",
    "--tab", indexTab,
  ]);
  let indexCount = 0;
  let stableChunks = 0;
  for (let chunk = 0; chunk < 6 && stableChunks < 2; chunk++) {
    const chunkOutput = await opencli([
      "browser", session, "eval",
      `(async()=>{
      const ids=window.__agentReachIds||{};
      for(let i=0;i<18;i++){
        for(const a of document.querySelectorAll("a[href*='/reel/']")){
          const id=a.href.match(/\\/reel\\/(\\d+)/)?.[1];
          if(id)ids[id]=true;
        }
        window.scrollTo(0,document.body.scrollHeight);
        await new Promise(r=>setTimeout(r,1000));
      }
      window.__agentReachIds=ids;
      return JSON.stringify({count:Object.keys(ids).length});
    })()`,
      "--tab", indexTab,
    ], 60000);
    const nextCount = parseJsonOutput(chunkOutput).count;
    if (nextCount >= 400 && nextCount === indexCount) stableChunks++;
    else stableChunks = 0;
    indexCount = nextCount;
  }
  const linkOutput = await opencli([
    "browser", session, "eval",
    "JSON.stringify(Object.keys(window.__agentReachIds||{}))",
    "--tab", indexTab,
  ]);
  allIds = parseJsonOutput(linkOutput);
  fs.writeFileSync(idsPath, JSON.stringify(allIds));
}

const completed = new Map();
if (fs.existsSync(outputPath)) {
  for (const line of fs.readFileSync(outputPath, "utf8").split("\n")) {
    if (!line.trim()) continue;
    const row = JSON.parse(line);
    if (row.text) completed.set(row.id, row);
  }
}

let pending = ["1729898438170223"];
if (limit > 0) pending = pending.slice(0, limit);

const tabs = [];
for (let i = 0; i < Math.min(concurrency, Math.max(1, pending.length)); i++) {
  const created = parseJsonOutput(await opencli([
    "browser", session, "tab", "new", "https://www.facebook.com/",
  ]));
  tabs.push(created.page);
}

const extractionJs = `JSON.stringify((()=>{
  const id=location.pathname.match(/\\/reel\\/(\\d+)/)?.[1]||"";
  const out=[];
  const fallback=[];
  const seen=new Set();
  const walk=o=>{
    if(!o||typeof o!=="object")return;
    if(o.message&&typeof o.message.text==="string"){
      if(!fallback.includes(o.message.text))fallback.push(o.message.text);
      let serialized="";
      try{serialized=JSON.stringify(o)}catch(e){}
      if(serialized.includes(id)&&!seen.has(o.message.text)){
        seen.add(o.message.text);
        out.push(o.message.text);
      }
    }
    for(const v of Object.values(o))walk(v);
  };
  for(const s of document.scripts){
    const t=s.textContent.trim();
    if(!t.startsWith("{")||!t.includes(id)||!t.includes("message"))continue;
    try{walk(JSON.parse(t))}catch(e){}
  }
  return {id,url:location.href,title:document.title,text:(out.sort((a,b)=>b.length-a.length)[0]||""),candidates:out.length,fallback:fallback.slice(0,8)};
})())`;

async function processOne(id, tab) {
  const url = `https://www.facebook.com/reel/${id}/`;
  try {
    await opencli(["browser", session, "open", url, "--tab", tab]);
    let row = parseJsonOutput(await opencli([
      "browser", session, "eval", extractionJs, "--tab", tab,
    ]));
    if (!row.text) {
      await opencli(["browser", session, "wait", "time", "4", "--tab", tab]);
      row = parseJsonOutput(await opencli([
        "browser", session, "eval", extractionJs, "--tab", tab,
      ]));
    }
    return { ...row, requested_id: id };
  } catch (error) {
    return { id, requested_id: id, url, text: "", error: String(error) };
  }
}

let processed = 0;
for (let i = 0; i < pending.length; i += tabs.length) {
  const batch = pending.slice(i, i + tabs.length);
  const rows = await Promise.all(batch.map((id, j) => processOne(id, tabs[j])));
  fs.appendFileSync(outputPath, rows.map((row) => JSON.stringify(row)).join("\n") + "\n");
  processed += rows.length;
  const ok = rows.filter((row) => row.text).length;
  process.stdout.write(`processed=${processed}/${pending.length} ok=${ok}/${rows.length}\n`);
}

for (const tab of tabs) {
  try {
    await opencli(["browser", session, "tab", "close", tab]);
  } catch {}
}
if (indexTab) {
  try {
    await opencli(["browser", session, "tab", "close", indexTab]);
  } catch {}
}

const totalRows = fs.existsSync(outputPath)
  ? fs.readFileSync(outputPath, "utf8").split("\n").filter(Boolean).length
  : 0;
process.stdout.write(`done rows=${totalRows} indexed=${allIds.length}\n`);
