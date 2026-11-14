/*
comments.js: single source for all instructions/comments

About the shell (index.js), for reference; the code doesn't use this text:
  Two-phone game shell.
  Shows a toolbar (Handshake / Play / Back) and runs a game on both phones.
  Flow: Handshake connects the phones (handshake(container) resolves to {link, side}), the code screen shows the game source in a textarea, and Play sends that code to the other phone and launches it on both. Back returns BOTH phones to the code screen. Long-press Handshake for a single-device dev bypass.
  Shell messages travel over the same link as game messages but use a {sys:...} envelope that link.sys() receives, so games can never overwrite them: {sys:"load",code} starts a game, {sys:"back"} returns both phones to the code screen, {sys:"error",msg} reports that the other phone couldn't load or run the game. Games only ever see link.on for their own messages.
  Saving: if the 4th parameter of game has a one-word string, Play saves the code to IndexedDB under that name, only on the phone that pressed Play. The sample's name is reserved and never overwritten. A dropdown on the code screen reloads saved games.
  Games define function game(link, side, area, name="mygame"). See COMMENTS.comment for what games receive.

*/

const COMMENTS = {
  samplegamecomment: `/*
Two-phone light-cycles game.
side is "a" or "b".
link.ready(startFn): startFn runs on both phones together.
area = {w,h}: pixels available to the game (already below the toolbar and inside padding). Size everything from this, not from innerWidth/innerHeight.
link.send(obj) sends JSON to the other phone; set link.on=obj=>{} to receive, link.onclose to detect disconnects.
name (4th parameter): ignored by the game; it is only the save key. If it is a one-word string default, the code screen saves the code under it on the phone that presses Play. Remove it or leave it empty to not save.
element(tag, parent=game area, props): global helper that creates a DOM element, appends it to parent, assigns props (e.g. {textContent, className}), and returns it.
Each game runs in its own same-origin iframe, so its timers, listeners and globals disappear when Back removes the iframe. This isolates games from the shell; it is not a security sandbox. A game may also return a cleanup function, which Back calls first.
*/`,

  intro: '<p>Click <b>Handshake</b> above to perform the camera/barcode handshake, and then click <b>Play</b>.<br><br>OPTIONAL<br>Play the sample game or replace the code in the textarea with a new game. Only one person needs to paste it: whoever clicks <b>Play</b> first instantly transmits and launches it on both phones.<br><br>Games save automatically on that person\'s phone when they click <b>Play</b>, under the name in the game\'s last parameter (the sample\'s is <b>cycles</b>). Pick a saved game from the dropdown on the code screen. The sample can\'t be overwritten, so give your own game a new one-word name to keep it.<br><br><i>Tip: paste the sample game from the textarea into an AI and ask it to make a new game like battleship.</i></p>',

  // The source of the game function with the comment inserted just inside its opening brace.
  sample(game) {const src = game.toString(), i = src.indexOf('{') + 1;return src.slice(0, i) + '\n' + this.samplegamecomment + src.slice(i);}
};

