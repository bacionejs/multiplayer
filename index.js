let element=(t,p=box,o)=>Object.assign(p.appendChild(document.createElement(t)),o)
element("style",document.head,{textContent:`
html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#111;color:#fff;font-family:monospace}body{display:flex;flex-direction:column;align-items:center;text-align:center}
.t{display:flex;flex-shrink:0;width:100%;background:#181818;border-bottom:2px solid #007acc}
.t button{flex:1;padding:14px;background:#222;color:#555;border:0;border-right:1px solid #111;font:14px monospace;user-select:none}.t button:enabled{background:#007acc;color:#fff}
.s{display:none;flex:1;min-height:0;width:100%;flex-direction:column;align-items:center;justify-content:center;box-sizing:border-box;padding:20px;overflow:hidden;position:relative}.s.on{display:flex}
.g{background:#000;contain:paint}
.i p{font-size:13px;color:#aaa;max-width:320px;line-height:1.5;text-align:left}
.m textarea{width:100%;max-width:420px;height:60vh;background:#000;color:#0f0;border:1px solid #444;padding:10px;font:12px monospace;box-sizing:border-box;resize:vertical;text-align:left}`})
let link,side="a",B=document.body,
tb=element("div",B,{className:"t"}),
[hs,play,back]=["Handshake","Play","Back"].map(t=>element("button",tb,{textContent:t})),
scr=o=>element("div",B,{className:"s",...o}),
init=scr({className:"s i on",innerHTML:"<p>Click <b>Handshake</b> above to begin the camera/barcode handshake.<br><br>After the handshake, play the sample game or replace the code in the textarea with a new game. Only one person needs to paste it: whoever clicks <b>Play</b> first instantly transmits and launches it on both phones.<br><br><i>To switch games later, both players must click <b>Back</b> to return to the code screen together.</i><br><br><i>Tip: paste the sample game from the textarea into an AI and ask it to make a new game like battleship.</i></p>"}),
hsc=scr(),menu=scr({className:"s m"}),
code=element("textarea",menu),
box=scr({className:"s g"}),
show=s=>[...B.children].forEach(x=>x.classList.toggle("on",x==s)),
mode=b=>[hs,play,back].forEach(x=>x.disabled=x!=b)
mode(hs)
let listen=()=>link.on=d=>{if(d?.t=="load_game"){code.value=d.code;let f=parse(d.code);f&&run(f)}}
let parse=c=>{try{let g=new Function("link","side","area",c+"\nreturn typeof game=='function'?game:null")();if(g)return g}catch{}try{return new Function("link","side","area",c)}catch(e){alert("Failed to parse game code: "+e.message)}}
let area=()=>{let c=getComputedStyle(box),p=k=>parseFloat(c["padding"+k])||0;return{w:box.clientWidth-p("Left")-p("Right"),h:box.clientHeight-p("Top")-p("Bottom")}}
let run=f=>{show(box);box.innerHTML="";mode(back);try{f(link,side,area())}catch(e){alert("Error running game: "+e.message)}}
let enter=(l,s)=>{link=l;side=s;listen();code.value=typeof game=="function"?game.toString():"// Default game not found";show(menu);mode(play)}
hs.onclick=()=>{mode();show(hsc);hsc.innerHTML="";try{handshake(enter,hsc)}catch(e){alert("Handshake error: "+e.message);show(init);mode(hs)}}
// long-press Handshake = single-device dev bypass
let hold=(e,c,t)=>{e.onpointerdown=_=>t=setTimeout(c,500);e.onpointerup=e.onpointercancel=_=>clearTimeout(t)};hold(hs,()=>hs.disabled||enter({send(){},on(){}},"a"));hs.oncontextmenu=()=>false
play.onclick=()=>{let c=code.value,f=parse(c);if(!f)return;try{link.send({t:"load_game",code:c})}catch{}run(f)}
back.onclick=()=>{for(let i=setTimeout(_=>_);i--;)clearTimeout(i);for(let i=setInterval(_=>_);i--;)clearInterval(i);box.innerHTML="";show(menu);mode(play);listen()}
