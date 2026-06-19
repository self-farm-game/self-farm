// Tiny Web Audio sound engine — soft, wooden, low-key SFX synthesized in the
// browser (no audio files to ship). Respects a global mute flag (driven by the
// game store / Cabin settings).

let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(v: boolean) {
  muted = v;
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType = "sine",
  gain = 0.06,
  delay = 0,
) {
  const ac = getCtx();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export type Sfx = "tap" | "select" | "confirm" | "complete" | "reward" | "item" | "rune";

export function play(name: Sfx) {
  if (muted) return;
  switch (name) {
    case "tap":
      tone(420, 0.06, "triangle", 0.04);
      break;
    case "select":
      tone(540, 0.08, "triangle", 0.05);
      break;
    case "confirm":
      tone(392, 0.1, "square", 0.04);
      tone(523, 0.12, "triangle", 0.05, 0.06);
      break;
    case "complete":
      tone(392, 0.12, "triangle", 0.05);
      tone(523, 0.12, "triangle", 0.05, 0.1);
      tone(659, 0.18, "triangle", 0.05, 0.2);
      break;
    case "reward":
      tone(523, 0.12, "triangle", 0.06);
      tone(659, 0.12, "triangle", 0.06, 0.1);
      tone(784, 0.22, "triangle", 0.06, 0.2);
      break;
    case "item":
      tone(880, 0.08, "square", 0.04);
      tone(1175, 0.14, "triangle", 0.04, 0.07);
      break;
    case "rune":
      tone(330, 0.3, "sine", 0.05);
      tone(495, 0.3, "sine", 0.04, 0.04);
      break;
  }
}
