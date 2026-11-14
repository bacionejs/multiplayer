/*
index.js: two-phone game shell.
Shell docs, the sample's game API comment and the intro text live in comments.js.
*/

function element(tag,parent=gbox,props){return Object.assign(parent.appendChild(parent.ownerDocument.createElement(tag)),props)}
init();

function init(){

element("style",document.head,{textContent:`
  html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#111;color:#fff;font-family:monospace}body{display:flex;flex-direction:column;align-items:center;text-align:center}
  .toolbar{display:flex;flex-shrink:0;width:100%;background:#181818;border-bottom:2px solid #007acc}
  .toolbar button{flex:1;padding:14px;background:#222;color:#555;border:0;border-right:1px solid #111;font:14px monospace;user-select:none}.toolbar button:enabled{background:#007acc;color:#fff}
  .screen{display:none;flex:1;min-height:0;width:100%;flex-direction:column;align-items:center;justify-content:center;box-sizing:border-box;padding:20px;overflow:hidden;position:relative}.screen.on{display:flex}
  .intro,.code{overflow-y:auto;-webkit-overflow-scrolling:touch;justify-content:flex-start}
  .game{background:#000;contain:paint}
  .game iframe{flex:1;min-height:0;width:100%;border:0;background:#000}
  .intro p{font-size:13px;color:#aaa;max-width:320px;line-height:1.5;text-align:left}
  .code textarea{width:100%;max-width:420px;height:60vh;background:#000;color:#0f0;border:1px solid #444;padding:10px;font:12px monospace;box-sizing:border-box;resize:vertical;text-align:left}
  .code select{width:100%;max-width:420px;margin-bottom:8px;padding:10px;background:#222;color:#fff;border:1px solid #444;font:14px monospace;box-sizing:border-box}`})

let link,side="a",ssrc="",sname="",running=0,cleanup,body=document.body,
  toolbar=element("div",body,{className:"toolbar"}),
  [hand,play,back]=["Handshake","Play","Back"].map(text=>element("button",toolbar,{textContent:text})),
  makescreen=props=>element("div",body,{className:"screen",...props}),
  intro=makescreen({className:"screen intro on",innerHTML:COMMENTS.intro}),
  hscreen=makescreen(),cscreen=makescreen({className:"screen code"}),
  nbox=element("select",cscreen),cbox=element("textarea",cscreen),gbox=makescreen({className:"screen game"}),
  show=s=>[...body.children].forEach(x=>x.classList.toggle("on",x==s)),enable=b=>[hand,play,back].forEach(x=>x.disabled=x!=b)

let FRAME='<!DOCTYPE html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0;background:#000;color:#fff;font:16px monospace">',
  db=new Promise((ok,no)=>{let r=indexedDB.open("games",1);r.onupgradeneeded=()=>r.result.createObjectStore("games");r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)}),
  store=(mode,op)=>db.then(d=>new Promise((ok,no)=>{let r=op(d.transaction("games",mode).objectStore("games"));r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})),
  gname=fn=>fn.toString().match(/^[^(]*\(\s*\w+\s*,\s*\w+\s*,\s*\w+\s*,\s*\w+\s*=\s*(["'])(\w+)\1\s*[,)]/)?.[2];

db.catch(()=>{});
nbox.onchange=()=>{let n=nbox.value;if(n==sname)cbox.value=ssrc;else store("readonly",s=>s.get(n)).then(c=>{if(c!=null)cbox.value=c}).catch(()=>{})};
hand.onclick=()=>{enable();show(hscreen);hscreen.innerHTML="";handshake(hscreen).then(r=>entercode(r.link,r.side)).catch(e=>{alert("Handshake error: "+e.message);show(intro);enable(hand)})}
play.onclick=()=>{if(running)return;let src=cbox.value;load(src,(g,err)=>{if(!g)return alert("Failed to load game code: "+err.message);link.send({sys:"load",code:src});save(src,g.fn);let e=start(g);if(e){goback(true);alert("Error running game: "+e.message)}})}
back.onclick=()=>goback(true)

function onsys(m){
  if(m.sys=="load"){if(running||typeof m.code!="string")return;cbox.value=m.code;load(m.code,(g,err)=>{let e=err||start(g);if(e){link.send({sys:"error",msg:e.message});g&&goback(false);alert("Received game failed: "+e.message)}})}
  else if(m.sys=="back"){running&&goback(false)}
  else if(m.sys=="error"&&running){goback(false);alert("The other phone couldn't run the game: "+m.msg)}
}
function load(src,cb){
  running=1;show(gbox);enable(back);gbox.innerHTML="";
  let ifr=element("iframe",gbox);
  ifr.onload=()=>{
    if(!ifr.isConnected)return;
    let win=ifr.contentWindow,fn;
    win.element=(tag,parent=win.document.body,props)=>element(tag,parent,props);
    try{fn=parsegame(src,win)}catch(e){goback(false);return cb(null,e)}
    cb({fn,ifr})
  };
  ifr.srcdoc=FRAME
}
function start({fn,ifr}){link.reset();try{let r=fn(link,side,{w:ifr.clientWidth,h:ifr.clientHeight});typeof r=="function"&&(cleanup=r)}catch(e){return e}}
function goback(notify){notify&&link.send({sys:"back"});try{cleanup?.()}catch{}cleanup=0;running=0;link.reset();gbox.innerHTML="";show(cscreen);enable(play)}
function entercode(l,s){link=l;side=s;link.sys=onsys;if(typeof game=="function"){sname=gname(game)||"";ssrc=COMMENTS.sample(game)}cbox.value=ssrc;refresh();show(cscreen);enable(play)}
function save(src,fn){let name=gname(fn);if(!name)return;if(name==sname){if(src!=ssrc)alert("sample can't be changed");return}store("readwrite",s=>s.put(src,name)).then(()=>refresh(name)).catch(()=>{})}
function refresh(pick){return store("readonly",s=>s.getAllKeys()).catch(()=>[]).then(keys=>{let names=[...(sname?[sname]:[]),...keys.filter(k=>k!=sname).sort()];nbox.innerHTML="";names.forEach(n=>element("option",nbox,{textContent:n,value:n}));nbox.value=pick||sname||names[0]||""})}
function hold(el,callback,timer){el.onpointerdown=_=>timer=setTimeout(callback,500);el.onpointerup=el.onpointercancel=_=>clearTimeout(timer)}hold(hand,()=>hand.disabled||entercode({send(){},on(){},ready(f){f()},reset(){}},"a"));hand.oncontextmenu=()=>false
function parsegame(src,W=window){if(/\b(function|const|let|var)\s+game\b/.test(src))try{let fn=new W.Function("link","side","area",src+"\nreturn typeof game=='function'?game:null")();if(fn)return fn}catch{}return new W.Function("link","side","area",src)}

enable(hand)


}

