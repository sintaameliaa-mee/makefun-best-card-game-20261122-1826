// The four suits and the card pool of Emberfall.
// Every suit is told apart by BOTH colour and shape: each has its own
// colour and its own SVG sigil (flame, droplet, leaf, swirl).

import { shuffleInPlace } from "./random.js";

export const SUITS = {
  ember: { name: "Ember", color: "#e2483d", dark: "#8f1d16", sigil: "flame" },
  tide: { name: "Tide", color: "#2f7fd0", dark: "#144a80", sigil: "droplet" },
  thorn: { name: "Thorn", color: "#3da35d", dark: "#1d5c31", sigil: "leaf" },
  gale: { name: "Gale", color: "#d9a521", dark: "#8a6410", sigil: "swirl" },
};

export const SIGIL_PATHS = {
  flame:
    "M12 2c.8 3.2-2.4 4.4-2.4 7.2 0 1.2.6 2.1 1.6 2.4C9.6 11 8.6 9.2 8.6 7.4 5.8 9.6 4.5 12 4.5 14.5a7.5 7.5 0 0 0 15 0c0-4.6-3.4-6.6-4.6-10-.4 1.1-1 1.8-2 2.1.3-1.7.1-3.1-.9-4.6z",
  droplet: "M12 1.8C12 1.8 4.6 10.2 4.6 15a7.4 7.4 0 0 0 14.8 0C19.4 10.2 12 1.8 12 1.8z",
  leaf: "M20.5 3.5C10.8 3.5 3.5 10.8 3.5 20.5c9.7 0 17-7.3 17-17z",
  swirl: "M3 7.5h9.5a3 3 0 1 0-3-3M3 12h13.5a3 3 0 1 1-3 3M3 16.5h7a2.5 2.5 0 1 1-2.5 2.5",
};

export function sigilSvg(sigil, size) {
  const path = SIGIL_PATHS[sigil];
  if (sigil === "swirl") {
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><path d="${path}"/></svg>`;
  }
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor"><path d="${path}"/></svg>`;
}

// kind: strike deals power damage · guard gains power block ·
// surge runs its effect (draw / energy / heal).
// text: the card's rule, shown on its face.
export const CARD_POOL = [
  { id: "cinder-slash", name: "Cinder Slash", suit: "ember", kind: "strike", cost: 1, power: 3, text: "Deal 3 damage." },
  { id: "flame-lash", name: "Flame Lash", suit: "ember", kind: "strike", cost: 2, power: 6, text: "Deal 6 damage." },
  { id: "inferno", name: "Inferno", suit: "ember", kind: "strike", cost: 3, power: 9, text: "Deal 9 damage." },
  { id: "ember-ward", name: "Ember Ward", suit: "ember", kind: "guard", cost: 1, power: 4, text: "Gain 4 block." },
  { id: "ember-surge", name: "Ember Surge", suit: "ember", kind: "surge", cost: 1, power: 2, text: "Draw 2 cards.", effect: "draw2" },
  { id: "tidal-cut", name: "Tidal Cut", suit: "tide", kind: "strike", cost: 1, power: 3, text: "Deal 3 damage." },
  { id: "riptide", name: "Riptide", suit: "tide", kind: "strike", cost: 2, power: 6, text: "Deal 6 damage." },
  { id: "deluge", name: "Deluge", suit: "tide", kind: "strike", cost: 3, power: 8, text: "Deal 8 damage." },
  { id: "tidewall", name: "Tidewall", suit: "tide", kind: "guard", cost: 2, power: 7, text: "Gain 7 block." },
  { id: "deep-current", name: "Deep Current", suit: "tide", kind: "surge", cost: 2, power: 2, text: "Gain 2 energy.", effect: "energy2" },
  { id: "thorn-jab", name: "Thorn Jab", suit: "thorn", kind: "strike", cost: 1, power: 3, text: "Deal 3 damage." },
  { id: "vine-whip", name: "Vine Whip", suit: "thorn", kind: "strike", cost: 2, power: 5, text: "Deal 5 damage." },
  { id: "briar-storm", name: "Briar Storm", suit: "thorn", kind: "strike", cost: 3, power: 9, text: "Deal 9 damage." },
  { id: "thornbark", name: "Thornbark", suit: "thorn", kind: "guard", cost: 1, power: 4, text: "Gain 4 block." },
  { id: "bloom", name: "Bloom", suit: "thorn", kind: "surge", cost: 2, power: 4, text: "Heal 4 life.", effect: "heal4" },
  { id: "gust-strike", name: "Gust Strike", suit: "gale", kind: "strike", cost: 1, power: 3, text: "Deal 3 damage." },
  { id: "cyclone", name: "Cyclone", suit: "gale", kind: "strike", cost: 2, power: 6, text: "Deal 6 damage." },
  { id: "tempest", name: "Tempest", suit: "gale", kind: "strike", cost: 3, power: 9, text: "Deal 9 damage." },
  { id: "gale-shield", name: "Gale Shield", suit: "gale", kind: "guard", cost: 2, power: 7, text: "Gain 7 block." },
  { id: "zephyr", name: "Zephyr", suit: "gale", kind: "surge", cost: 1, power: 1, text: "Draw 1, gain 1 energy.", effect: "draw1energy1" },
];

export function cardById(id) {
  return CARD_POOL.find((c) => c.id === id);
}

let nextUid = 1;

// A fresh 20-card deck: the whole pool once, shuffled with the run's rng.
export function buildDeck(rng) {
  const deck = CARD_POOL.map((c) => ({ ...c, uid: nextUid++ }));
  return shuffleInPlace(deck, rng);
}

export function kindVerb(kind) {
  if (kind === "strike") return "⚔";
  if (kind === "guard") return "🛡";
  return "✦";
}
