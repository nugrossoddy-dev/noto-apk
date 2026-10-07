// Minimal Web Audio synthesizer for serene focus chimes and ambient sound

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays a warm singing bowl / chime for starting or completing focus blocks.
 */
export function playChime(frequency = 528, duration = 2.4) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    // Add harmonic overtone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(frequency * 2.76, ctx.currentTime);

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.06, now + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.7);

    osc.connect(gain);
    osc2.connect(gain2);
    gain.connect(ctx.destination);
    gain2.connect(ctx.destination);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + duration);
    osc2.stop(now + duration);
  } catch {
    // Audio context may fail if user hasn't interacted yet
  }
}

/**
 * Ambient background noise generator (White / Pink / Brown noise) for deep focus
 */
let ambientNode: AudioNode | null = null;
let ambientGain: GainNode | null = null;

export function startAmbientSound(type: 'rain' | 'noise' | 'brown' = 'brown', volume = 0.15) {
  stopAmbientSound();
  try {
    const ctx = getAudioContext();
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'brown' || type === 'rain') {
        // Brown noise: integrate white noise for soft warm rumble
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      } else {
        output[i] = white * 0.5;
      }
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to make it warm and soft like gentle rain / room ambiance
    const filter = ctx.createBiquadFilter();
    filter.type = type === 'rain' ? 'bandpass' : 'lowpass';
    filter.frequency.setValueAtTime(type === 'rain' ? 800 : 450, ctx.currentTime);
    filter.Q.setValueAtTime(1, ctx.currentTime);

    ambientGain = ctx.createGain();
    ambientGain.gain.setValueAtTime(0.001, ctx.currentTime);
    ambientGain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 1.2);

    whiteNoise.connect(filter);
    filter.connect(ambientGain);
    ambientGain.connect(ctx.destination);

    whiteNoise.start();
    ambientNode = whiteNoise;
  } catch {
    // Graceful fallback
  }
}

export function stopAmbientSound() {
  if (ambientGain && audioCtx) {
    try {
      ambientGain.gain.setValueAtTime(ambientGain.gain.value, audioCtx.currentTime);
      ambientGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
      setTimeout(() => {
        if (ambientNode && 'stop' in ambientNode) {
          (ambientNode as AudioScheduledSourceNode).stop();
        }
        ambientNode = null;
        ambientGain = null;
      }, 500);
      return;
    } catch {
      // ignore
    }
  }
  if (ambientNode && 'stop' in ambientNode) {
    try {
      (ambientNode as AudioScheduledSourceNode).stop();
    } catch {
      // ignore
    }
  }
  ambientNode = null;
  ambientGain = null;
}
