// Feel: synthesized sounds (WebAudio, no files), floating damage numbers,
// and the win confetti. Everything here is cosmetic — the engine never
// depends on it.

import { mulberry32 } from "./random.js";

let audioCtx = null;

function ctx() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      audioCtx = null;
    }
  }
  return audioCtx;
}

function tone(freq, start, duration, type, volume) {
  const ac = ctx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime + start);
  gain.gain.setValueAtTime(0.0001, ac.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(volume, ac.currentTime + start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + duration + 0.05);
}

export function playSound(name) {
  try {
    if (name === "deal") tone(660, 0, 0.09, "triangle", 0.08);
    else if (name === "play") {
      tone(520, 0, 0.1, "triangle", 0.12);
      tone(780, 0.07, 0.12, "triangle", 0.1);
    } else if (name === "hit") {
      tone(180, 0, 0.16, "sawtooth", 0.12);
      tone(90, 0, 0.2, "square", 0.08);
    } else if (name === "guard") tone(340, 0, 0.18, "sine", 0.12);
    else if (name === "resonance") {
      tone(523, 0, 0.12, "triangle", 0.12);
      tone(659, 0.09, 0.12, "triangle", 0.12);
      tone(784, 0.18, 0.2, "triangle", 0.14);
    } else if (name === "win") {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.13, 0.3, "triangle", 0.14));
    } else if (name === "lose") {
      [392, 330, 262, 196].forEach((f, i) => tone(f, i * 0.16, 0.3, "sine", 0.12));
    }
  } catch {
    // Audio is decoration; a blocked context must never break the game.
  }
}

// A number that floats up from an element and fades (damage, block, heal).
export function floatText(anchorEl, text, kind) {
  if (!anchorEl) return;
  const layer = document.getElementById("float-layer");
  const rect = anchorEl.getBoundingClientRect();
  const el = document.createElement("div");
  el.className = `float-text ${kind}`;
  el.textContent = text;
  el.style.left = `${rect.left + rect.width / 2}px`;
  el.style.top = `${rect.top}px`;
  layer.appendChild(el);
  setTimeout(() => el.remove(), 1300);
}

// Deterministic confetti for the win screen: seeded so screenshots match.
export function launchConfetti(seed) {
  const layer = document.getElementById("confetti-layer");
  if (!layer) return;
  layer.innerHTML = "";
  const rng = mulberry32(seed);
  const colors = ["#e2483d", "#2f7fd0", "#3da35d", "#d9a521", "#f5e6c8", "#c86dd7"];
  for (let i = 0; i < 90; i++) {
    const piece = document.createElement("i");
    piece.style.left = `${rng() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${(rng() * 1.6).toFixed(2)}s`;
    piece.style.animationDuration = `${(2.4 + rng() * 1.8).toFixed(2)}s`;
    piece.style.transform = `rotate(${Math.floor(rng() * 360)}deg)`;
    if (i % 3 === 0) piece.style.borderRadius = "50%";
    layer.appendChild(piece);
  }
}
