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

## The problem

Two WebRTC peers cannot connect until they have exchanged a blob of text called an SDP. Exchanging it is called signaling, and signaling normally needs a server, because the peers cannot talk yet. STUN and TURN servers are the other usual helpers, for discovering public addresses and relaying traffic.

On a hotspot, the two phones can reach each other directly by their LAN addresses, so STUN and TURN are not needed. That leaves signaling as the only server-shaped problem.

## The idea: the camera is the signaling server

Two people in the same room already have a channel between their phones: one screen and one camera. Each phone shows a Data Matrix barcode. The other phone scans it.

A raw SDP is about 700 characters. Almost all of it is boilerplate that a data channel never uses. What a peer actually needs to know is small:

1. **Who am I?** The DTLS certificate fingerprint.
2. **Where am I?** An IP address and port (offer only).
3. **What role am I playing?** Offer or answer.

Everything else is rebuilt identically on the receiving side. The offer barcode carries **64 characters** and the answer barcode **45**, about 9% and 6% of the raw SDP.

The barcode is also the authentication channel. The fingerprint travels over a line-of-sight connection between two people in the same room, and DTLS then verifies it. That is the security backbone of the whole design.

## The handshake

Both phones start by creating and displaying an offer. Each phone scans with its rear camera, so the two phones cannot scan each other at the same moment. Whichever phone scans first becomes the answerer.

1. Each phone creates an `RTCPeerConnection`, a data channel, and an offer.
2. Before applying it, the code overwrites the ICE username fragment and password with fixed constants.
3. The phone waits for candidate gathering to finish, or 4 seconds, whichever comes first. With no STUN configured, only host candidates appear.
4. The SDP is reduced to a short string and drawn as a Data Matrix barcode.
5. The first phone to scan an offer expands it back into a minimal SDP, sets it as the remote description, creates an answer, and displays the answer as a barcode.
6. The other phone scans the answer and applies it.
7. ICE connectivity checks flow, DTLS verifies the fingerprints, and the data channel opens. The camera stops and the app moves to `Play`.

### The answer needs no address

The answerer already knows the offerer's address from the offer barcode, so it sends the first ICE check there. The offerer learns the answerer's address from the source of that incoming check. ICE calls this a peer-reflexive candidate. The address was never needed in the answer, so it was removed.

## The payload

Offer:

```
o|<fingerprint>|<ip>|<port>
```

Answer:

```
a|<fingerprint>
```

| Field | Meaning | Size |
|---|---|---|
| Role | `o` for offer (DTLS `actpass`), `a` for answer (DTLS `active`) | 1 char |
| Fingerprint | SHA-256 certificate hash, base64, padding stripped | 43 chars |
| IP | First IPv4 host candidate | up to 15 chars |
| Port | Host candidate UDP port | up to 5 chars |

A SHA-256 fingerprint in an SDP is 32 hex pairs separated by colons: 95 characters. Decoding it to bytes and re-encoding as unpadded base64 gives 43. That is the biggest single saving. The fingerprint cannot shrink further without truncating the hash, so 43 is the floor.

`unstrip` rebuilds a minimal SDP from the string: the `v=`, `o=`, `s=` and `t=` lines, one `m=application ... webrtc-datachannel` line, the ICE credentials, the fingerprint, the DTLS role, and a host candidate if an IP and port were sent.


- `gather` waits for candidate gathering to finish (or 4 seconds), substitutes the fixed ICE credentials, and returns the compressed string.
- `strip` extracts the role, the fingerprint (hex to bytes to unpadded base64), and for the offer the first non-IPv6 host candidate's IP and port. It throws if a required field is missing.
- `unstrip` rebuilds the SDP. `2113937151` is the standard ICE priority for a host UDP candidate: (2^24 × 126) + (2^8 × 65535) + (256 − 1). The `(256+c.charCodeAt()).toString(16).slice(1)` trick pads each byte to two hex digits.

## Cutting it down

I spent an extraordinary amount of time cutting this down, and the rule was simple: if the connection does not need it, it goes. Most of an SDP is boilerplate for features a data channel never uses, so most of it can be rebuilt on the receiving side instead of transmitted. What survives is the minimum: a role, a fingerprint, and for the offer an address.

The fingerprint is encoded as compactly as the hash allows. Anything one phone can learn from the other's traffic is not sent, which is why the answer carries no address. Anything that can be a constant is a constant: both phones overwrite the generated ICE username fragment and password with the same fixed values, so neither is transmitted. ICE requires at least 4 characters for the username fragment and 22 for the password, and the constants are exactly that long.

The floor is set by Chrome's SDP parser. It refuses to parse the SDP without the `o=`, `s=` and `t=` lines, even though they carry no information here, so they stay as constants.

## Results

A raw SDP is about 700 characters. The offer is now **64** and the answer **45**.

That difference decides the barcode. In ASCII encodation 700 characters is about 700 codewords, and digit pairs pack a little tighter than that. The nearest Data Matrix sizes that hold it are 96x96, with 696 data codewords, and 104x104, with 816. The payload now fits in 32x32. With the quiet zone that is 36 modules across instead of about 100, so each module is roughly 2.8 times as wide in the same screen space.

With a cheap camera that has trouble focusing, it will scan the barcode faster.  

## The Data Matrix encoder

A full encoder is rather large, whereas this minimal implementation, supporting ascii, is only 1k.

Scanning uses the browser's `BarcodeDetector` with the `data_matrix` format.

I used Data Matrix ECC 200 because the encoder stays small. It has no mask-selection step, and for a known payload range I can hard-code one symbol size.

How it works:

1. **Encodation.** ASCII mode. Each pair of digits becomes one codeword (`130 + value`) and every other character becomes one codeword (`character code + 1`). That is why the numeric IP and port pack well.
2. **Padding.** If the data is shorter than the capacity, the first pad is codeword `129`, followed by the standard's pseudo-random pad values.
3. **Error correction.** Reed-Solomon over GF(256) with field polynomial 301. The generator polynomial is built at runtime.
4. **Placement.** The standard diagonal ("Utah") placement algorithm, with one corner pattern.
5. **Finder pattern.** Solid L-shaped borders and alternating clock tracks, in a 2x2 grid of regions.
6. **Drawing.** The grid is drawn to a canvas with a 2-module quiet zone on every side.

### Symbol size

| | 32x32 (used) | 96x96 (what 700 characters needs) |
|---|---|---|
| Data codewords | 62 | 696 |
| Error-correction codewords | 36 | 272 |
| Modules across, with quiet zone | 36 | 100 |

Choosing the symbol size is a handful of constants in the encoder: the size, the codeword counts, and the region offsets. The Reed-Solomon routine, placement loop and finder-pattern drawing do not change. 36x36 is not an option with this code, because it needs a corner-placement case the encoder does not have.

Fewer modules in the same screen space means each module is bigger. Bigger modules survive blur, glare and shaky hands better, which is what fails when a camera scans a screen.

### Capacity

The offer costs: role (1) + three separators + fingerprint (43) + IP + port. A digit pair is one codeword.

| Case | Offer codewords |
|---|---|
| Worst private address, `192.168.255.255`, with a 5-digit port | 61 of 62 |
| A public address such as `255.255.255.255`, with a 5-digit port | 65 |

Private-range addresses always fit. The encoder has no length check, so a payload over 62 codewords would not fit the symbol. The answer is 45 characters or fewer and always fits.

To see the payload size on a phone with no console, put one line in the barcode-drawing function:

```js
alert(t.length+" chars, "+t.match(/\d\d|./g).length+"/62 codewords\n"+t);
```

## mDNS and the IP address in the barcode

mDNS is multicast DNS, a way to resolve names on a local network without a DNS server. It is a convenience, not a security mechanism. Desktop Chrome can replace the IP in a host candidate with a random `.local` name resolved that way. Android Chrome does not use mDNS, so the SDP contains a plain IPv4 address, which is exactly what the barcode needs.

Per the spec, a page that has camera permission gets the real IP anyway, and this project asks for the camera. None of it matters here. The barcode shows a private LAN address to the one person scanning it, and a private IP is not a secret. What protects the connection is the DTLS fingerprint.

## Game layer

The game layer is a convenience on top of the handshake. I added it because a single hard-coded game was too limiting: anyone who wanted to experiment even a little would have to host their own copy on a GitHub page. Now you paste a game into the app and play.

The app has three buttons: `Handshake`, `Play` and `Back`. A game is a function:

```js
function game(link, side, area, name="mygame") {
  link.on = msg => { /* messages from the other phone */ };
  link.onclose = () => { /* the other phone went away */ };
  link.ready(() => { /* both phones start here */ });
}
```

- `link.send(obj)` sends a JSON object to the other phone.
- `link.on` receives objects from the other phone.
- `link.ready(fn)` calls `fn` on both phones at the same moment, once both have asked.
- `link.onclose` fires if the connection drops.
- `side` is `"a"` or `"b"`, so each phone can play a different role.
- `area` is `{w, h}`, the size of the play area.
- `name` is a default string on the fourth parameter. The app reads it and saves the game under that name in `localStorage`. The sample's name cannot be overwritten.
- A game may return a cleanup function, which is called on `Back`. The game runs in an iframe that is torn down when you leave, so one is rarely needed.
- If the pasted text does not define a function called `game`, the whole text is run as the body of a function taking `(link, side, area)`.
- A message with a `sys` property is reserved for the app. Game messages must not use that key.

Games run in an iframe with a black background and a white monospace font. Inside the game, `document` is the iframe's document.

When you tap `Play`, your game's source is sent over the data channel and the other phone loads and runs it. Nobody pastes it twice.

### The sample game

The sample is a two-player light-cycles game. It uses lockstep networking with an input delay. Each phone sends its direction for tick `T+2`, and advances tick `T` only when both phones' inputs for it have arrived. Both phones run the same deterministic simulation, and only inputs cross the link, never game state. Ticks are 160 ms.

## Security

The threat model is two people in the same room, on a hotspot, playing a family game.

**What protects the connection.** The data channel is DTLS encrypted. Each phone checks that the certificate it sees in the DTLS handshake matches the fingerprint it read from the barcode. WebRTC generates a fresh certificate for each connection by default, so the fingerprint changes every session and an old barcode is useless.

| Someone on the hotspot... | Outcome |
|---|---|
| Sniffs the traffic | Sees only encrypted packets |
| Tries to join the data channel | Fails fingerprint verification |
| Photographs the barcode | Learns an ephemeral fingerprint, a LAN address and a port |
| Holds up their own barcode for you to scan | This is the real attack. It needs physical presence and your cooperation |

**Fixed ICE credentials.** The constants are public, since they are in this repository. They only help a phone recognize connectivity checks. The fingerprint, not the ICE credentials, authenticates the peer.

**Received games run on your phone.** When the other player taps `Play`, their game's source arrives and the app loads it and runs it, with no confirmation. The iframe it runs in has no sandbox attribute. This is how the experiment works, and it fits the trust model: you only have a connection because you scanned a barcode held by someone in the same room. Pasting a game from the internet that you have not read is the usual risk of running code you did not write.

**Network requests.** After the page loads, the app makes no network requests of its own.

## Silly scenarios

Each one has a realistic risk rating.

**The Telephoto Bandit.** A suspicious figure across the park photographs your barcode with a long lens. They now know an ephemeral fingerprint, a LAN address that means nothing outside your hotspot, and a port that will be closed in ten minutes. *Realistic risk: none.*

**The T-Shirt of Doom.** Someone wears a shirt printed with a barcode that is a valid offer, and a laptop in their backpack is listening at exactly that address, port and certificate. You scan their chest. The app becomes the answerer, connects, and runs the game they send. This takes a matching listener on your hotspot and your cooperation. *Realistic risk: slight, and mostly funny.*

**The Photocopier.** You photocopy a barcode, tape it to the fridge, and try to scan it tomorrow. Each session uses a new certificate and a new port, and the phone that made it has closed the connection. The fridge is not listening. *Realistic risk: none.*

**The Cat on the Back Button.** The cat walks across your screen mid-game and taps `Back`. `Back` is sent to the other phone too, so the game ends for both players. *Realistic risk: high likelihood, low severity.*

**The Flip Phone.** Grandma wants to play. Her flip phone has no camera that can scan a Data Matrix. She reads the barcode aloud, five modules at a time. *Realistic risk: none, but the app does need a camera.*

**The Evil Sibling.** Your sibling writes a game that flashes the screen, vibrates, and plays a sound at full volume at 3 a.m. It runs on your phone because you let it connect. *Realistic risk: that's what siblings are for.*

## Out of scope

This is an experiment to prove that serverless multiplayer is possible. These are its boundaries:

- **LAN only.** There is no STUN or TURN, so there is no NAT traversal.
- **Two players.** One offer and one answer.
- **Android Chrome.** That is what the experiment runs on.
- **Not a library.** It is a demonstration of a technique.

## If this were more than an experiment

1. **Confirm before running a received game.** A prompt before the loader accepts incoming source.
2. **Sandbox the game iframe.** This would require changing how the loader creates the game function.
3. **A length check in the encoder.** Fail loudly instead of overflowing the symbol.
4. **A short verification code** derived from both fingerprints and shown on both screens, so players can confirm they match.
5. **Binary IP and port.** 6 bytes instead of up to 20 characters.
6. **A larger symbol size** if more fields are added. The encoder is missing the corner-placement case that 36x36 needs.

## FAQ

**Is this really serverless?**
For the connection, yes. Somebody has to serve the page once, over https. After it loads, no server takes part.

**Doesn't the barcode expose my IP address?**
It contains your private LAN address, shown to the person you chose to scan it. The address only means something on your hotspot, and it is not a secret. The fingerprint is what protects the connection.

**Why Data Matrix and not a QR code?**
The encoder stays small, because Data Matrix has no mask-selection step and I hard-code one symbol size. The browser's scanner reads it.

**Why does the answer carry no address?**
The offerer learns it from the answerer's first ICE check.

**Why are `o=`, `s=` and `t=` still there?**
Chrome refuses to parse the SDP without them. I tried.

**Why is it hotspot and not Wi-Fi?**
A hotspot is the setup I tested, and I don't want to deal with people giving me scary coffee shop wifi scenarios.

**Can I play over the internet?**
No. That needs STUN, and probably TURN, which are servers.

**Can I write my own game?**
Yes. See the game layer above. The sample game is a complete working example.




## Glossary

| Term | Meaning |
|---|---|
| SDP | Session Description Protocol, the text that describes a WebRTC connection |
| Signaling | Exchanging SDPs so two peers can connect |
| ICE | The procedure for finding a working network path between peers |
| Host candidate | An ICE candidate that is just a local address and port |
| Peer-reflexive candidate | A candidate learned from the source of an incoming ICE check |
| STUN / TURN | Servers that discover public addresses / relay traffic. Not used here |
| DTLS | The encryption layer under a WebRTC data channel |
| Fingerprint | A hash of a certificate, used to authenticate the DTLS peer |
| Codeword | One byte of data or error correction in a Data Matrix symbol |
| Module | One square cell of a barcode |
| Quiet zone | The blank margin around a barcode |

</details>
