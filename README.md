<img width="100%" alt="2 phones playing game" src="https://github.com/user-attachments/assets/87fda14a-2fda-4276-b072-dca5d39fe6a5" />


Serverless multiplayer via webrtc/camera/barcode (**no** signal/stun/turn servers).  
<br>
**No external dependencies.**  
**Needs two Android Chrome phones on the same hotspot.**  

---

This project is mainly about the serverless technique used and the **sample game** merely provides an end-to-end explanation.  
<br>
After the camera/barcode `Handshake`, paste **your own game** into the app and `Play` head-to-head with your family.

---

[Try It 🎮](https://bacionejs.github.io/multiplayer)

---

**Developer's Note:**  
<br>
Although this project is functional, it's primarily a proof of concept. I recommend creating your own solution tailored to your specific needs. You may even want to drop the barcode handshake, since setting up your own local game server is relatively trivial, and the barcode handshake can become exhausting when iterating during game development.

---

**History:**  
<br>
This project originated during the JS13KGames 2025 competition as [Byte-Armada](https://js13kgames.com/2025/games/byte-armada), when the server category had previously been discontinued due to the lack of a viable free multiplayer server solution. Mid-competition, the category was resurrected after a viable solution was found. But the idea still lives on in my head, and this project represents a cleaned-up version with a simpler game sample and a flexible shell.



