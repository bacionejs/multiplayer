/*
comments.js: single source for all instructions/comments

About the shell (index.js), for reference; the code doesn't use this text:
  Two-phone game shell.
  Shows a toolbar (Handshake / Play / Back) and runs a game on both phones.
  Flow: Handshake connects the phones (handshake(container) resolves to {link, side}), the code screen shows the game source in a textarea, and Play sends that code to the other phone and launches it on both. Back returns BOTH phones to the code screen. Long-press Handshake for a single-device dev bypass.
  Shell messages travel over the same link as game messages but use a {sys:...} envelope that link.sys() receives, so games can never overwrite them: {sys:"load",code} starts a game, {sys:"back"} returns both phones to the code screen, {sys:"error",msg} reports that the other phone couldn't load or run the game. Games only ever see link.on for their own messages.
  See COMMENTS.samplegamecomment for what games receive.

*/

const COMMENTS = {
  samplegamecomment: `

/*
API Definitions:
function game(link, side, area, name="mygame")
link.ready(startFn)
link.send(obj)
link.on=obj=>{}
link.onclose to detect disconnects
side = "a" or "b"
area = {w,h}
name is parsed by the caller for saving into indexedDB
*/

`,

  intro: '<p>Click <b>Handshake</b> above to perform the camera/barcode handshake, and then click <b>Play</b>.<br><br><br><br><i>Tip: paste the sample game from the Play screen into an AI and ask it to make a new game like battleship, and then paste it back.</i></p>',

  // The source of the game function with the comment inserted just inside its opening brace.
  sample(game) {const src = game.toString(), i = src.indexOf('{') + 1;return src.slice(0, i) + '\n' + this.samplegamecomment + src.slice(i);}
};

