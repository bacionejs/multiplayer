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

**History:**  
<br>
This project originated during the JS13KGames 2025 competition as ["Byte-Armada"](https://js13kgames.com/2025/games/byte-armada), when the Online category had previously been discontinued due to the lack of a viable free solution for multiplayer connectivity. Mid-competition, the category was resurrected after a viable solution was found. But the idea still lives on in my head, and this project represents a cleaned-up version with a simpler game sample and a flexible shell.

The original plan was to exchange SDP through an instant messenger, until I realized that would depend on an external service and server, neither of which was permitted by the competition. That eventually led to the barcode handshake.

This approach doesn't really fulfill the spirit of the Online category, which aims to support all devices, more than two players, and connections across the globe. It's a much narrower, self-contained experiment.

If you're not constrained, it would probably be better to set up a local game server. It's relatively trivial, and the barcode handshake becomes frustrating when iterating during game development.
