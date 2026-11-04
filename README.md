<img width="300" alt="2 phones playing game" src="https://github.com/user-attachments/assets/2c41f6ac-9863-4a3e-8e14-950b606351f9" />




Serverless multiplayer (**no** signal/stun/turn servers) via webrtc/camera/barcode.  
<br>
This project is mainly about the handshake innovation: **stripped message and a custom barcode generator** which make it tiny, self-contained and robust.  
The game is merely a simple example to give an end-to-end explanation.  
The files contain notes on how it all works.  
The handshake solution (link.js/datamatrix.js) is 4k (minified/zipped).  
**No third-party libraries are used.**  

[Try the Byte Cycles game example](https://bacionejs.github.io/multiplayer/cycles.html)

**Needs two Android Chrome phones on the same wifi.**  
Each phone asks for camera access, then scans the code on the other phone.  
