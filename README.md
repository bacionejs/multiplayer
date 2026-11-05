<img width="300" alt="2 phones playing game" src="https://github.com/user-attachments/assets/2c41f6ac-9863-4a3e-8e14-950b606351f9" />




Serverless multiplayer via webrtc/camera/barcode (**no** signal/stun/turn servers).  

---

This project is mainly about the handshake innovation: **stripped message and a custom barcode generator** which make it tiny and self-contained.  
The game is merely a simple example to give an end-to-end explanation.  
The files contain notes on how it all works.  
The handshake solution (link.js/datamatrix.js) is 3k (minified/zipped).  
**No third-party libraries are used.**  
**Needs two Android Chrome phones on the same wifi.**  
Other browsers may work. It needs `BarcodeDetector` support.  

---

[Try the Byte Cycles game example](https://bacionejs.github.io/multiplayer/cycles.html)

Each phone asks for **camera** access, then scans the code on the other phone.  
Tip: don't lift your thumb off the joystick, just slide.  

---
The main use case is making a simple game to play head-to-head with your family.  
Paste `cycles.html` to an AI and have it create a different game like battleship.  
Since the camera requires `https` you will need to host it on something like github-pages.  
