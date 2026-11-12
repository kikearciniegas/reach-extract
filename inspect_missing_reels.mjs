// Copyright (c) 2026 Rafael Arciniegas

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const session = "ab42xheb";
const ids = [
  "1729898438170223",
];

async function opencli(args, timeout = 45000) {
  const { stdout } = await execFileAsync("opencli", args, {
    timeout,
    maxBuffer: 8 * 1024 * 1024,
  });
  return stdout.trim();
}

const tab = JSON.parse(await opencli([
  "browser", session, "tab", "new", "https://www.facebook.com/",
])).page;

const inspectJs = `JSON.stringify((()=>{
  const id=location.pathname.match(/\\/reel\\/(\\d+)/)?.[1]||"";
  const found=[];
  const walk=o=>{
    if(!o||typeof o!=="object")return;
    if(Object.prototype.hasOwnProperty.call(o,"captions_url")){
      let serialized="";
      try{serialized=JSON.stringify(o)}catch(e){}
      if(serialized.includes(id))found.push({
        captions_url:o.captions_url||null,
        locales:o.video_available_captions_locales||[],
        permalink_url:o.permalink_url||null,
      });
    }
    for(const v of Object.values(o))walk(v);
  };
  for(const s of document.scripts){
    const t=s.textContent.trim();
    if(!t.startsWith("{")||!t.includes(id))continue;
    try{walk(JSON.parse(t))}catch(e){}
  }
  return {id,url:location.href,body:document.body.innerText.slice(0,1800),captions:found};
})())`;

for (const id of ids) {
  await opencli([
    "browser", session, "open", `https://www.facebook.com/reel/${id}/`,
    "--tab", tab,
  ]);
  await opencli(["browser", session, "wait", "time", "4", "--tab", tab]);
  await opencli([
    "browser", session, "eval",
    `for(const e of document.querySelectorAll("[role=button]")){
       if((e.innerText||"").trim()==="See more")e.click();
     }
     JSON.stringify({clicked:true})`,
    "--tab", tab,
  ]);
  await opencli(["browser", session, "wait", "time", "1", "--tab", tab]);
  console.log(await opencli(["browser", session, "eval", inspectJs, "--tab", tab]));
}

try {
  await opencli(["browser", session, "tab", "close", tab]);
} catch {}
