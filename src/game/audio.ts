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
  | 'chat';

type ToneOptions = {
  type?: OscillatorType;
  gain?: number;
  attack?: number;
  delay?: number;
  glide?: number;
};

/**
 * Tiny procedural sound kit. Every sound is tied to an event — there is
 * deliberately no looping ambience or background track.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  enabled = true;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled && this.ctx) {
      void this.ctx.suspend();
    } else if (enabled && this.ctx) {
      void this.ctx.resume();
    }
  }

  unlock() {
    if (!this.enabled) return;
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.32;
        this.master.connect(this.ctx.destination);
      } catch {
        this.ctx = null;
        return;
      }
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
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
}
