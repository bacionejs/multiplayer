function game(link, side, area, name="cycles") {
/*
Two-phone light-cycles game.
side is "a" or "b".
link.ready(startFn): startFn runs on both phones together.
area = {w,h}: pixels available to the game (already below the toolbar and inside padding). Size everything from this, not from innerWidth/innerHeight.
link.send(obj) sends JSON to the other phone; set link.on=obj=>{} to receive, link.onclose to detect disconnects.
name: ignored by the game. The code screen reads its one-word string default as the game's name and saves the code under it on the phone that presses Play. Remove it or leave it empty to not save.
element(tag, parent=game area, props): global helper that creates a DOM element, appends it to parent, assigns props (e.g. {textContent, className}), and returns it.
Each game runs in its own same-origin iframe, so its timers, listeners and globals disappear when Back removes the iframe. This isolates games from the shell; it is not a security sandbox. A game may also return a cleanup function, which Back calls first.
*/

// Game rules
const GW=30,GH=40,D=2,TICK=160,MAX_QUEUE=2,BUZZ_MS=200;
// Directions (index into DX/DY). Opposite directions share parity.
const UP=0,RIGHT=1,DOWN=2,LEFT=3,NONE=-1,DX=[0,1,0,-1],DY=[-1,0,1,0];
const EMPTY=-1;
// Drawing
const GAP=1,LINE=2,TAU=Math.PI*2,QUARTER=Math.PI/2;
const C={bg:"#001",me:"#0ff",them:"#f80",head:"#fff",line:"#0a0",dim:"#044",knob:"rgba(0,255,255,.5)",text:"#0ff"};
// Joystick
const J=64,DEADZONE=.3,KNOB=22,RIM=2,ARROW={tip:8,base:22,wing:8};
const TH=J*DEADZONE,RM=J-KNOB-2*RIM;
// Layout
const STICK_GAP=10;

const m=side=="a"?0:1;
// Player 0 starts top-left of centre moving down; player 1 is its mirror image moving up.
const S0={x:GW/3|0,y:GH/5|0},START=[S0,{x:GW-1-S0.x,y:GH-1-S0.y}];
const sameAxis=(a,b)=>a%2==b%2;

document.body.style="margin:0;background:#000;color:"+C.text+";font:16px monospace;text-align:center;user-select:none;touch-action:none";
const msg=element("div"),can=element("canvas"),c2=can.getContext("2d"),stick=element("canvas"),sg=stick.getContext("2d"),pad=element("div");
msg.style="padding:8px;min-height:1.4em";
stick.style="display:block;margin:"+STICK_GAP+"px auto;position:relative;z-index:1;touch-action:none";
stick.width=stick.height=2*J;
pad.style="position:fixed;inset:0;touch-action:none";

// Cell size from the space left under the message line and above the joystick
const c=Math.max(1,Math.floor(Math.min(area.w/GW,(area.h-msg.offsetHeight-2*J-2*STICK_GAP)/GH)));
can.width=GW*c;can.height=GH*c;

let grid,P,T,want,pend,myIn,theirIn,phase="wait",tm,score=[0,0],held=NONE,tx=0,ty=0,drag=0;
const sc=()=>"You/Them "+score[0]+"/"+score[1];
const last=()=>pend.length?pend[pend.length-1]:want;

function start(){
  grid=Array(GW*GH).fill(EMPTY);P=START.map(p=>({x:p.x,y:p.y}));
  P.forEach((p,i)=>grid[p.y*GW+p.x]=i);
  T=0;want=m?UP:DOWN;pend=[];myIn={};theirIn={};held=NONE;
  for(let k=0;k<D;k++){myIn[k]=want;theirIn[k]=m?DOWN:UP}
  phase="run";msg.textContent=sc();
  clearInterval(tm);tm=setInterval(step,TICK);draw();drawStick();
}
function step(){
  if(phase!="run")return;
  if(!(T+D in myIn)){
    if(pend.length)want=pend.shift();
    myIn[T+D]=want;link.send({t:"i",k:T+D,d:want});
  }
  if(!(T in theirIn)||!(T in myIn))return;
  const d=[];d[m]=myIn[T];d[1-m]=theirIn[T];
  const n=P.map((p,i)=>({x:p.x+DX[d[i]],y:p.y+DY[d[i]]}));
  const dead=n.map(q=>q.x<0||q.y<0||q.x>=GW||q.y>=GH||grid[q.y*GW+q.x]!=EMPTY);
  if(n[0].x==n[1].x&&n[0].y==n[1].y)dead[0]=dead[1]=true;
  n.forEach((q,i)=>{if(!dead[i]){P[i]=q;grid[q.y*GW+q.x]=i}});
  T++;draw();
  if(dead[0]||dead[1]){
    clearInterval(tm);phase="over";drawStick();
    let r="Draw";
    if(dead[m]&&!dead[1-m]){r="You crashed";score[1]++;navigator.vibrate&&navigator.vibrate(BUZZ_MS)}
    else if(!dead[m]){r="They crashed";score[0]++}
    msg.textContent=sc()+": "+r;
  }
}

function draw(){
  c2.fillStyle=C.bg;c2.fillRect(0,0,can.width,can.height);
  grid.forEach((v,i)=>{if(v!=EMPTY){c2.fillStyle=v==m?C.me:C.them;c2.fillRect(i%GW*c,(i/GW|0)*c,c-GAP,c-GAP)}});
  c2.fillStyle=C.head;P.forEach(p=>c2.fillRect(p.x*c,p.y*c,c-GAP,c-GAP));
  c2.strokeStyle=C.line;c2.lineWidth=LINE;c2.strokeRect(LINE/2,LINE/2,can.width-LINE,can.height-LINE);
}
function drawStick(){
  sg.clearRect(0,0,2*J,2*J);
  sg.strokeStyle=C.line;sg.lineWidth=LINE;sg.beginPath();sg.arc(J,J,J-RIM,0,TAU);sg.stroke();
  const off=phase=="run"?last()%2:NONE;
  for(let i=0;i<4;i++){
    const a=(i-1)*QUARTER,u=Math.cos(a),v=Math.sin(a),{tip,base,wing}=ARROW;
    sg.fillStyle=i%2==off?C.dim:C.me;
    sg.beginPath();sg.moveTo(J+u*(J-tip),J+v*(J-tip));
    sg.lineTo(J+u*(J-base)-v*wing,J+v*(J-base)+u*wing);sg.lineTo(J+u*(J-base)+v*wing,J+v*(J-base)-u*wing);sg.fill();
  }
  sg.fillStyle=C.knob;sg.beginPath();sg.arc(J+tx,J+ty,KNOB,0,TAU);sg.fill();
}
function aim(e){
  const r=stick.getBoundingClientRect(),dx=e.clientX-r.left-J,dy=e.clientY-r.top-J,ax=Math.abs(dx),ay=Math.abs(dy),k=Math.hypot(dx,dy);
  [tx,ty]=k>RM?[dx*RM/k,dy*RM/k]:[dx,dy];
  if(phase=="run"){
    let q=Math.max(ax,ay)<TH?NONE:ax>ay?(dx>0?RIGHT:LEFT):(dy>0?DOWN:UP);
    if(q!=NONE&&sameAxis(q,last()))q=NONE;
    if(q==NONE)held=NONE;
    else if(q!=held&&pend.length<MAX_QUEUE){pend.push(q);held=q}
  }
  drawStick();
}

const tap=()=>{if(phase!="run"&&phase!="ready"){phase="ready";msg.textContent="Waiting for opponent...";link.ready(start)}};
pad.onpointerdown=tap;
stick.onpointerdown=e=>{stick.setPointerCapture(e.pointerId);drag=1;tap();aim(e)};
stick.onpointermove=e=>drag&&aim(e);
stick.onpointerup=stick.onpointercancel=()=>{drag=0;tx=ty=0;held=NONE;drawStick()};
link.on=q=>{if(q.t=="i"&&theirIn)theirIn[q.k]=q.d};
link.onclose=()=>{clearInterval(tm);msg.textContent="Disconnected"};
msg.textContent="Tap to start. You are blue.";
c2.fillStyle=C.bg;c2.fillRect(0,0,can.width,can.height);drawStick();


}
