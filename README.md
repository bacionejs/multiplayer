<img width="100%" alt="2 phones playing game" src="https://github.com/user-attachments/assets/7e0cf2a3-02ba-4eee-b936-75754d2e3f57" />


Serverless multiplayer via webrtc/camera/barcode (**no** signal/stun/turn servers).  

This project is mainly about the serverless technique used and the sample game merely provides an end-to-end explanation.  

---

**Needs two Android Chrome phones on the same hotspot.**  

After the camera/barcode `Handshake`, optionally paste your own game into the app and `Play` head-to-head with your family.  
<br>
[Try It](https://bacionejs.github.io/multiplayer) (includes sample game 🎮)

---

**No server. No external dependencies.**  

The source-code fits on a 3x5 card (excludes sample game)  

<a href="https://bacionejs.github.io/bacionejs/viewsource.html?file=https://raw.githubusercontent.com/bacionejs/multiplayer/main/index.html" target="_blank"><img width="200" src="https://github.com/user-attachments/assets/150c534f-3ecf-4232-a70e-7935570d3d05" /></a>

---

**What this is**

This is an experiment. Its only purpose is to prove that serverless multiplayer is possible: two phones, no signaling server, no STUN, no TURN.

It is not a library, not a product, and not a proposal for how multiplayer games should connect. The sample game and the paste-your-own-game loader exist so you can try the technique without hosting your own copy.

<details>
<summary>The long version: how it works, what I tried, security</summary>

## How the Connection Works

Connecting two WebRTC peers normally requires a signaling server to exchange Session Description Protocol (SDP) text, plus STUN and TURN servers to discover public addresses and relay traffic. On a shared hotspot, two devices can reach each other directly over their local network (LAN), eliminating the need for STUN and TURN. Instead, this experiment uses two phones' screens and rear cameras as a visual signaling channel.

A raw SDP is roughly 700 characters, most of which is unneeded boilerplate for a data channel. Stripping it down leaves only what is essential:

* **Role:** Offer (`o`, using DTLS `actpass`) or answer (`a`, using DTLS `active`).
* **Fingerprint:** The peer's SHA-256 DTLS certificate hash, converted from 32 colon-separated hex pairs (95 characters) into unpadded base64 (43 characters).
* **Address (offer only):** The first non-IPv6 IPv4 host candidate's IP address (up to 15 characters) and UDP port (up to 5 characters).

The answer omits an address because the answerer sends its first ICE check to the offerer's address, allowing the offerer to learn the answerer's address as a peer-reflexive candidate from that incoming check. Both sides also replace generated ICE username fragments and passwords with fixed constants (meeting ICE's minimum lengths of 4 and 22 characters) so they do not need to be transmitted, and `unstrip` rebuilds minimal SDP headers (`v=`, `o=`, `s=`, `t=`, `m=... webrtc-datachannel`, ICE credentials, fingerprint, DTLS role, and optional host candidate) because Chrome's SDP parser requires `o=`, `s=`, and `t=`.

---

## Handshake and Barcode Encoding

Because both phones start with an offer and scan with rear cameras, they cannot scan each other simultaneously; whichever scans first becomes the answerer.

1. **Create offer:** Each phone creates an `RTCPeerConnection` and data channel, generates an offer, replaces ICE username/password fields with fixed constants, and waits up to 4 seconds (or until gathering finishes) to collect host candidates.
2. **Encode and display:** `strip` compresses the SDP into a pipe-delimited string—`o|<fingerprint>|<ip>|<port>` for an offer (up to ~64 characters) or `a|<fingerprint>` for an answer (up to ~45 characters)—and renders it as a Data Matrix barcode.
3. **Scan and answer:** The first phone to scan a valid offer (`o`) expands it with `unstrip`, sets it as the remote description, creates an answer, encodes the answer as a barcode, and displays `"Scan this"`.
4. **Complete connection:** The other phone scans the answer (`a`) and applies it as the remote description. Once ICE checks succeed and DTLS verifies the fingerprints, the data channel opens, the camera stops, and the app switches to `Play`.

### Minimal Data Matrix Encoder

Data Matrix ECC 200 is used because it requires no mask-selection step and keeps the encoder, which is rather large, around 1 KB when only supporting ascii, while decoding via the browser's `BarcodeDetector` (`data_matrix` format):

* **ASCII encodation:** Digit pairs become one codeword (`130 + value`), and other characters become one codeword (`charCode + 1`).
* **Padding:** Short payloads start with codeword `129` followed by standard pseudo-random pad bytes.
* **Error correction:** Reed-Solomon over GF(256) with polynomial 301 builds error-correction codewords at runtime.
* **Layout & drawing:** Codewords are placed via diagonal ("Utah") placement with one corner pattern and drawn into a 2x2 region grid (with L-borders and clock tracks) plus a 2-module quiet zone on a canvas.

The app hard-codes a **32x32** symbol (62 data codewords, 36 error-correction codewords, 36 modules across including the quiet zone) instead of a 96x96 symbol needed for 700 characters. Fewer modules across the same screen space make each module larger (roughly 2.8x wider than a ~100-module symbol), improving camera readability under blur, glare, or shakiness. A private IPv4 address with a 5-digit port (such as `192.168.255.255`) takes 61 of 62 offer codewords.  

---

## Security, Scope, and Limitations

* **Transport & identity:** Data channel traffic is DTLS-encrypted, certificates are freshly generated per session, and peers verify the DTLS certificate fingerprint against the scanned barcode. Fixed ICE credentials are public in the code and only help identify connectivity checks.
* **Network & IP exposure:** After initial HTTPS page load, the app makes no further network requests. Barcodes contain a private LAN IPv4 address (and port) rather than a secret; Android Chrome provides plain IPv4 host candidates rather than desktop `.local` mDNS names, and camera permission also permits IP access per spec.
  * *Example:* While you and your partner play on your own hotspot, a passerby catches a glimpse of your barcode and snaps a picture of it. In reality, that stolen data is practically useless: the private LAN address and port only apply to your own hotspot, WebRTC uses a fresh certificate fingerprint for each session so a captured one becomes stale as soon as the connection closes, and an outsider cannot hijack or join the session without being on your private network, matching the active DTLS fingerprint, and getting you to scan their own barcode.
* **Code execution risk:** Incoming game code runs without confirmation or iframe sandboxing, relying on physical trust between the two people.
* **Boundaries:** Designed strictly as an experiment for two players on Android Chrome over a local hotspot, no internet play (no STUN/TURN), no multi-player beyond two peers, and not a library or product. Potential improvements beyond an experiment include prompting before running received code, sandboxing the iframe, adding an encoder length check, showing a fingerprint verification code and encoding IP/port as 6 binary bytes.

---


</details>

 
