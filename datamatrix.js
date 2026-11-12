/*
datamatrix.js
MINIMAL Data Matrix ECC 200 (ISO/IEC 16022) barcode encoder
The stripped SDP input is 94 ascii characters, so we don't need the full encoder (4 kilobytes).
Usage: <script src="datamatrix.js"></script>; let [g, n] = datamatrix(ascii);
  g[y][x] is 1 for black; n x n modules incl. finder/timing; NO quiet zone
*/

function datamatrix(strippedsdp){
let d=[],i,j,f,r=Array(48).fill(0),x=1,e=[],L=[],g=[1],N=36,P=20,o=35,C,a=[],p=0,y=4,z=0,G=[],u,v,
M=(a,b)=>a&&b?e[(L[a]+L[b])%255]:0,
h=(y,x,q,b)=>(y<0&&(y+=N,x+=4),x<0&&(x+=N,y+=4),a[y*N+x]=C[q]>>7-b&1),
s=(m,q)=>m.map(([y,x],b)=>h(y,x,q,b)),
U=(y,x,q)=>[[2,2],[2,1],[1,2],[1,1],[1,0],[0,2],[0,1],[0,0]].map(([c,b],i)=>h(y-c,x-b,q,i));

strippedsdp.replace(/\d\d|./g,m=>d.push(m[1]?130+ +m:m.charCodeAt()+1));

for(d.length<114&&d.push(129);d.length<114;)d.push((129+149*(d.length+1)%253)%254+1);

for(i=0;i<255;i++)e[i]=x,L[x]=i,x=x*2^(x>127)*301;
for(i=1;i<=48;g=f,i++)for(f=[...g,0],j=0;j<g.length;j++)f[j+1]^=M(g[j],e[i]);
d.map(v=>{f=v^r.shift();for(j=0;j<48;)r[j]^=M(f,g[++j])});
C=[...d,...r];

do{
  y==N&!z&&s([[o,0],[o,1],[o,2],[0,34],[0,o],[1,o],[2,o],[3,o]],p++);
  do{y<N&&z>=0&&a[y*N+z]==null&&U(y,z,p++);y-=2;z+=2}while(y>=0&&z<N);y++;z+=3;
  do{y>=0&&z<N&&a[y*N+z]==null&&U(y,z,p++);y+=2;z-=2}while(y<N&&z>=0);y+=3;z++;
}while(y<N||z<N);

for(y=0;y<40;y++)for(G[y]=[],x=0;x<40;x++)u=x%P,v=y%P,G[y][x]=!u|v==19?1:!v?1-u%2:u==19?v%2:a[((y/P|0)*18+v-1)*N+(x/P|0)*18+u-1];

return[G,40]
}
