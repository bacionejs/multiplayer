<img width="100%" alt="2 phones playing game" src="https://github.com/user-attachments/assets/87fda14a-2fda-4276-b072-dca5d39fe6a5" />


Serverless multiplayer via webrtc/camera/barcode (**no** signal/stun/turn servers).  
<br>
**No external dependencies.**  
**Needs two Android Chrome phones on the same hotspot.**  

---

This project is mainly about the serverless technique used and the **sample game** merely provides an end-to-end explanation.  
<br>
After the camera/barcode `Handshake`, optionally paste **your own game** into the app and `Play` head-to-head with your family.  
<br>
[Try It 🎮](https://bacionejs.github.io/multiplayer)

---

**Developer's Note:**  
<br>
This project originated as my own multiplayer hack solution due to the the Online category for JS13KGames being discontinued. And even though they resurrected the category before the end of the 2025 competition, I still submitted my [hack](https://js13kgames.com/2025/games/byte-armada) version. This approach doesn't really fulfill the spirit of the Online category, which aims to support all devices, more than two players, and connections across the globe. It's a much narrower, self-contained experiment, and this project represents a cleaned-up version with a simpler game sample and a flexible shell. But if you're not constrained, it would probably be better to set up a normal game server.
