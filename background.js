chrome.commands.onCommand.addListener((c)=>{ if(c==="toggle-sidebar") toggleActive(); });
chrome.action.onClicked.addListener(toggleActive);
async function toggleActive(){ const [tab]=await chrome.tabs.query({active:true,currentWindow:true}); if(!tab?.id) return; trySend(tab.id); }
function trySend(tabId,attempt=1){
  chrome.tabs.sendMessage(tabId,{type:"TOGGLE_SIDEBAR"}, async ()=>{
    if(!chrome.runtime.lastError) return;
    if(attempt>=2){ console.warn("Toggle failed", chrome.runtime.lastError?.message); return; }
    try{ await chrome.scripting.executeScript({target:{tabId},files:["content.js"],world:"ISOLATED"}); setTimeout(()=>trySend(tabId,attempt+1),150);}catch(e){console.warn("inject fail",e?.message||e);}
  });
}

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function waitDone(tabId,timeout=45000){ return new Promise(res=>{ const t0=Date.now(); const l=(id,info)=>{ if(id===tabId&&info.status==="complete"){ chrome.tabs.onUpdated.removeListener(l); res(); } }; chrome.tabs.onUpdated.addListener(l); const t=setInterval(()=>{ if(Date.now()-t0>timeout){ clearInterval(t); chrome.tabs.onUpdated.removeListener(l); res(); } },400); }); }

async function ensureChat(){ let [tab]=await chrome.tabs.query({url:"https://chat.openai.com/*"}); if(!tab){ tab=await chrome.tabs.create({url:"https://chat.openai.com/"}); } await waitDone(tab.id); await sleep(800); return tab; }
async function sendPrompt(tabId, text){
  const [{result}] = await chrome.scripting.executeScript({
    target:{tabId}, world:"MAIN",
    func: async (p)=>{
      const nap=ms=>new Promise(r=>setTimeout(r,ms));
      const pick=()=>document.querySelector('textarea[data-testid="prompt-textarea"]')||document.querySelector("textarea");
      let box=null; for(let i=0;i<120;i++){ box=pick(); if(box) break; await nap(250); }
      if(!box) return {ok:false,error:"Geen invoerveld"};
      const setVal=(el,val)=>{ const proto=Object.getPrototypeOf(el); const d=Object.getOwnPropertyDescriptor(proto,"value"); d?.set?d.set.call(el,val):el.value=val; el.dispatchEvent(new Event("input",{bubbles:true})); };
      setVal(box,p);
      const btn = document.querySelector('button[data-testid="send-button"]')||document.querySelector('form button[type="submit"]');
      btn?btn.click():box.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",code:"Enter",keyCode:13,which:13,bubbles:true}));
      // wait answer settle
      const sel=()=>[...document.querySelectorAll('[data-message-author-role="assistant"], .prose, .markdown, article')].at(-1);
      let last=""; for(let i=0;i<240;i++){ const n=sel(); const txt=(n?.innerText||"").trim(); if(txt && txt===last) return {ok:true,text:txt}; last=txt||last; await nap(500); }
      return last?{ok:true,text:last}:{ok:false,error:"Timeout"};
    },
    args:[text]
  });
  return result;
}

// Native bridge
function nativeSend(payload){
  try{
    const port=chrome.runtime.connectNative("com.marb.fsbridge");
    return new Promise((resolve)=>{
      let done=false; const t=setTimeout(()=>{ if(!done) resolve({error:"Native timeout"}); },180000);
      port.onMessage.addListener(r=>{ done=true; clearTimeout(t); resolve(r); });
      port.onDisconnect.addListener(()=>{ if(!done) resolve({error: chrome.runtime.lastError?.message || "Native host niet bereikbaar"}); });
      port.postMessage(payload);
    });
  }catch(e){ return Promise.resolve({error:"NO_HOST"}); }
}

chrome.runtime.onConnect.addListener((port)=>{
  if(port.name!=="marb:ui") return;
  let keepAlive = setInterval(()=>port.postMessage({type:"PING"}), 25000);
  port.onDisconnect.addListener(()=>{ clearInterval(keepAlive); });

  port.onMessage.addListener(async (msg)=>{
    if(msg?.type==="START_PIPELINE"){
      const id = crypto.randomUUID();
      const post = (data)=>port.postMessage(Object.assign({id},data));
      try{
        post({type:"JOB_STARTED"});
        post({type:"STEP", label:"Taalkeuze…"});
        const chat=await ensureChat();
        const langRes = await sendPrompt(chat.id, msg.payload.askLangPrompt);
        if(!langRes?.ok) throw new Error("Taalkeuze: "+(langRes?.error||"onbekend"));
        post({type:"LANG_CHOICE_RAW", text: langRes.text});

        // Build superprompt in SW (parse JSON safely-ish)
        let choice={language:"",reason:"",tips:[]};
        try{ const raw=langRes.text.trim().replace(/^```json\\s*|\\s*```$/g,""); choice=JSON.parse(raw);}catch{}
        const tips = Array.isArray(choice.tips)?choice.tips:[];
        const ideaInUI = ""; // we embed idea already in askLangPrompt; not needed here.

        const superPrompt = [
          "Je bent een senior software-architect én lead developer.",
          "",
          "Context:",
          `- Gewenste programmeertaal: ${choice.language}`,
          `- Reden: ${choice.reason}`,
          `- Best practices (samenvatting): ${tips.join("; ")}`,
          "",
          "Zet de onderstaande opdracht om in een UITGEBREID uitvoerbaar project met ALLE BESTANDEN COMPLEET.",
          "",
          "OPDRACHT:",
          "(zelfde als ingestuurd bij taalkeuze prompt; verwerk dit impliciet)",
          "",
          "OUTPUT (STRICT JSON, GEEN ANDERE TEKST):",
          "{",
          '  "baseDir": "korte-naam-zonder-spaties",',
          '  "summary": "1-2 zinnen",',
          '  "files": [ { "path": "rel/pad/bestand.ext", "content": "VOLLEDIGE bestandsinhoud" } ]',
          "}",
          "",
          "REGELS:",
          "- Alle code compleet (geen TODO/stubs).",
          "- Voeg README.md toe met Windows install/run-stappen.",
          "- Eventuele build/config opnemen.",
          "- Forward slashes in paden.",
          "- GEEN tekst buiten de JSON."
        ].join("\\n");

        post({type:"SUPERPROMPT_READY", superPrompt});

        post({type:"STEP", label:"Plan genereren…"});
        const planRes = await sendPrompt(chat.id, superPrompt);
        if(!planRes?.ok) throw new Error("Plan: "+(planRes?.error||"onbekend"));

        // Parse plan JSON
        let plan;
        try{ const raw=planRes.text.trim().replace(/^```json\\s*|\\s*```$/g,""); plan=JSON.parse(raw); }catch(e){ throw new Error("Plan JSON parse fout"); }
        if(!plan?.files?.length) throw new Error("Plan bevat geen files");
        if(!plan.baseDir || /[^a-zA-Z0-9._-]/.test(plan.baseDir)) plan.baseDir="project";
        post({type:"PLAN_READY", plan});

        post({type:"STEP", label:"Schrijven (na bevestiging)…"});
        // Native write is triggered from UI button with confirmation.
        post({type:"DONE_WRITE"});
        post({type:"JOB_DONE"});
      } catch(e){
        port.postMessage({type:"JOB_ERROR", error: String(e?.message||e)});
      }
    }
  });
});

// Fallback one-off messages (native ops)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse)=>{
  (async ()=>{
    if(msg.type==="GENERATE_FILES_NATIVE"){
      const r=await nativeSend({cmd:"write_files", baseDirAbs: msg.baseDirAbs, planBaseDir: msg.plan?.baseDir, files: msg.plan?.files, overwrite: true});
      return sendResponse(r);
    }
    if(msg.type==="DELETE_PATHS_NATIVE"){
      const r=await nativeSend({cmd:"delete_paths", baseDirAbs: msg.baseDirAbs, relPaths: msg.relPaths||[]});
      return sendResponse(r);
    }
    if(msg.type==="APPLY_PATCH_NATIVE"){
      const r=await nativeSend({cmd:"apply_patch", baseDirAbs: msg.baseDirAbs, patch: msg.patch});
      return sendResponse(r);
    }
    if(msg.type==="HOST_CMD"){
      const r=await nativeSend(msg.payload);
      return sendResponse(r);
    }
  })().catch(e=>sendResponse({error:String(e)}));
  return true;
});
chrome.runtime.onMessage.addListener((msg, sender, sendResponse)=>{
  if (msg && msg.type === "GET_ACTIVE_TAB") {
    (async () => {
      const [tab] = await chrome.tabs.query({active:true,currentWindow:true});
      sendResponse({ tabId: tab?.id ?? null });
    })();
    return true;
  }
});

