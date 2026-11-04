// datamatrix.js: minimal Data Matrix (ECC 200) encoder, used by link.js to show the connection code.
// Usage:  <script src="datamatrix.js"></script> (a global function, no dependencies)
//   const [grid,size]=datamatrix(text)
//     text   string to encode
//     grid   size x size array of rows, 1 = black module, including finder and timing patterns
//     size   modules per side (no quiet zone, the caller adds the border)
// SCALE: this is for SMALL payloads only. The input is a stripped WebRTC SDP string,
//   fields joined by "|": type (1 char, a or o), ufrag (4 chars), pwd (24 chars),
//   fingerprint (43 chars, base64 of a SHA-256), IP (7-15 chars, IPv4), port (up to 5 digits).
//   That is typically 90-100 ASCII characters. It packs to about 85-95 codewords,
//   which gives a symbol of roughly 36-40 modules per side.
//   It is not meant for large data, files, or long text.
// LIMITS: ASCII mode only (digit pairs packed). Characters above 127 are NOT supported.
//   Square symbols only, 36x36 up to 48x48 (32x32 mapping and up), a single Reed-Solomon block, max 174 data codewords.
//   Longer input throws "too long". No C40, Text, X12, EDIFACT or Base 256 modes, no rectangles,
//   no multi-block interleaving.
// Golfed on purpose: written for AI readers, not humans. All helpers are nested inside datamatrix, so only one global exists.
// SIZES: rows are [s = mapping matrix size, n = regions per side, data codewords, ecc codewords]. s and n stay short
//   because they appear many times in the placement code. The symbol side is s+2n modules.
// STAGES, in order:
//   encode(str)             text -> data codewords (ASCII mode, digit pairs packed)
//   pad(data,dataLen)       fill data codewords up to the symbol capacity
//   reedSolomon(data,eccLen) data codewords -> error-correction codewords (GF(256), poly 301)
//   place(codewords,s)      codewords -> s x s mapping matrix (ISO 16022 Annex F module placement)
//   frame(grid,s,n)         mapping matrix -> final grid with finder and timing patterns, returns [grid,size]

function datamatrix(text){
  const SIZES=[[32,2,86,42],[36,2,114,48],[40,2,144,56],[44,2,174,68]],
  encode=str=>{
    const bytes=new TextEncoder().encode(str),data=[];
    for(let i=0,cur,nxt;cur=bytes[i],nxt=bytes[i+1],i<bytes.length;i++)cur>47&&cur<58&&nxt>47&&nxt<58?(data.push(cur*10+nxt-398),i++):data.push(cur+1);
    return data
  },
  pad=(data,dataLen)=>{
    data.length<dataLen&&data.push(129);
    for(let v;data.length<dataLen;data.push(v>254?v-254:v))v=129+149*(data.length+1)%253+1;
    return data
  },
  reedSolomon=(data,eccLen)=>{
    const EXP=[],LOG=[],mul=(a,b)=>a&&b?EXP[(LOG[a]+LOG[b])%255]:0;
    for(let i=0,x=1;i<255;x*=2,x>255&&(x^=301))EXP[i]=x,LOG[x]=i++;
    let gen=[1],nextGen,i,factor,ecc=Array(eccLen).fill(0);
    for(i=1;i<=eccLen;gen=nextGen,i++)nextGen=[...gen,0],gen.map((v,j)=>nextGen[j+1]^=mul(v,EXP[i]));
    for(const x of data){factor=x^ecc.shift();ecc.push(0);for(i=0;factor&&i<eccLen;i++)ecc[i]^=mul(gen[i+1],factor)}
    return ecc
  },
  place=(codewords,s)=>{
    const grid=[...Array(s)].map(()=>[]);
    let k=0,row=4,col=0;
    const put=bits=>{bits.map(([r,c],i)=>{r<0&&(r+=s,c+=4-(s+4)%8);c<0&&(c+=s,r+=4-(s+4)%8);grid[r][c]=codewords[k]>>7-i&1});k++},
    utah=(r,c)=>put([[r-2,c-2],[r-2,c-1],[r-1,c-2],[r-1,c-1],[r-1,c],[r,c-2],[r,c-1],[r,c]]),
    free=(r,c)=>r>=0&&c>=0&&r<s&&c<s&&grid[r][c]===undefined;
    do{
      row==s&&!col&&put([[s-1,0],[s-1,1],[s-1,2],[0,s-2],[0,s-1],[1,s-1],[2,s-1],[3,s-1]]);
      row==s-2&&!col&&s%8==4&&put([[s-3,0],[s-2,0],[s-1,0],[0,s-2],[0,s-1],[1,s-1],[2,s-1],[3,s-1]]);
      row==s+4&&col==2&&!(s%8)&&put([[s-1,0],[s-1,s-1],[0,s-3],[0,s-2],[0,s-1],[1,s-3],[1,s-2],[1,s-1]]);
      do{free(row,col)&&utah(row,col);row-=2;col+=2}while(row>=0&&col<s);
      row++;col+=3;
      do{free(row,col)&&utah(row,col);row+=2;col-=2}while(row<s&&col>=0);
      row+=3;col++;
    }while(row<s||col<s);
    grid[s-1][s-1]??=grid[s-2][s-2]=1;
    return grid
  },
  frame=(grid,s,n)=>{
    const region=s/n,total=s+2*n,block=region+2,idx=[...Array(total)];
    return[idx.map((_,y)=>idx.map((_,x)=>{const u=x%block,v=y%block;return!u||v==region+1?1:!v?1-u%2:u==region+1?v%2:grid[y-1-2*(y/block|0)][x-1-2*(x/block|0)]|0})),total]
  },
  data=encode(text),[s,n,dataLen,eccLen]=SIZES.find(r=>r[2]>=data.length)||[];
  if(!s)throw Error("too long");
  return frame(place([...pad(data,dataLen),...reedSolomon(data,eccLen)],s),s,n)
}


