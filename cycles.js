function game(link, side) {
/*
Two-phone light-cycles game.
side is "a" or "b".
link.ready(startFn): startFn runs on both phones together.
link.send(obj) sends JSON to the other phone; set link.on=obj=>{} to receive, link.onclose to detect disconnects.
*/

  const GW=30,GH=40,D=2,TICK=160,DX=[0,1,0,-1],DY=[-1,0,1,0],m=side=="a"?0:1,J=64,TH=J*.3,RM=J-26;
  document.body.style="margin:0;background:#000;color:#0ff;font:16px monospace;text-align:center;user-select:none;touch-action:none";
  const msg=element("div"),can=element("canvas"),c2=can.getContext("2d"),stick=element("canvas"),sg=stick.getContext("2d"),pad=element("div");
  msg.style="padding:8px;min-height:1.4em";
  stick.style="display:block;margin:10px auto;position:relative;z-index:1;touch-action:none";
  stick.width=stick.height=2*J;
  pad.style="position:fixed;inset:0;touch-action:none";
  const c=Math.floor(Math.min(innerWidth/GW,(innerHeight-60-2*J-20)/GH));
  can.width=GW*c;can.height=GH*c;
  let grid,P,T,want,pend,myIn,theirIn,phase="wait",tm,score=[0,0],held=-1,tx=0,ty=0,drag=0;
  const sc=()=>"You/Them "+score[0]+"/"+score[1];
  const last=()=>pend.length?pend[pend.length-1]:want;

  function start(){
    grid=Array(GW*GH).fill(0);P=[{x:10,y:8},{x:19,y:31}];
    grid[P[0].y*GW+P[0].x]=1;grid[P[1].y*GW+P[1].x]=2;
    T=0;want=m?0:2;pend=[];myIn={};theirIn={};held=-1;
    for(let k=0;k<D;k++){myIn[k]=want;theirIn[k]=m?2:0}
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
    const dead=n.map(q=>q.x<0||q.y<0||q.x>=GW||q.y>=GH||grid[q.y*GW+q.x]>0);
    if(n[0].x==n[1].x&&n[0].y==n[1].y)dead[0]=dead[1]=true;
    n.forEach((q,i)=>{if(!dead[i]){P[i]=q;grid[q.y*GW+q.x]=i+1}});
    T++;draw();
    if(dead[0]||dead[1]){
      clearInterval(tm);phase="over";drawStick();
      let r="Draw";
      if(dead[m]&&!dead[1-m]){r="You crashed";score[1]++;navigator.vibrate&&navigator.vibrate(200)}
      else if(!dead[m]){r="They crashed";score[0]++}
      msg.textContent=sc()+": "+r;
    }
  }

  function draw(){
    c2.fillStyle="#001";c2.fillRect(0,0,can.width,can.height);
    grid.forEach((v,i)=>{if(v){c2.fillStyle=v-1==m?"#0ff":"#f80";c2.fillRect(i%GW*c,(i/GW|0)*c,c-1,c-1)}});
    c2.fillStyle="#fff";P.forEach(p=>c2.fillRect(p.x*c,p.y*c,c-1,c-1));
    c2.strokeStyle="#0a0";c2.lineWidth=2;c2.strokeRect(1,1,can.width-2,can.height-2);
  }
  function drawStick(){
    sg.clearRect(0,0,2*J,2*J);
    sg.strokeStyle="#0a0";sg.lineWidth=2;sg.beginPath();sg.arc(J,J,J-2,0,7);sg.stroke();
    const off=phase=="run"?last()%2:-1;
    for(let i=0;i<4;i++){
      const a=(i-1)*Math.PI/2,u=Math.cos(a),v=Math.sin(a);
      sg.fillStyle=i%2==off?"#044":"#0ff";
      sg.beginPath();sg.moveTo(J+u*(J-8),J+v*(J-8));
      sg.lineTo(J+u*(J-22)-v*8,J+v*(J-22)+u*8);sg.lineTo(J+u*(J-22)+v*8,J+v*(J-22)-u*8);sg.fill();
    }
    sg.fillStyle="rgba(0,255,255,.5)";sg.beginPath();sg.arc(J+tx,J+ty,22,0,7);sg.fill();
  }
  function aim(e){
    const r=stick.getBoundingClientRect(),dx=e.clientX-r.left-J,dy=e.clientY-r.top-J,ax=Math.abs(dx),ay=Math.abs(dy),k=Math.hypot(dx,dy);
    [tx,ty]=k>RM?[dx*RM/k,dy*RM/k]:[dx,dy];
    if(phase=="run"){
      let q=Math.max(ax,ay)<TH?-1:ax>ay?(dx>0?1:3):(dy>0?2:0);
      if(q>=0&&q%2==last()%2)q=-1;
      if(q<0)held=-1;
      else if(q!=held&&pend.length<2){pend.push(q);held=q}
    }
    drawStick();
  }

  const tap=()=>{if(phase!="run"&&phase!="ready"){phase="ready";msg.textContent="Waiting for opponent...";link.ready(start)}};
  pad.onpointerdown=tap;
  stick.onpointerdown=e=>{stick.setPointerCapture(e.pointerId);drag=1;tap();aim(e)};
  stick.onpointermove=e=>drag&&aim(e);
  stick.onpointerup=stick.onpointercancel=()=>{drag=0;tx=ty=0;held=-1;drawStick()};
  link.on=q=>{if(q.t=="i"&&theirIn)theirIn[q.k]=q.d};
  link.onclose=()=>{clearInterval(tm);msg.textContent="Disconnected"};
  msg.textContent="Tap to start. You are blue.";
  draw0();drawStick();
  function draw0(){c2.fillStyle="#001";c2.fillRect(0,0,can.width,can.height)}
}

