'use strict';
// The player's own settings (M, V and F), with their defaults. They are kept in localStorage
// under the same keys as always ('rot.muted', 'rot.voice', 'rot.reducedFx'), through Store
// (util.js), so nobody loses their settings.

const SETTINGS_DEFAULTS = Object.freeze({
  muted: false,     // M: all sound off
  voice: true,      // V: the narrator's voice
  reducedFx: false, // F: calmer effects (no shaking or flashing)
});

const Settings = {
  get(key) { return Store.load(key, SETTINGS_DEFAULTS[key]); },
  set(key, value) { Store.save(key, value); return value; },
};
