/*
index.js
Two-phone game shell.
Shows a toolbar (Handshake / Play / Back) and runs a game on both phones.
Flow: Handshake connects the phones (handshake(onConnect, container)), the code screen shows the game source in a textarea, and Play sends that code to the other phone and launches it on both. Back returns both to the code screen. Long-press Handshake for a single-device dev bypass.
Saving: if the 4th parameter of game has a one-word string default (name="cycles"), Play saves the code to IndexedDB under that name, only on the phone that pressed Play. The built-in sample's name is reserved and never overwritten. A dropdown on the code screen reloads saved games.
Games define function game(link, side, area): side is "a" or "b", area = {w,h} is the usable pixel space, and link has send(obj), on, ready(startFn) and onclose.
element(tag, parent=game area, props): creates a DOM element, appends it to parent, assigns props, and returns it; shared with games.
*/

element("style",document.head,{textContent:`
  html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#111;color:#fff;font-family:monospace}body{display:flex;flex-direction:column;align-items:center;text-align:center}
  .toolbar{display:flex;flex-shrink:0;width:100%;background:#181818;border-bottom:2px solid #007acc}
  .toolbar button{flex:1;padding:14px;background:#222;color:#555;border:0;border-right:1px solid #111;font:14px monospace;user-select:none}.toolbar button:enabled{background:#007acc;color:#fff}
  .screen{display:none;flex:1;min-height:0;width:100%;flex-direction:column;align-items:center;justify-content:center;box-sizing:border-box;padding:20px;overflow:hidden;position:relative}.screen.on{display:flex}
  .intro,.code{overflow-y:auto;-webkit-overflow-scrolling:touch;justify-content:flex-start}
  .game{background:#000;contain:paint}
  .intro p{font-size:13px;color:#aaa;max-width:320px;line-height:1.5;text-align:left}
  .code textarea{width:100%;max-width:420px;height:60vh;background:#000;color:#0f0;border:1px solid #444;padding:10px;font:12px monospace;box-sizing:border-box;resize:vertical;text-align:left}
  .code select{width:100%;max-width:420px;margin-bottom:8px;padding:10px;background:#222;color:#fff;border:1px solid #444;font:14px monospace;box-sizing:border-box}`})
let link,side="a",builtinSrc="",builtinName="",body=document.body,
  toolbar=element("div",body,{className:"toolbar"}),
  [handshakeBtn,playBtn,backBtn]=["Handshake","Play","Back"].map(text=>element("button",toolbar,{textContent:text})),
  makeScreen=props=>element("div",body,{className:"screen",...props}),
  introScreen=makeScreen({className:"screen intro on",innerHTML:"<p>Click <b>Handshake</b> above to perform the camera/barcode handshake, and then click <b>Play</b>.<br><br>OPTIONAL<br>Play the sample game or replace the code in the textarea with a new game. Only one person needs to paste it: whoever clicks <b>Play</b> first instantly transmits and launches it on both phones.<br><br>Games save automatically on that person's phone when they click <b>Play</b>, under the name in the game's last parameter (the sample's is <b>cycles</b>). Pick a saved game from the dropdown on the code screen. The sample can't be overwritten, so give your own game a new one-word name to keep it.<br><br><i>To switch games later, both players must click <b>Back</b> to return to the code screen together.</i><br><br><i>Tip: paste the sample game from the textarea into an AI and ask it to make a new game like battleship. Tell it to give the new game its own one-word name in that last parameter.</i></p>"}),
  handshakeScreen=makeScreen(),codeScreen=makeScreen({className:"screen code"}),
  nameBox=element("select",codeScreen),
  codeBox=element("textarea",codeScreen),
  gameBox=makeScreen({className:"screen game"}),
  showScreen=s=>[...body.children].forEach(x=>x.classList.toggle("on",x==s)),
  enableOnly=b=>[handshakeBtn,playBtn,backBtn].forEach(x=>x.disabled=x!=b)

const db=new Promise((ok,no)=>{let r=indexedDB.open("games",1);r.onupgradeneeded=()=>r.result.createObjectStore("games");r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)}),
  store=(mode,op)=>db.then(d=>new Promise((ok,no)=>{let r=op(d.transaction("games",mode).objectStore("games"));r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})),
  norm=s=>s.replace(/\r\n?/g,"\n"),
  gameName=fn=>fn.toString().match(/^[^(]*\(\s*\w+\s*,\s*\w+\s*,\s*\w+\s*,\s*\w+\s*=\s*(["'])(\w+)\1\s*[,)]/)?.[2];
db.catch(()=>{});
nameBox.onchange=()=>{let n=nameBox.value;if(n==builtinName)codeBox.value=builtinSrc;else store("readonly",s=>s.get(n)).then(c=>{if(c!=null)codeBox.value=c}).catch(()=>{})};
handshakeBtn.onclick=()=>{enableOnly();showScreen(handshakeScreen);handshakeScreen.innerHTML="";try{handshake(enterCode,handshakeScreen)}catch(e){alert("Handshake error: "+e.message);showScreen(introScreen);enableOnly(handshakeBtn)}}
playBtn.onclick=()=>{let src=codeBox.value,fn=parseGame(src);if(!fn)return;try{link.send({t:"load_game",code:src})}catch{}saveGame(src,fn);runGame(fn)}
backBtn.onclick=()=>{for(let i=setTimeout(_=>_);i--;)clearTimeout(i);for(let i=setInterval(_=>_);i--;)clearInterval(i);gameBox.innerHTML="";showScreen(codeScreen);enableOnly(playBtn);listenForGame()}

function element(tag,parent=gameBox,props){return Object.assign(parent.appendChild(document.createElement(tag)),props)}
function listenForGame(){link.on=msg=>{if(msg?.t=="load_game"){codeBox.value=msg.code;let fn=parseGame(msg.code);fn&&runGame(fn)}}}
function parseGame(src){try{let fn=new Function("link","side","area",src+"\nreturn typeof game=='function'?game:null")();if(fn)return fn}catch{}try{return new Function("link","side","area",src)}catch(e){alert("Failed to parse game code: "+e.message)}}
function measureArea(){let style=getComputedStyle(gameBox),pad=k=>parseFloat(style["padding"+k])||0;return{w:gameBox.clientWidth-pad("Left")-pad("Right"),h:gameBox.clientHeight-pad("Top")-pad("Bottom")}}
function runGame(fn){showScreen(gameBox);gameBox.innerHTML="";enableOnly(backBtn);try{fn(link,side,measureArea())}catch(e){alert("Error running game: "+e.message)}}
function enterCode(l,s){link=l;side=s;listenForGame();if(typeof game=="function"){builtinSrc=game.toString();builtinName=gameName(game)||""}codeBox.value=builtinSrc||"// Default game not found";refreshNames();showScreen(codeScreen);enableOnly(playBtn)}
function saveGame(src,fn){let name=gameName(fn);if(!name)return;if(name==builtinName){if(norm(src)!=norm(builtinSrc))alert('"'+name+'" is the built-in sample and can\'t be changed. Rename it in the code (name="'+name+'") to save your version.');return}store("readwrite",s=>s.put(src,name)).then(()=>refreshNames(name)).catch(()=>{})}
function refreshNames(pick){return store("readonly",s=>s.getAllKeys()).catch(()=>[]).then(keys=>{let names=[...(builtinName?[builtinName]:[]),...keys.filter(k=>k!=builtinName).sort()];nameBox.innerHTML="";names.forEach(n=>element("option",nameBox,{textContent:n,value:n}));nameBox.value=pick||builtinName||names[0]||""})}
function onLongPress(el,callback,timer){el.onpointerdown=_=>timer=setTimeout(callback,500);el.onpointerup=el.onpointercancel=_=>clearTimeout(timer)}onLongPress(handshakeBtn,()=>handshakeBtn.disabled||enterCode({send(){},on(){}},"a"));handshakeBtn.oncontextmenu=()=>false

enableOnly(handshakeBtn)

