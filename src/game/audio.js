import { STORAGE_KEYS } from './constants.js';

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem(STORAGE_KEYS.MUTED) === '1';
  }

  ensureContext() {
    if (this.muted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem(STORAGE_KEYS.MUTED, this.muted ? '1' : '0');
    if (!this.muted) {
      this.playClick();
    }
    return this.muted;
  }

  playChop(combo = 0) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Crisp wood thwack (filtered noise burst)
    const bufferSize = Math.floor(ctx.sampleRate * 0.055);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.pow(1 - i / bufferSize, 2.2);
      data[i] = (Math.random() * 2 - 1) * env;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(750 + Math.min(combo, 20) * 18, now);
    filter.Q.setValueAtTime(1.6, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);

    // Punchy low wood body knock
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    const baseFreq = 165 + (combo % 8) * 11;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq * 1.4, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.55, now + 0.075);

    oscGain.gain.setValueAtTime(0.28, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.085);
  }

  playLevelUp() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + idx * 0.065;
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.11, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.19);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  playDeath(byTimeout = false) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = byTimeout ? 'sawtooth' : 'square';
    osc.frequency.setValueAtTime(byTimeout ? 280 : 210, now);
    osc.frequency.exponentialRampToValueAtTime(52, now + 0.34);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.38);

    // Secondary thud
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(110, now);
    sub.frequency.exponentialRampToValueAtTime(35, now + 0.2);
    subGain.gain.setValueAtTime(0.32, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    sub.connect(subGain);
    subGain.connect(ctx.destination);
    sub.start(now);
    sub.stop(now + 0.24);
  }

  playClick() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(340, now + 0.045);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.055);
  }
}
