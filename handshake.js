/*handshake.js: WebRTC optical handshake via Data Matrix barcodes.*/
let makeLink=chan=>{
  let me=0,them=0,start,go=()=>me&&them&&(me=them=0,start()),
  link={send:o=>{try{chan.send(JSON.stringify(o))}catch{}},on(){},ready(fn){me=1;start=fn;link.send({t:"rdy"});go()}};
  chan.onmessage=({data})=>{let m;try{m=JSON.parse(data)}catch{return}m.t=="rdy"?(them=1,go()):link.on(m)};
  chan.onclose=()=>link.onclose?.();
  return link
};

let handshake=(onConnected,container=document.body)=>{
  let el=(t,p=container)=>p.appendChild(document.createElement(t)),
  peer,chan,stream,last="",qr,answering=0,
  box=el("div"),can=el("canvas",box),ctx=can.getContext("2d"),vid=el("video",box),ovl=el("div",box),note=el("div",box),
  gather=async(pc,desc)=>{
    let done=new Promise(r=>{pc.onicecandidate=e=>e.candidate||r();setTimeout(r,4000)});
    await pc.setLocalDescription(desc);await done;
    return sdpStrip(pc.localDescription.sdp)
  },
  show=text=>{
    qr?.remove();
    let[grid,n]=datamatrix(text),m=n+4,cell=Math.floor(Math.min(innerWidth*.6,innerHeight*.25)/m)||1,W=cell*m,c=document.createElement("canvas"),g=c.getContext("2d");
    c.width=c.height=W;
    g.fillStyle="#fff";g.fillRect(0,0,W,W);g.fillStyle="#000";
    grid.map((row,j)=>row.map((v,i)=>v&&g.fillRect((i+2)*cell,(j+2)*cell,cell,cell)));
    c.style="max-height:25vh;width:auto;height:auto;object-fit:contain";
    box.prepend(qr=c)
  },
  launch=side=>{
    stream?.getTracks().forEach(t=>t.stop());stream=0;
    box.remove();
    onConnected(makeLink(chan),side)
  },
  offer=async()=>{
    peer=new RTCPeerConnection;chan=peer.createDataChannel("x");
    chan.onopen=()=>launch("a");
    show(await gather(peer,await peer.createOffer()))
  },
  scanned=async s=>{
    if(s==last||s.length<20)return;
    last=s;
    let k=s[0];
    if(answering||!"oa".includes(k))return;
    try{
      if(k=="o"){
        answering=1;can.style.display="none";
        peer=new RTCPeerConnection;
        peer.ondatachannel=e=>{chan=e.channel;chan.onopen=()=>launch("b")};
        await peer.setRemoteDescription({type:"offer",sdp:sdpUnstrip(s)});
        show(await gather(peer,await peer.createAnswer()));
        note.textContent="Now hold this barcode up to the other phone"
      }else await peer.setRemoteDescription({type:"answer",sdp:sdpUnstrip(s)});
      ovl.style.opacity=1;setTimeout(()=>ovl.style.opacity=0,1000)
    }catch(e){note.textContent=e.message}
  };

  box.style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#000;gap:8px;padding:8px;box-sizing:border-box;overflow:hidden;z-index:99";
  can.style="max-width:85vw;max-height:35vh;width:auto;height:auto;object-fit:contain;flex-shrink:1";
  note.style="color:#0f0;font:13px monospace;text-align:center";
  vid.hidden=1;vid.autoplay=vid.muted=vid.playsInline=true;
  ovl.style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:20px sans-serif;color:#fff;background:rgba(0,128,0,.8);z-index:100;opacity:0;transition:opacity .3s;pointer-events:none";
  ovl.textContent="SCAN OK!";
  note.textContent="Point your camera at the barcode on the other phone";

  navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}}).then(async s=>{
    stream=vid.srcObject=s;await vid.play();
    let det=new BarcodeDetector({formats:["data_matrix"]}),
    loop=async()=>{
      if(!stream)return;
      ({videoWidth:can.width,videoHeight:can.height}=vid);
      ctx.drawImage(vid,0,0,can.width,can.height);
      try{let[hit]=await det.detect(can);hit&&scanned(hit.rawValue)}catch{}
      requestAnimationFrame(loop)
    };
    offer();loop()
  }).catch(e=>note.textContent="Camera or scanner error: "+e.message)
};

let H2B=hex=>btoa(String.fromCharCode(...(hex.match(/../g)||[]).map(x=>parseInt(x,16)))).replace(/=/g,""),
B2H=b64=>[...atob(b64)].map(c=>(256+c.charCodeAt()).toString(16).slice(1)).join(":").toUpperCase(),
sdpStrip=sdp=>{
  let g=k=>sdp.match(RegExp("^a="+k+"(.+)","m"))?.[1],
  cands=(sdp.match(/^a=candidate:.+$/gm)||[]).map(l=>l.split(" ")).filter(c=>/udp/i.test(c[2])),
  c=cands.find(c=>!c[4].includes(":"))||cands[0],
  f=[/^a=setup:active/m.test(sdp)?"a":"o",g("ice-ufrag:"),g("ice-pwd:"),H2B((g("fingerprint:sha-256 ")||"").replace(/:/g,"")),c&&c[4],c&&c[5]];
  if(f.some(v=>!v))throw Error("SDP missing a field (no UDP candidate?)");
  return f.join("|")
},
sdpUnstrip=(s,[type,ufrag,pwd,fp,ip,port]=s.split("|"))=>["v=0","o=- 1 2 IN IP4 0.0.0.0","s=-","t=0 0","m=application 9 UDP/DTLS/SCTP webrtc-datachannel","a=ice-ufrag:"+ufrag,"a=ice-pwd:"+pwd,"a=fingerprint:sha-256 "+B2H(fp),"a=setup:"+(type=="o"?"actpass":"active"),"a=candidate:1 1 udp 2113937151 "+ip+" "+port+" typ host","a=end-of-candidates",""].join("\r\n");

