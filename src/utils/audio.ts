// Synthetic Web Audio API Sound Generator for Disaster Evacuation Simulator

class SoundFXEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private fireNoiseNode: AudioNode | null = null;
  private fireGain: GainNode | null = null;
  private gasNoiseNode: AudioNode | null = null;
  private gasGain: GainNode | null = null;
  private lastPingTime: number = 0;
  private lastCoughTime: number = 0;
  private lastHeartbeatTime: number = 0;
  private lastBreathTime: number = 0;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.sirenGain) {
      this.sirenGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
    }
  }

  public getIsMuted() {
    return this.isMuted;
  }

  // Play a rewarding checkpoint ding
  public playCheckpoint() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.4);
    });
  }

  // Play footstep sound
  public playFootstep(isCrouch: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isCrouch ? 220 : 380, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isCrouch ? 0.04 : 0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  // Play hazard warning pulse - removed beep sound per user request
  public playHazardWarning() {
    // Beep sound completely removed per user request
    return;
  }

  // Play tactical fast-rope slide & air friction descent sound
  public playRopeSlide() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // 1. Friction whoosh of rope fibers
      const bufferSize = this.ctx.sampleRate * 0.9;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.65));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(650, now);
      filter.frequency.exponentialRampToValueAtTime(320, now + 0.85);
      filter.Q.setValueAtTime(3.0, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(now);

      // 2. Soft landing thud at the end (t + 0.8s)
      const thudOsc = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();
      thudOsc.type = 'sine';
      thudOsc.frequency.setValueAtTime(90, now + 0.78);
      thudOsc.frequency.exponentialRampToValueAtTime(30, now + 0.95);

      thudGain.gain.setValueAtTime(0, now);
      thudGain.gain.setValueAtTime(0.28, now + 0.78);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 1.05);

      thudOsc.connect(thudGain);
      thudGain.connect(this.ctx.destination);
      thudOsc.start(now + 0.78);
      thudOsc.stop(now + 1.1);
    } catch {
      // ignore
    }
  }

  // Play metallic ladder rung climb sound
  public playLadderClimb() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      // High-pitched steel rung ping
      osc.frequency.setValueAtTime(580 + Math.random() * 120, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.12);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // ignore
    }
  }

  // Play drill completion fanfare
  public playSuccessFanfare() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [
      { f: 440, t: 0 },
      { f: 554.37, t: 0.12 },
      { f: 659.25, t: 0.24 },
      { f: 880, t: 0.38 },
      { f: 1108.73, t: 0.55 },
    ];

    notes.forEach((n) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.f, now + n.t);

      gain.gain.setValueAtTime(0.2, now + n.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + n.t);
      osc.stop(now + n.t + 0.55);
    });
  }

  // Play radio squelch chirp - beep sound removed per user request
  public playRadioChirp() {
    // Beep sound removed per user request
    return;
  }

  // Start background emergency siren / alarm - beep sound completely silenced per user request
  public startEmergencySiren(_volume: number = 0.04) {
    // Beep sound and siren wail completely removed per user request
    return;
  }

  public stopEmergencySiren() {
    if (this.sirenOsc) {
      try {
        this.sirenOsc.stop();
        this.sirenOsc.disconnect();
      } catch {
        // ignore
      }
      this.sirenOsc = null;
      this.sirenGain = null;
    }
  }

  // Play realistic door latch and swing sound
  public playDoor(isOpen: boolean) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Mechanical latch click
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isOpen ? 460 : 320, now);
      osc.frequency.exponentialRampToValueAtTime(isOpen ? 640 : 180, now + 0.08);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);

      // Subtle door swing air resonance
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.14);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isOpen ? 480 : 360, now);
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.08, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);
    } catch {
      // ignore
    }
  }

  // Tactical Geiger / Proximity Danger Click - beep sound removed per user request
  public playProximityClick(_urgency: number = 0.5) {
    // Beep sound removed per user request
    return;
  }

  // Realistic involuntary cough / choke sound cue when inhaling smoke/gas
  public playCoughWarning() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    if (now - this.lastCoughTime < 2.0) return;
    this.lastCoughTime = now;

    try {
      // Two-part throat rasp
      [0, 0.22].forEach((offset) => {
        const bufferSize = Math.floor(this.ctx!.sampleRate * 0.16);
        const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }

        const noise = this.ctx!.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx!.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(650, now + offset);
        filter.Q.setValueAtTime(3.0, now + offset);

        const gain = this.ctx!.createGain();
        gain.gain.setValueAtTime(0.1, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.16);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx!.destination);
        noise.start(now + offset);
      });
    } catch {
      // ignore
    }
  }

  // Dynamically synthesize continuous ambient fire crackle or chemical hiss
  private ensureFireLoop() {
    if (this.fireGain || !this.ctx) return;
    try {
      // White noise buffer for crackle
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // Intermittent crackle spikes
        const crackle = Math.random() > 0.985 ? (Math.random() * 2 - 1) * 3 : (Math.random() * 2 - 1) * 0.4;
        data[i] = crackle;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

      this.fireGain = this.ctx.createGain();
      this.fireGain.gain.setValueAtTime(0, this.ctx.currentTime);

      noise.connect(filter);
      filter.connect(this.fireGain);
      this.fireGain.connect(this.ctx.destination);
      noise.start();
      this.fireNoiseNode = noise;
    } catch {
      // ignore
    }
  }

  private ensureGasLoop() {
    if (this.gasGain || !this.ctx) return;
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1800, this.ctx.currentTime);

      this.gasGain = this.ctx.createGain();
      this.gasGain.gain.setValueAtTime(0, this.ctx.currentTime);

      noise.connect(filter);
      filter.connect(this.gasGain);
      this.gasGain.connect(this.ctx.destination);
      noise.start();
      this.gasNoiseNode = noise;
    } catch {
      // ignore
    }
  }

  // Update real-time hazard proximity audio
  public updateHazardProximityAudio(
    nearestHazard: { type: string; dist: number; radius: number } | null
  ) {
    if (this.isMuted || !nearestHazard || nearestHazard.dist > 9.5) {
      if (this.fireGain && this.ctx) {
        this.fireGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);
      }
      if (this.gasGain && this.ctx) {
        this.gasGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);
      }
      return;
    }

    this.initCtx();
    if (!this.ctx) return;

    const { type, dist, radius } = nearestHazard;
    const now = this.ctx.currentTime;

    // Intensity scale from 0 (at 9.5m) to 1 (at hazard border or inside)
    const intensity = Math.max(0, Math.min(1, (9.5 - dist) / Math.max(1, 9.5 - radius)));

    // 1. Ambience by hazard type
    if (type === 'fire') {
      this.ensureFireLoop();
      if (this.fireGain) {
        const targetVol = 0.02 + intensity * 0.14;
        this.fireGain.gain.linearRampToValueAtTime(targetVol, now + 0.05);
      }
      if (this.gasGain) {
        this.gasGain.gain.linearRampToValueAtTime(0, now + 0.05);
      }
    } else if (type === 'gas' || type === 'chemical_leak') {
      this.ensureGasLoop();
      if (this.gasGain) {
        const targetVol = 0.02 + intensity * 0.12;
        this.gasGain.gain.linearRampToValueAtTime(targetVol, now + 0.05);
      }
      if (this.fireGain) {
        this.fireGain.gain.linearRampToValueAtTime(0, now + 0.05);
      }
    } else {
      if (this.fireGain) this.fireGain.gain.linearRampToValueAtTime(0, now + 0.05);
      if (this.gasGain) this.gasGain.gain.linearRampToValueAtTime(0, now + 0.05);
    }

    // 2. Proximity beep sound removed per user request
  }

  // Adrenaline Heartbeat Pulse (Lub-Dub) when sensing danger or stamina is critically low
  public playHeartbeat(urgency: number = 0.5) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const minInterval = Math.max(0.35, 1.1 - urgency * 0.75);
    if (now - this.lastHeartbeatTime < minInterval) return;
    this.lastHeartbeatTime = now;

    try {
      // First thump ("Lub")
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(65 + urgency * 25, now);
      osc1.frequency.exponentialRampToValueAtTime(32, now + 0.12);

      const vol = Math.min(0.35, 0.12 + urgency * 0.22);
      gain1.gain.setValueAtTime(vol, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      // Second thump ("Dub") 120ms later
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(55 + urgency * 20, now + 0.13);
      osc2.frequency.exponentialRampToValueAtTime(28, now + 0.24);

      gain2.gain.setValueAtTime(vol * 0.85, now + 0.13);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.13);
      osc2.stop(now + 0.28);
    } catch {
      // ignore
    }
  }

  // Labored Panting / Gasping Sound when exhausted or struggling for air
  public playHeavyBreathing(intensity: number = 0.5) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    if (now - this.lastBreathTime < 1.1) return;
    this.lastBreathTime = now;

    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.45);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(750 + intensity * 400, now);
      filter.Q.setValueAtTime(2.5, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.12 * intensity, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
    } catch {
      // ignore
    }
  }

  // Fatal Vital Flatline Sound - high pitched beep removed per user request
  public playFlatline() {
    // Beep sound removed per user request
    return;
  }

  // Character Collapse / Fall impact sound
  public playDeathCollapse() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Dull heavy body impact on floor
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.25);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // ignore
    }
  }

  public stopHazardAudio() {
    if (this.ctx) {
      if (this.fireGain) {
        try {
          this.fireGain.gain.setValueAtTime(0, this.ctx.currentTime);
        } catch {
          // ignore
        }
      }
      if (this.gasGain) {
        try {
          this.gasGain.gain.setValueAtTime(0, this.ctx.currentTime);
        } catch {
          // ignore
        }
      }
    }
  }
}

export const soundFX = new SoundFXEngine();
