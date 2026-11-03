# Multiplayer Games

A collection of two-player games for phones, connected peer-to-peer.

## Play

- [Byte Cycles](https://bacionejs.github.io/multiplayer/cycles.html) — ride across the arena, leave a trail, and avoid crashing into a wall or either player's trail.
- [Byte Tanks](https://bacionejs.github.io/multiplayer/tanks.html) — a tank duel with touch controls, shooting, and cover.

Both players need an Android phone running Chrome and must be connected to the same Wi-Fi network. On each phone, tap **TAP TO CONNECT** and use the camera to scan the connection codes shown on the other phone.

## Technologies

- **Vanilla JavaScript and HTML** power the games and connection flow; there is no framework or build step.
- **HTML Canvas** draws the arenas, game objects, and touch controls.
- **WebRTC data channels** carry game messages directly between phones.
- **Data Matrix codes** exchange WebRTC connection details: `datamatrix.js` encodes them, and the browser's `BarcodeDetector` reads them through the camera.
- **Camera APIs** (`getUserMedia`) and WebRTC require a supported browser and secure context. The connection is peer-to-peer and uses no application server or STUN server; both phones should be on the same Wi-Fi.


