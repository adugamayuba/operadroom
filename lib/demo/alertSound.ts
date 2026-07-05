let audioCtx: AudioContext | null = null;

export function unlockAlertAudio(): void {
  if (typeof window === "undefined") return;
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") void audioCtx.resume();
}

function playTone(ctx: AudioContext, freq: number, start: number, duration: number, gain: number) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.025);
  g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

function playChime(ctx: AudioContext) {
  const now = ctx.currentTime;
  playTone(ctx, 740, now, 0.14, 0.06);
  playTone(ctx, 980, now + 0.16, 0.22, 0.055);
}

/** Industrial alert — auto on anomaly; unlock via inject click first. */
export function playAlertChime(): void {
  if (typeof window === "undefined") return;
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    const run = () => {
      if (!audioCtx) return;
      playChime(audioCtx);
    };
    if (audioCtx.state === "running") run();
    else void audioCtx.resume().then(run);
  } catch {
    /* unsupported */
  }
}
