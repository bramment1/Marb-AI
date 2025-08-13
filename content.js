(() => {
  if (window.__marbContent) return;
  window.__marbContent = { frame:null, lastToggle:0 };

  function openSidebar(){
    if(window.__marbContent.frame) return;
    const f=document.createElement("iframe");
    f.src = chrome.runtime.getURL("sidebar.html");
    Object.assign(f.style,{position:"fixed",top:"0",right:"0",width:"560px",height:"100vh",border:"none",zIndex:"2147483647",boxShadow:"0 0 16px rgba(0,0,0,.55)",background:"transparent"});
    document.documentElement.appendChild(f);
    window.__marbContent.frame=f;
    window.addEventListener("message", onMsg);
  }
  function closeSidebar(){
    if(!window.__marbContent.frame) return;
    window.removeEventListener("message", onMsg);
    window.__marbContent.frame.remove();
    window.__marbContent.frame=null;
  }
  function onMsg(ev){ if(ev && ev.data && ev.data.type==="CLOSE_MARB_SIDEBAR") closeSidebar(); }
  function toggleSidebar(){
    const now=Date.now(); if(now-window.__marbContent.lastToggle<700) return;
    window.__marbContent.lastToggle=now;
    window.__marbContent.frame?closeSidebar():openSidebar();
  }
  chrome.runtime.onMessage.addListener(m=>{ if(m && m.type==="TOGGLE_SIDEBAR") toggleSidebar(); });
  window.addEventListener("message", e=>{ if(e && e.data && e.data.type==="CLOSE_MARB_SIDEBAR") closeSidebar(); });

  // ---- Inject page-world bridge (geen template literals)
  function __marb_page_bridge__(){
    if (window.__marbBridgeStable) return; window.__marbBridgeStable = true;

    var fsHandle = null, rootName = '';
    var pending = null; // { src, id }

    function mk(t,a){ var e=document.createElement(t); if(a) Object.assign(e,a);
      for(var i=2;i<arguments.length;i++){ var k=arguments[i]; e.appendChild(typeof k==='string'?document.createTextNode(k):k); }
      return e;
    }

    var ov  = mk('div',{style:'position:fixed;inset:0;display:none;background:rgba(0,0,0,.5);z-index:2147483646'});
    var box = mk('div',{style:'position:absolute;left:50%;top:20%;transform:translateX(-50%);min-width:520px;background:#0e162b;color:#e6e8ef;border:1px solid #1b2440;border-radius:12px;padding:12px;font-family:system-ui,Segoe UI,Roboto,Arial'});
    box.appendChild(mk('div',{style:'font-weight:700;margin:0 0 8px 0'}, 'Choose project folder'));
    var row = mk('div',{style:'display:flex;gap:8px;flex-wrap:wrap'});
    function btn(t,ghost){ var b=mk('button',{type:'button'}); b.textContent=t; b.style.cssText=ghost?'padding:6px 10px;border-radius:10px;border:1px solid #1b2440;background:transparent;color:#e6e8ef;cursor:pointer':'padding:6px 10px;border-radius:10px;border:1px solid #1b2440;background:#334155;color:#fff;cursor:pointer'; return b; }
    var bDocs=btn('Use Documents (auto-create)'), bDown=btn('Use Downloads (auto-create)'), bBrowse=btn('Browse manually'), bClose=btn('Close',true);
    row.appendChild(bDocs); row.appendChild(bDown); row.appendChild(bBrowse); row.appendChild(bClose);
    box.appendChild(row); ov.appendChild(box); document.documentElement.appendChild(ov);

    function show(){ ov.style.display='block'; } function hide(){ ov.style.display='none'; }

    async function ensureChild(base){
      var name='marb-project';
      for(var i=0;i<50;i++){
        try{
          var d=await base.getDirectoryHandle(name,{create:true});
          var p=await d.requestPermission({mode:'readwrite'});
          if(p!=='granted') throw new Error('No write permission');
          return d;
        }catch(e){
          if(e && e.name==='InvalidModificationError'){ name='marb-project-'+(i+2); continue; }
          throw e;
        }
      }
      throw new Error('Could not create subfolder');
    }

    async function pickManual(){
      var h=await window.showDirectoryPicker({mode:'readwrite'});
      fsHandle=h; rootName = (h && h.name) ? h.name : 'project';
      try{ await h.requestPermission({mode:'readwrite'}); }catch(_){}
    }
    async function pickIn(startIn){
      var h=await window.showDirectoryPicker({mode:'readwrite',startIn:startIn});
      fsHandle=await ensureChild(h);
      rootName = (fsHandle && fsHandle.name) ? fsHandle.name : 'project';
    }

    function replyOK(extra){
      if(!pending) return;
      var payload={type:'MARB_BRIDGE_RES', id: pending.id, ok:true, rootName: rootName};
      if(extra && typeof extra==='object') Object.assign(payload, extra);
      try{ pending.src.postMessage(payload,'*'); } finally{ pending=null; hide(); }
    }
    function replyErr(msg){
      if(!pending) return;
      try{ pending.src.postMessage({type:'MARB_BRIDGE_RES', id: pending.id, ok:false, error:String(msg||'error')}, '*'); } finally{ pending=null; hide(); }
    }

    bClose.addEventListener('click', function(){ replyErr('cancelled'); });
    bDocs.addEventListener('click',  async function(){ try{ await pickIn('documents'); replyOK(); }catch(e){ alert((e&&e.message)||e); } });
    bDown.addEventListener('click',  async function(){ try{ await pickIn('downloads'); replyOK(); }catch(e){ alert((e&&e.message)||e); } });
    bBrowse.addEventListener('click',async function(){ try{ await pickManual(); replyOK(); }catch(_){ } });

    async function list(){
      if(!fsHandle) return {ok:false,error:'NO_HANDLE'};
      var lines=[], it;
      for await (it of fsHandle.entries()){
        var n=it[0], en=it[1];
        lines.push((en.kind==='directory'?'📁 ':'• ')+n+(en.kind==='directory'?'/':''));
      }
      lines.sort();
      return {ok:true,lines:lines,rootName:rootName};
    }
    async function read(p){
      if(!fsHandle) return {ok:false,error:'NO_HANDLE'};
      var d=fsHandle; var parts=(p||'').split('/').filter(Boolean); var f=parts.pop();
      for(var i=0;i<parts.length;i++){ d=await d.getDirectoryHandle(parts[i]); }
      var fh=await d.getFileHandle(f); var file=await fh.getFile();
      return {ok:true,text:await file.text()};
    }
    async function write(p,c){
      if(!fsHandle) return {ok:false,error:'NO_HANDLE'};
      var d=fsHandle; var parts=(p||'').split('/').filter(Boolean); var f=parts.pop();
      for(var i=0;i<parts.length;i++){ d=await d.getDirectoryHandle(parts[i],{create:true}); }
      var fh=await d.getFileHandle(f,{create:true}); var w=await fh.createWritable(); await w.write(c||''); await w.close();
      return {ok:true};
    }

    window.addEventListener('message', async function(ev){
      var m=ev && ev.data; if(!m || m.type!=='MARB_BRIDGE_REQ') return;
      try{
        if(m.op==='PICK_BLOCKING'){ pending={src:ev.source,id:m.id}; show(); return; }
        if(m.op==='LIST'){ var r1=await list(); ev.source && ev.source.postMessage({type:'MARB_BRIDGE_RES',id:m.id,ok:r1.ok,rootName:r1.rootName,lines:r1.lines,error:r1.error||null},'*'); return; }
        if(m.op==='READ'){ var path=(m.payload&&m.payload.path)||''; var r2=await read(path); ev.source && ev.source.postMessage({type:'MARB_BRIDGE_RES',id:m.id,ok:r2.ok,text:r2.text||null,error:r2.error||null},'*'); return; }
        if(m.op==='WRITE'){ var p=(m.payload&&m.payload.path)||''; var c=(m.payload&&m.payload.content)||''; var r3=await write(p,c); ev.source && ev.source.postMessage({type:'MARB_BRIDGE_RES',id:m.id,ok:r3.ok,error:r3.error||null},'*'); return; }
      }catch(e){
        ev.source && ev.source.postMessage({type:'MARB_BRIDGE_RES',id:m.id,ok:false,error:String((e&&e.message)||e)}, '*');
      }
    }, false);
  }

  try{
    const s=document.createElement('script');
    s.textContent='('+__marb_page_bridge__.toString()+')();';
    (document.head||document.documentElement).appendChild(s);
  }catch(e){ console.warn('Bridge inject failed:', e); }
})();