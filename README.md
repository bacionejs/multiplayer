

## Play

- [Byte Cycles](https://bacionejs.github.io/multiplayer/cycles.html) — ride across the arena, leave a trail, and avoid crashing into a wall or either player's trail.


Both players need an Android phone running Chrome and must be connected to the same Wi-Fi network. On each phone, tap **TAP TO CONNECT** and use the camera to scan the connection codes shown on the other phone.

## Serverless Technology 

Everything is written in vanilla JavaScript and HTML, with no framework, build step, or application server. Phones connect peer-to-peer over WebRTC data channels, which carry game messages directly between them. No STUN server is needed, so both phones must be on the same Wi-Fi network or hotspot. To exchange connection details, `link.js`/`datamatrix.js` encodes them as Data Matrix codes, and the browser's `BarcodeDetector` reads those codes through the camera, which requires a supported browser and secure context. 
