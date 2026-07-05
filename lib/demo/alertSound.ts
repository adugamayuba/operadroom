const STORAGE_KEY = "operadroom-demo-sound";

export function isAlertSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "1";
}

export function setAlertSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
}

/** Short industrial alert — Web Audio, no asset file. */
export function playAlertChime(): void {
  if (typeof window === "undefined") return;
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const playTone = (freq: number, start: number, duration: number, gain: number) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(gain, start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration + 0.05);
    };

    playTone(880, now, 0.18, 0.08);
    playTone(660, now + 0.2, 0.28, 0.07);

    window.setTimeout(() => ctx.close(), 800);
  } catch {
    /* ignore autoplay / unsupported */
  }
}
