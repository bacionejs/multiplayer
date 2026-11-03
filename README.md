# Byte Cycles

A two-player light-cycle game for two phones. Ride across the arena, leave a trail, and avoid crashing into a wall or either player's trail.

## Play

[Play Byte Cycles](https://bacionejs.github.io/multiplayer/cycles.html)

Both players need an Android phone running Chrome and must be connected to the same Wi-Fi network. On each phone, tap **TAP TO CONNECT** and use the camera to scan the connection codes shown on the other phone. Once connected, tap to start each round. The score lasts for the session.

## Technologies

- **Vanilla JavaScript and HTML** power the game and connection flow; there is no framework or build step.
- **HTML Canvas** draws the arena, trails, and on-screen joystick.
- **WebRTC data channels** carry player inputs directly between phones. The game synchronizes by exchanging steering inputs rather than positions.
- **Data Matrix codes** exchange the WebRTC connection details: `datamatrix.js` encodes them, and the browser's `BarcodeDetector` reads them through the camera.
- **Camera APIs** (`getUserMedia`) and WebRTC require a supported browser and secure context. The connection is peer-to-peer and uses no application server or STUN server; both phones should be on the same Wi-Fi.

## Files

- `cycles.html` — Byte Cycles game and simulation.
- `link.js` — camera-scanned connection setup and WebRTC data-channel helper.
- `datamatrix.js` — small, dependency-free Data Matrix encoder used for connection codes.
