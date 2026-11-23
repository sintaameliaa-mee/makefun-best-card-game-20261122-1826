// Sable's brain: a readable opponent. It plans its next turn openly —
// planIntent() names what it will do, so the player can read it and
// counter (Guard answers Strike, Strike answers Guard). The plan is
// honest: choosePlay() follows the same priorities the intent names.

import { canPlay, resonanceBonus } from "./engine.js";

function scorePlay(game, card) {
  const me = game.enemy;
  const foe = game.player;
  let score = 0;
  if (card.kind === "strike") {
    score = card.power * 2;
    if (foe.life <= card.power) score += 100; // lethal
    if (foe.block > 0) score -= foe.block; // wasted into block
  } else if (card.kind === "guard") {
    score = card.power;
    if (me.life <= 8) score += 12; // hurt: turtle up
    if (foe.life <= 6) score -= 8; // ahead: press the attack instead
  } else if (card.kind === "surge") {
    if (card.effect === "heal4") score = me.life <= 12 ? 14 : 2;
    else if (card.effect === "draw2") score = me.hand.length <= 3 ? 10 : 3;
    else if (card.effect === "energy2") score = me.hand.some((c) => c.cost >= 2 && c.cost > me.energy) ? 9 : 3;
    else score = 6;
  }
  if (resonanceBonus(game, me, card)) score += 6; // chase the combo
  score -= card.cost; // prefer cheap plays
  return score;
}

// The single best card Sable would play right now, or null.
export function choosePlay(game) {
  const playable = game.enemy.hand.filter((c) => canPlay(game, game.enemy, c));
  if (playable.length === 0) return null;
  let best = playable[0];
  let bestScore = scorePlay(game, best);
  for (const card of playable.slice(1)) {
    const s = scorePlay(game, card);
    if (s > bestScore) {
      best = card;
      bestScore = s;
    }
  }
  return best;
}

// What Sable plans for its next turn, shown to the player as its intent.
// Computed from the same priorities choosePlay() uses, with the energy
// Sable WILL have next turn (its pool refills at the turn's start),
// so the intent is honest instead of reading its spent pool.
export function planIntent(game) {
  const savedEnergy = game.enemy.energy;
  const savedSuits = game.enemy.playedSuits;
  game.enemy.energy = game.enemy.maxEnergy;
  game.enemy.playedSuits = []; // a fresh turn: no suit played yet
  const card = choosePlay(game);
  game.enemy.energy = savedEnergy;
  game.enemy.playedSuits = savedSuits;
  if (!card) return { kind: "pass", label: "Sable holds back…", detail: "no playable card" };
  if (card.kind === "strike") {
    const resonating = resonanceBonus(game, game.enemy, card);
    const damage = card.power + (resonating ? 3 : 0);
    return { kind: "strike", label: `⚔ Sable will strike — ${damage} damage`, detail: card.name };
  }
  if (card.kind === "guard") {
    const resonating = resonanceBonus(game, game.enemy, card);
    const block = card.power + (resonating ? 3 : 0);
    return { kind: "guard", label: `🛡 Sable will guard — ${block} block`, detail: card.name };
  }
  return { kind: "surge", label: `✦ Sable will surge — ${card.name}`, detail: card.text };
}
