'use strict';
// The narrator, using the browser's built-in speech. On a Mac it looks for the odd system voices
// (Cellos sings, Whisper whispers). If they're missing it fakes them with pitch and speed.

const Voice = {
  ok: typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined',
  on: Settings.get('voice'),
  voices: {},

  pickVoices() {
    const all = window.speechSynthesis.getVoices();
    const find = names => {
      for (const n of names) {
        const v = all.find(x => x.name === n || x.name.startsWith(n + ' '));
        if (v) return v;
      }
      return null;
    };
    const english = all.find(v => /^en/i.test(v.lang)) || all[0] || null;
    this.voices = {
      narrator: find(['Daniel', 'Moira', 'Karen', 'Serena', 'Arthur', 'Samantha']) || english,
      sing: find(['Cellos', 'Bad News', 'Good News', 'Organ', 'Bells']),
      whisper: find(['Whisper', 'Wobble']),
    };
  },

  // role: 'narrator' | 'sing' | 'whisper'. say() interrupts; queue() waits its turn.
  say(text, role = 'narrator') {
    if (!this.ok || !this.on || Sound.muted || !text) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(this.utter(text, role));
  },

  queue(text, role = 'narrator') {
    if (!this.ok || !this.on || Sound.muted || !text) return;
    window.speechSynthesis.speak(this.utter(text, role));
  },

  utter(text, role) {
    const u = new window.SpeechSynthesisUtterance(text);
    const special = this.voices[role];
    u.voice = special || this.voices.narrator || null;
    const [rate, pitch] = special
      ? { narrator: [0.85, 0.8], sing: [1, 1], whisper: [0.85, 1] }[role]
      : { narrator: [0.85, 0.8], sing: [0.75, 0.3], whisper: [0.7, 0.2] }[role];
    u.rate = rate;
    u.pitch = pitch;
    u.volume = RULES.audio.narrator;
    return u;
  },

  stop() {
    if (this.ok) window.speechSynthesis.cancel();
  },

  toggle() {
    this.on = !this.on;
    Settings.set('voice', this.on);
    if (!this.on) this.stop();
    return this.on;
  },
};

if (Voice.ok) {
  Voice.pickVoices();
  window.speechSynthesis.onvoiceschanged = () => Voice.pickVoices();
}
