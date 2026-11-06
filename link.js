/*
link.js: shared two-phone link for the game.
Usage in a game page:  <script src="datamatrix.js"></script><script src="link.js"></script>, define game(link,side), then Link({title,game}).
  link.send(obj)        send a JSON message to the other phone
  link.on=m=>{...}      receive messages
  link.ready(fn)        "I am ready": fn() runs once BOTH players called ready (use for every round)
  link.onclose=()=>{}   connection lost
side is "a" or "b". element(tag,parent) is also available to games.
FLOW:
  Link({title,game})   on page load shows the title screen (a TAP TO CONNECT button, wifi/camera notes); a tap anywhere calls handshake(game).
  handshake(game)      opens the camera FIRST, so Chrome reveals the real LAN address in the offer instead of an mDNS name.
                       Then this phone creates an offer (data channel "x"), shows it as a Data Matrix code (datamatrix.js),
                       and scans every video frame for the other phone's code. The note line under the code tells the user what to do next
                       ("Point your camera at..."), changes on the answerer once its own code is shown, and is replaced by any error text.
                       Scanning an "o" code makes this phone the answerer: it sets the remote offer and shows its answer code.
                       Scanning an "a" code on the offerer sets the remote answer.
                       When the data channel opens, launch(side) stops the camera and the scan loop (stream=0 ends it), removes every page element except
                       scripts, and calls game(makeLink(chan),side). The offerer is side "a", the answerer is side "b".
  gather(pc,desc)      sets the local description, waits for ICE gathering to finish (4 s at most), returns the stripped SDP.
  show(text)           draws the code on a canvas, sized to the screen, replacing the previous one.
  makeLink(chan)       wraps the data channel as the link object. link.ready() sends {t:"rdy"} and fn() runs when both phones sent it.
  sdpStrip/sdpUnstrip  shrink an SDP to "type|ufrag|pwd|fingerprint|ip|port" (type a = answer, o = offer) and rebuild it.
                       The UDP host candidate is the only one kept, IPv4 preferred.
  H2B / B2H            fingerprint hex (with colons) <-> unpadded base64, to make the code smaller.
*/

let element=(tag,parent=document.body)=>parent.appendChild(document.createElement(tag));

function Link({title,game}){
  window.onload=()=>{
    document.title=title;document.body.style.background="#fff";
    Object.assign(element("div"),{
      style:"position:fixed;inset:0;font:20px monospace;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;user-select:none;line-height:1.4;padding:20px",
      innerHTML:title.split(" ").map(w=>[...w].join(" ")).join("<br>")+"<br><br><br><br><span style='border:2px solid #000;padding:10px 20px;font-size:16px'>TAP TO CONNECT</span><br><br><br><span style='font-size:13px;line-height:1.5'>Needs two Android Chrome phones on the same wifi.<br>Each phone asks for camera access, then scans the code on the other phone.</span>",
      onclick:()=>handshake(game)
    })
  }
}

const makeLink=chan=>{
  let me=0,them=0,start;
  const go=()=>me&&them&&(me=them=0,start()),
  link={
    send:o=>chan.send(JSON.stringify(o)),
    on:()=>{},
    ready(fn){me=1;start=fn;link.send({t:"rdy"});go()}
  };
  chan.onmessage=({data})=>{let m;try{m=JSON.parse(data)}catch{return}m.t=="rdy"?(them=1,go()):link.on(m)};
  chan.onclose=()=>link.onclose?.();
  return link
};

function handshake(game){
  let peer,chan,stream,last="",qr,answering=0;
  const box=element("div"),can=element("canvas",box),ctx=can.getContext("2d"),vid=element("video"),ovl=element("div"),note=element("div",box),
  gather=async(pc,desc)=>{
    const done=new Promise(r=>{pc.onicecandidate=e=>e.candidate||r();setTimeout(r,4000)});
    await pc.setLocalDescription(desc);await done;
    return sdpStrip(pc.localDescription.sdp)
  },
  show=text=>{
    qr?.remove();
    const maxPx=Math.min(innerWidth*0.6, innerHeight*0.25),
    [grid,n]=datamatrix(text),pad=2,cell=Math.floor(maxPx/(n+2*pad))||1,W=cell*(n+2*pad),
    c=document.createElement("canvas"),g=c.getContext("2d");
    c.width=c.height=W;
    g.fillStyle="#fff";g.fillRect(0,0,W,W);g.fillStyle="#000";
    grid.map((row,j)=>row.map((v,i)=>v&&g.fillRect((i+pad)*cell,(j+pad)*cell,cell,cell)));
    c.style="max-height:25vh;width:auto;height:auto;object-fit:contain";
    box.insertBefore(qr=c,can)
  },
  launch=side=>{
    stream?.getTracks().forEach(t=>t.stop());stream=0;
    [...document.body.children].forEach(e=>e.tagName!="SCRIPT"&&e.remove());
    game(makeLink(chan),side)
  },
  offer=async()=>{
    peer=new RTCPeerConnection;chan=peer.createDataChannel("x");
    chan.onopen=()=>launch("a");
    show(await gather(peer,await peer.createOffer()))
  },
  scanned=async s=>{
    if(s==last||s.length<20)return;
    last=s;
    const type=s[0];
    if(answering||type!="o"&&type!="a")return;
    try{
      if(type=="o"){
        answering=1;can.style.display="none";
        peer=new RTCPeerConnection;
        peer.ondatachannel=e=>{chan=e.channel;chan.onopen=()=>launch("b")};
        await peer.setRemoteDescription({type:"offer",sdp:sdpUnstrip(s)});
        show(await gather(peer,await peer.createAnswer()));
        note.textContent="Now hold this code up to the other phone"
      }else await peer.setRemoteDescription({type:"answer",sdp:sdpUnstrip(s)});
      ovl.style.opacity=1;setTimeout(()=>ovl.style.opacity=0,1000)
    }catch(e){note.textContent=e.message}
  };
  box.style="position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#000;gap:8px;padding:8px;box-sizing:border-box;overflow:hidden";
  can.style="max-width:85vw;max-height:35vh;width:auto;height:auto;object-fit:contain;flex-shrink:1";
  note.style="color:#0f0;font:13px monospace;text-align:center";
  vid.style="display:none";vid.autoplay=vid.muted=vid.playsInline=true;
  ovl.style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;font:20px sans-serif;color:#fff;background:rgba(0,128,0,.8);z-index:9;opacity:0;transition:opacity .3s";
  ovl.textContent="SCAN OK!";
  note.textContent="Point your camera at the code on the other phone";
  navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}}).then(async s=>{
    stream=vid.srcObject=s;await vid.play();
    const det=new BarcodeDetector({formats:["data_matrix"]}),
    loop=async()=>{
      if(!stream)return;
      ({videoWidth:can.width,videoHeight:can.height}=vid);
      ctx.drawImage(vid,0,0,can.width,can.height);
      try{const[hit]=await det.detect(can);hit&&scanned(hit.rawValue)}catch{}
      requestAnimationFrame(loop)
    };
    offer();loop()
  }).catch(e=>note.textContent="Camera or scanner error: "+e.message)
}


const H2B=hex=>btoa(String.fromCharCode(...(hex.match(/../g)||[]).map(x=>parseInt(x,16)))).replace(/=/g,""),
B2H=b64=>[...atob(b64)].map(c=>c.charCodeAt(0).toString(16).padStart(2,"0")).join("").toUpperCase().match(/../g).join(":"),
sdpStrip=sdp=>{
  const grab=re=>(sdp.match(re)||[])[1],
  cands=(sdp.match(/^a=candidate:.+$/gm)||[]).map(l=>l.trim().split(" ")).filter(c=>c[2].toLowerCase()=="udp"),
  c=cands.find(c=>!c[4].includes(":"))||cands[0],
  f=[/^a=setup:active/m.test(sdp)?"a":"o",grab(/^a=ice-ufrag:(.+)/m),grab(/^a=ice-pwd:(.+)/m),H2B((grab(/^a=fingerprint:sha-256 (.+)/m)||"").replace(/:/g,"")),c&&c[4],c&&c[5]];
  if(f.some(v=>!v))throw Error("SDP missing a field (no UDP candidate?)");
  return f.join("|")
},
sdpUnstrip=(s,[type,ufrag,pwd,fp,ip,port]=s.split("|"))=>["v=0","o=- 1 2 IN IP4 0.0.0.0","s=-","t=0 0","m=application 9 UDP/DTLS/SCTP webrtc-datachannel","a=ice-ufrag:"+ufrag,"a=ice-pwd:"+pwd,"a=fingerprint:sha-256 "+B2H(fp),"a=setup:"+(type=="o"?"actpass":"active"),"a=candidate:1 1 udp 2113937151 "+ip+" "+port+" typ host","a=end-of-candidates",""].join("\r\n");

