'use strict';
// Touch, on a phone held upright. Every tap becomes the key press the keyboard would send, handed
// to pressKey() (main.js), the same place key presses go: so no rule changes, and a keyboard
// attached to the phone keeps working. What can be tapped, and what it sends, is decided where it
// is drawn (Taps, in js/draw/phone.js). On a computer's layout none of this does anything.
//
// On the map, a tap steps toward it (the map cut into four triangles meeting at you). Holding your
// finger down keeps you walking that way, one step at a time, refused exactly as a held key is:
// when an awake horror comes into view, or any page or card opens. Lifting your finger stops you.

const Touch = { hold: null, timer: null };

function stopHold() {
  if (Touch.timer) clearTimeout(Touch.timer);
  Touch.timer = null;
  Touch.hold = null;
}

function startHold(k, id) {
  stopHold();
  Touch.hold = { k, id };
  const step = () => {
    Touch.timer = null;
    if (!Touch.hold) return;
    if (!pressKey(k, true)) return stopHold(); // refused, as a held key would be: the walk ends here
    Touch.timer = setTimeout(step, RULES.phone.holdRepeatMs);
  };
  Touch.timer = setTimeout(step, RULES.phone.holdDelayMs);
}

// A finger (or, on the phone layout, a mouse) comes down at (x, y).
function touchAt(x, y, id) {
  stopHold();
  lastInputAt = performance.now();
  const t = Taps.at(x, y);
  if (!t) return;
  if (t.act) return t.act();
  if (t.map) {
    const k = mapTapKey(x, y);
    if (!k) return;
    pressKey(k, false);
    if (MOVE[k]) startHold(k, id);
    return;
  }
  for (const k of typeof t.keys === 'function' ? t.keys() : t.keys) pressKey(k, false);
}

window.addEventListener('pointerdown', e => {
  if (!Phone.on && !Phone.sideways) return;
  if (e.preventDefault) e.preventDefault();
  Sound.init(); // phones keep sound off until a tap: the first one starts it
  if (Phone.sideways) return;
  touchAt(e.clientX, e.clientY, e.pointerId);
});

const liftFinger = e => {
  if (!Phone.on && !Phone.sideways) return;
  Sound.init(); // (some phones only allow sound once the finger lifts)
  if (Touch.hold && (e.pointerId === undefined || e.pointerId === Touch.hold.id)) stopHold();
};
window.addEventListener('pointerup', liftFinger);
window.addEventListener('pointercancel', liftFinger);

// No double-tap zoom, no pull-down-to-reload, no long-press menu: the page stays still.
window.addEventListener('touchmove', e => { if (Phone.on || Phone.sideways) e.preventDefault(); }, { passive: false });
window.addEventListener('contextmenu', e => { if (Phone.on) e.preventDefault(); });
