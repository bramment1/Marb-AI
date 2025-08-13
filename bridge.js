(() => {
  // MARB_PAGE_BRIDGE — stable single copy
  if (window.__marbBridgeStable) return;
  window.__marbBridgeStable = true;

  let fsHandle = null;
  let rootName = '';
  let pending = null; // { src, id }

  function mk(t, a){ const e=document.createElement(t); if(a)Object.assign(e,a);
    for(let i=2;i<arguments.length;i++){ const k=arguments[i]; e.appendChild(typeof k==='string'?document.createTextNode(k):k); }
    return e;
  }

  // Small in-page overlay (valid user gesture)
  const ov  = mk('div',{style:'position:fixed;inset:0;display:none;background:rgba(0,0,0,.5);z-index:2147483646'});
  const box = mk('div',{style:'position:absolute;left:50%;top:20%;transform:translateX(-50%);min-width:520px;background:#0e162b;color:#e6e8ef;border:1px solid #1b2440;border-radius:12px;padding:12px;font-family:system-ui,Segoe UI,Roboto,Arial'});
  box.appendChild(mk('div',{style:'font-weight:700;margin:0 0 8px 0'}, 'Choose project folder'));
  const row = mk('div',{style:'display:flex;gap:8px;flex-wrap:wrap'});
  function btn(t,g){ const b=mk('button',{type:'button'}); b.textContent=t; b.style.cssText=g?'padding:6px 10px;border-radius:10px;border:1px solid #1b2440;background:transparent;color:#e6e8ef;cursor:pointer':'padding:6px 10px;border-radius:10px;border:1px solid #1b2440;background:#334155;color:#fff;cursor:pointer'; return b; }
  const bDocs=btn('Use Documents (auto-create)'), bDown=btn('Use Downloads (auto-create)'), bBrowse=btn('Browse manually'), bClose=btn('Close',true);
  row.append(bDocs,bDown,bBrowse,bClose); box.appendChild(row); ov.appendChild(box); document.documentElement.appendChild(ov);

  const show=()=>ov.style.display='block', hide=()=>ov.style.display='none';

  async function ensureChild(base){
    let name='marb-project';
    for(let i=0;i<50;i++){
      try{
        const d=await base.getDirectoryHandle(name,{create:true});
        const p=await d.requestPermission({mode:'readwrite'});
        if(p!=='granted') throw new Error('No write permission');
        return d;
      }catch(e){
        if(e && e.name==='InvalidModificationError'){ name='marb-project-'+(i+2); continue; }
        throw e;
      }
    }
    throw new Error('Could not create subfolder');
  }
  async function pickManual(){ const h=await window.showDirectoryPicker({mode:'readwrite'}); fsHandle=h; rootName=h.name||'project'; try{await h.requestPermission({mode:'readwrite'})}catch(_){} }
  async function pickIn(si){ const h=await window.showDirectoryPicker({mode:'readwrite',startIn:si}); fsHandle=await ensureChild(h); rootName=fsHandle.name||'project'; }

  function replyOK(extra){ if(!pending) return; const payload=Object.assign({type:'MARB_BRIDGE_RES', id:pending.id, ok:true, rootName}, extra||{}); try{ pending.src.postMessage(payload,'*'); } finally { pending=null; hide(); } }
  function replyErr(msg){ if(!pending) return; try{ pending.src.postMessage({type:'MARB_BRIDGE_RES', id:pending.id, ok:false, error:String(msg||'error')}, '*'); } finally { pending=null; hide(); } }

  bClose.addEventListener('click', ()=>replyErr('cancelled'));
  bDocs .addEventListener('click', async()=>{ try{ await pickIn('documents'); replyOK(); }catch(e){ alert((e&&e.message)||e); } });
  bDown .addEventListener('click', async()=>{ try{ await pickIn('downloads'); replyOK(); }catch(e){ alert((e&&e.message)||e); } });
  bBrowse.addEventListener('click', async()=>{ try{ await pickManual(); replyOK(); }catch(_){ /* cancel */ } });

  async function list(){ if(!fsHandle) return {ok:false,error:'NO_HANDLE'}; const lines=[]; for await(const [n,en] of fsHandle.entries()){ lines.push((en.kind==='directory'?'📁 ':'• ')+n+(en.kind==='directory'?'/':'')); } lines.sort(); return {ok:true,lines,rootName}; }
  async function read(p){ if(!fsHandle) return {ok:false,error:'NO_HANDLE'}; let d=fsHandle; const parts=(p||'').split('/').filter(Boolean); const f=parts.pop(); for(const x of parts){ d=await d.getDirectoryHandle(x);} const fh=await d.getFileHandle(f); const file=await fh.getFile(); return {ok:true,text:await file.text()}; }
  async function write(p,c){ if(!fsHandle) return {ok:false,error:'NO_HANDLE'}; let d=fsHandle; const parts=(p||'').split('/').filter(Boolean); const f=parts.pop(); for(const x of parts){ d=await d.getDirectoryHandle(x,{create:true}); } const fh=await d.getFileHandle(f,{create:true}); const w=await fh.createWritable(); await w.write(c||''); await w.close(); return {ok:true}; }

  window.addEventListener('message', async (ev)=>{
    const m=ev&&ev.data; if(!m || m.type!=='MARB_BRIDGE_REQ') return;
    try{
      if(m.op==='PICK_BLOCKING'){ pending={src:ev.source,id:m.id}; show(); return; }
      if(m.op==='LIST'){ const r=await list(); ev.source&&ev.source.postMessage({type:'MARB_BRIDGE_RES',id:m.id,ok:r.ok,rootName:r.rootName,lines:r.lines,error:r.error||null},'*'); return; }
      if(m.op==='READ'){ const r=await read((m.payload&&m.payload.path)||''); ev.source&&ev.source.postMessage({type:'MARB_BRIDGE_RES',id:m.id,ok:r.ok,text:r.text||null,error:r.error||null},'*'); return; }
      if(m.op==='WRITE'){ const r=await write((m.payload&&m.payload.path)||'', (m.payload&&m.payload.content)||''); ev.source&&ev.source.postMessage({type:'MARB_BRIDGE_RES',id:m.id,ok:r.ok,error:r.error||null},'*'); return; }
    }catch(e){
      ev.source&&ev.source.postMessage({type:'MARB_BRIDGE_RES',id:m.id,ok:false,error:String((e&&e.message)||e)},'*');
    }
  },false);
})();