export type SfxName =
  | 'click'
  | 'open'
  | 'close'
  | 'select'
  | 'accept'
  | 'spawn'
  | 'shake'
  | 'shakePerfect'
  | 'serve'
  | 'coin'
  | 'buy'
  | 'heart'
  | 'error'
  | 'day'
  | 'summary'
  | 'doorBell'
  | 'delivery'
  | 'blend'
  | 'scoop'
  | 'pack'
  | 'chat'
  | 'beat'
  | 'drop';

type ToneOptions = {
  type?: OscillatorType;
  gain?: number;
  attack?: number;
  delay?: number;
  glide?: number;
};

/**
 * Tiny procedural sound kit. SFX are event-driven; music is an optional
 * lookahead-scheduled WebAudio music-box loop on its own gain node so the
 * SFX enable/disable toggle never affects music volume and vice-versa.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  enabled = true;

  // ── music-box scheduler ──────────────────────────────────────────────────
  private musicEnabled = false;
  private musicPlaying = false;
  private musicTimer = 0;
  private musicBeat = 0;
  private musicNextTime = 0;

  private static readonly MUSIC_BPM = 74;
  private static readonly SCHEDULE_AHEAD = 0.12;
  private static readonly TICK_MS = 25;
  private static readonly MUSIC_GAIN = 0.025;
  private static readonly PAD_GAIN = 0.008;
  private static readonly FADE_S = 0.6;

  // Pentatonic major: C D E G A — semitones above C4 (261.63 Hz)
  private static readonly SCALE = [0, 2, 4, 7, 9];

  // [scale-degree, octave-offset, duration-in-eighth-beats]
  private static readonly PATTERN: [number, number, number][] = [
    [2,1,2],[4,1,1],[3,1,1],[2,1,2],[1,1,2],
    [0,1,2],[1,1,1],[2,1,1],[3,1,4],
    [4,1,2],[3,1,1],[2,1,1],[1,1,2],[0,1,2],
    [2,1,1],[1,1,1],[0,1,2],[4,0,2],[2,0,2],
    [0,1,2],[2,1,1],[3,1,1],[4,1,2],[2,1,1],[1,1,1],[0,1,4],
    [3,1,2],[2,1,1],[1,1,1],[0,1,2],[2,1,2],
    [4,1,2],[3,1,1],[2,1,1],[1,1,2],[0,1,2],
    [2,1,2],[4,1,1],[3,1,1],[2,1,2],[1,1,2],
    [0,1,2],[2,1,1],[4,1,1],[3,1,4],
    [4,1,2],[2,1,1],[1,1,1],[0,1,2],[2,1,2],
    [3,1,1],[2,1,1],[1,1,2],[0,1,4],
  ];

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    // Only the master (SFX) gain is muted; the music gain is independent.
    if (this.master) {
      const now = this.ctx?.currentTime ?? 0;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setValueAtTime(enabled ? 0.32 : 0, now);
    }
  }

  dispose() {
    this.enabled = false;
    this._stopMusicScheduler();
    this.musicPlaying = false;
    document.removeEventListener('visibilitychange', this._onVisibility);
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.noiseBuffer = null;
  }

  unlock() {
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.enabled ? 0.32 : 0;
        this.master.connect(this.ctx.destination);
        // Separate gain for music so SFX mute/unmute never touches it.
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0;
        this.musicGain.connect(this.ctx.destination);
        document.addEventListener('visibilitychange', this._onVisibility);
      } catch {
        this.ctx = null;
        return;
      }
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    if (this.musicEnabled && !this.musicPlaying) this._startMusicLoop();
  }

  play(name: SfxName) {
    if (!this.enabled) return;
    this.unlock();
    const ctx = this.ctx;
    if (!ctx) return;

    switch (name) {
      case 'click':
        this.tone(660, 0.07, { type: 'sine', gain: 0.13 });
        break;
      case 'open':
        this.tone(480, 0.12, { type: 'sine', gain: 0.11, glide: 720 });
        this.tone(760, 0.1, { type: 'sine', gain: 0.07, delay: 0.05 });
        break;
      case 'close':
        this.tone(540, 0.12, { type: 'sine', gain: 0.1, glide: 360 });
        break;
      case 'select':
        this.tone(760, 0.06, { type: 'triangle', gain: 0.08 });
        this.tone(1020, 0.06, { type: 'sine', gain: 0.045, delay: 0.03 });
        break;
      case 'accept':
        this.chime([660, 880, 1100], 0.09, 0.11);
        break;
      case 'spawn':
        this.tone(880, 0.45, { type: 'sine', gain: 0.055 });
        this.tone(1320, 0.5, { type: 'sine', gain: 0.025, delay: 0.04 });
        break;
      case 'shake':
        this.noise(0.12, 0.12, 900);
        this.tone(150, 0.1, { type: 'sine', gain: 0.12, glide: 90 });
        break;
      case 'shakePerfect':
        this.noise(0.09, 0.08, 1600);
        this.tone(1180, 0.16, { type: 'triangle', gain: 0.1 });
        this.tone(1560, 0.2, { type: 'sine', gain: 0.06, delay: 0.05 });
        break;
      case 'serve':
        this.chime([523.25, 659.25, 783.99, 1046.5], 0.11, 0.095);
        break;
      case 'coin':
        this.tone(1318, 0.09, { type: 'sine', gain: 0.075 });
        this.tone(1760, 0.16, { type: 'sine', gain: 0.055, delay: 0.06 });
        break;
      case 'buy':
        this.tone(523, 0.1, { type: 'triangle', gain: 0.08 });
        this.tone(784, 0.12, { type: 'sine', gain: 0.07, delay: 0.07 });
        this.tone(1046, 0.24, { type: 'sine', gain: 0.055, delay: 0.14 });
        break;
      case 'heart':
        this.tone(330, 0.2, { type: 'triangle', gain: 0.1, glide: 210 });
        this.tone(240, 0.26, { type: 'sine', gain: 0.07, delay: 0.09, glide: 160 });
        break;
      case 'error':
        this.tone(220, 0.18, { type: 'triangle', gain: 0.08, glide: 170 });
        break;
      case 'day':
        this.chime([392, 523.25, 659.25, 783.99], 0.15, 0.08);
        break;
      case 'summary':
        this.chime([523.25, 659.25, 783.99, 1046.5, 1318.5], 0.18, 0.075);
        break;
      case 'doorBell':
        this.tone(1568, 0.32, { type: 'sine', gain: 0.07 });
        this.tone(1174.7, 0.5, { type: 'sine', gain: 0.055, delay: 0.13 });
        break;
      case 'delivery':
        this.tone(740, 0.1, { type: 'triangle', gain: 0.08 });
        this.tone(988, 0.12, { type: 'triangle', gain: 0.07, delay: 0.08 });
        this.tone(1318, 0.18, { type: 'sine', gain: 0.055, delay: 0.16 });
        break;
      case 'blend':
        this.noise(0.16, 0.09, 620);
        this.tone(190, 0.14, { type: 'sine', gain: 0.08, glide: 260 });
        break;
      case 'scoop':
        this.noise(0.08, 0.07, 1200);
        this.tone(420, 0.12, { type: 'triangle', gain: 0.07, glide: 560 });
        break;
      case 'beat':
        this.tone(1240, 0.045, { type: 'sine', gain: 0.05 });
        this.noise(0.03, 0.03, 3200);
        break;
      case 'drop':
        this.tone(520, 0.12, { type: 'sine', gain: 0.08, glide: 300 });
        this.noise(0.05, 0.05, 900);
        break;
      case 'pack':
        this.noise(0.09, 0.07, 2000);
        this.tone(620, 0.08, { type: 'sine', gain: 0.05, delay: 0.03 });
        break;
      case 'chat':
        this.tone(520, 0.09, { type: 'sine', gain: 0.07 });
        this.tone(660, 0.11, { type: 'sine', gain: 0.055, delay: 0.08 });
        break;
    }
  }

  private chime(notes: number[], step: number, gain: number) {
    notes.forEach((freq, i) => {
      this.tone(freq, 0.3 + i * 0.015, { type: 'sine', gain, delay: i * step });
      this.tone(freq * 2, 0.15, { type: 'sine', gain: gain * 0.22, delay: i * step + 0.008 });
    });
  }

  private tone(freq: number, duration: number, opts: ToneOptions = {}) {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    const {
      type = 'sine',
      gain = 0.1,
      attack = 0.008,
      delay = 0,
      glide,
    } = opts;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(30, freq), t0);
    if (glide) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, glide), t0 + duration);
    }
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.linearRampToValueAtTime(gain, t0 + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(env).connect(master);
    osc.start(t0);
    osc.stop(t0 + duration + 0.03);
  }

  private noise(duration: number, gain: number, filterFreq: number) {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    if (!this.noiseBuffer) {
      const length = Math.floor(ctx.sampleRate * 0.35);
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const channel = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) channel[i] = Math.random() * 2 - 1;
      this.noiseBuffer = buffer;
    }
    const t0 = ctx.currentTime;
    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = 0.9;
    const env = ctx.createGain();
    env.gain.setValueAtTime(gain, t0);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    source.connect(filter).connect(env).connect(master);
    source.start(t0);
    source.stop(t0 + duration + 0.02);
  }

  // ── music public API ─────────────────────────────────────────────────────

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!this.ctx || !this.musicGain) return;
    const ctx = this.ctx;
    const gain = this.musicGain;
    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    if (enabled) {
      gain.gain.linearRampToValueAtTime(1, now + AudioEngine.FADE_S);
      if (!this.musicPlaying) this._startMusicLoop();
    } else {
      gain.gain.linearRampToValueAtTime(0, now + AudioEngine.FADE_S);
      this._stopMusicScheduler();
      this.musicPlaying = false;
    }
  }

  // ── music-box scheduler internals ────────────────────────────────────────

  private _startMusicLoop() {
    if (!this.ctx) return;
    this.musicPlaying = true;
    this.musicBeat = 0;
    this.musicNextTime = this.ctx.currentTime + 0.05;
    this.musicTimer = window.setInterval(() => { this._scheduleTick(); }, AudioEngine.TICK_MS);
  }

  private _stopMusicScheduler() {
    window.clearInterval(this.musicTimer);
    this.musicTimer = 0;
  }

  private _scheduleTick() {
    const ctx = this.ctx;
    if (!ctx || document.hidden) return;
    const beatDur = 60 / (AudioEngine.MUSIC_BPM * 2); // eighth-beat duration in seconds
    const horizon = ctx.currentTime + AudioEngine.SCHEDULE_AHEAD;
    while (this.musicNextTime < horizon) {
      const idx = this.musicBeat % AudioEngine.PATTERN.length;
      const [degree, octave, beats] = AudioEngine.PATTERN[idx];
      const semi = AudioEngine.SCALE[degree] + octave * 12;
      const freq = 261.63 * Math.pow(2, semi / 12);
      this._musicNote(freq, beats * beatDur * 0.72, this.musicNextTime);
      this._padChord(this.musicNextTime, idx);
      this.musicNextTime += beats * beatDur;
      this.musicBeat++;
    }
  }

  private _musicNote(freq: number, dur: number, t: number) {
    const ctx = this.ctx;
    const mgain = this.musicGain;
    if (!ctx || !mgain) return;
    // Music-box timbre: sine fundamental + triangle octave partial, fast attack, 1.2 s decay
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const env = ctx.createGain();
    const detune = (Math.random() - 0.5) * 6;
    osc1.type = 'sine';
    osc1.frequency.value = freq;
    osc1.detune.value = detune;
    osc2.type = 'triangle';
    osc2.frequency.value = freq * 2.001;
    osc2.detune.value = -detune;
    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(AudioEngine.MUSIC_GAIN, t + 0.006);
    env.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(dur + 1.2, 1.4));
    osc1.connect(env);
    osc2.connect(env);
    env.connect(mgain);
    const stop = t + 1.5;
    osc1.start(t); osc1.stop(stop);
    osc2.start(t); osc2.stop(stop);
  }

  private _padChord(t: number, beatIdx: number) {
    const ctx = this.ctx;
    const mgain = this.musicGain;
    if (!ctx || !mgain) return;
    // Soft pad on downbeats (every 8 eighth-beats = every bar)
    if (beatIdx % 8 !== 0) return;
    const root = 130.81; // C3
    const dur = (60 / (AudioEngine.MUSIC_BPM * 2)) * 7.8;
    for (const f of [root, root * 1.5, root * 2]) {
      const osc = ctx.createOscillator();
      const filt = ctx.createBiquadFilter();
      const env = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      filt.type = 'lowpass';
      filt.frequency.value = 400;
      filt.Q.value = 0.7;
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(AudioEngine.PAD_GAIN, t + 0.08);
      env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(filt);
      filt.connect(env);
      env.connect(mgain);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    }
  }

  // Arrow field so removeEventListener can reference the same identity.
  private _onVisibility = () => {
    if (document.hidden) {
      if (this.musicTimer) this._stopMusicScheduler();
    } else if (this.musicEnabled && this.musicPlaying && !this.musicTimer) {
      this.musicNextTime = (this.ctx?.currentTime ?? 0) + 0.05;
      this.musicTimer = window.setInterval(() => { this._scheduleTick(); }, AudioEngine.TICK_MS);
    }
  };

}
