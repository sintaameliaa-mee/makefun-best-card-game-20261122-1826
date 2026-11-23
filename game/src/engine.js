// The rules of Emberfall: turns, energy, block, damage, Resonance combos,
// drawing, reshuffling, and the win/loss conditions. No DOM here — the
// engine only mutates state and reports events the renderer animates.

import { buildDeck } from "./cards.js";
import { mulberry32, shuffleInPlace } from "./random.js";

export const MAX_LIFE = 20;
export const ENEMY_MAX_LIFE = 22; // Sable is the boss: two extra life.
export const HAND_SIZE = 5;
export const MAX_ENERGY = 3;
export const RESONANCE_BONUS = 3;

export function newDuelist(deck, maxLife = MAX_LIFE) {
  return {
    life: maxLife,
    maxLife,
    energy: MAX_ENERGY,
    maxEnergy: MAX_ENERGY,
    block: 0,
    deck,
    hand: [],
    discard: [],
    playedSuits: [],
  };
}

export function newGame(seed) {
  const rng = mulberry32(seed);
  const game = {
    seed,
    rng,
    screen: "game",
    phase: "player", // player | enemy | over
    turn: 1,
    player: newDuelist(buildDeck(rng), MAX_LIFE),
    enemy: newDuelist(buildDeck(rng), ENEMY_MAX_LIFE),
    arenaPlayer: null, // last card the player played (face-up in the arena)
    arenaEnemy: null,
    resonance: null, // { suit } while the banner shows
    log: [],
    damageDealt: 0,
    damageTaken: 0,
    cardsPlayed: 0,
    winner: null, // "player" | "enemy"
  };
  drawUpTo(game.player, HAND_SIZE, game);
  drawUpTo(game.enemy, HAND_SIZE, game);
  addLog(game, "The duel begins. Your turn — play a card.");
  return game;
}

export function addLog(game, text) {
  game.log.unshift(text);
  if (game.log.length > 40) game.log.length = 40;
}

export function drawUpTo(duelist, count, game) {
  while (duelist.hand.length < count) {
    if (duelist.deck.length === 0) {
      if (duelist.discard.length === 0) return;
      duelist.deck = shuffleInPlace(duelist.discard, game.rng);
      duelist.discard = [];
    }
    duelist.hand.push(duelist.deck.pop());
  }
}

export function drawCards(duelist, count, game) {
  for (let i = 0; i < count; i++) {
    if (duelist.deck.length === 0) {
      if (duelist.discard.length === 0) return;
      duelist.deck = shuffleInPlace(duelist.discard, game.rng);
      duelist.discard = [];
    }
    duelist.hand.push(duelist.deck.pop());
  }
}

export function canPlay(game, duelist, card) {
  return game.phase !== "over" && card.cost <= duelist.energy;
}

// Resonance: the second card of one suit played in a turn. Strikes and
// guards gain +3; surges trigger twice.
export function resonanceBonus(game, duelist, card) {
  return duelist.playedSuits.filter((s) => s === card.suit).length >= 1;
}

function dealDamage(game, target, amount, source) {
  const absorbed = Math.min(target.block, amount);
  target.block -= absorbed;
  const dealt = amount - absorbed;
  target.life = Math.max(0, target.life - dealt);
  if (source === "player") game.damageDealt += dealt;
  else game.damageTaken += dealt;
  return { absorbed, dealt };
}

// Plays a card from a duelist's hand. Returns an event describing what
// happened, for the renderer and the floating numbers.
export function playCard(game, who, cardUid) {
  const me = game[who];
  const foe = who === "player" ? game.enemy : game.player;
  const index = me.hand.findIndex((c) => c.uid === cardUid);
  if (index < 0) return null;
  const card = me.hand[index];
  if (!canPlay(game, me, card)) return null;

  me.hand.splice(index, 1);
  me.energy -= card.cost;
  me.discard.push(card);
  const resonating = resonanceBonus(game, me, card);
  me.playedSuits.push(card.suit);
  game.cardsPlayed++;
  if (who === "player") game.arenaPlayer = card;
  else game.arenaEnemy = card;
  if (resonating) game.resonance = { suit: card.suit };

  const event = { who, card, resonating, damage: 0, blocked: 0, healed: 0, drawn: 0, energy: 0 };
  const bonus = resonating ? RESONANCE_BONUS : 0;

  if (card.kind === "strike") {
    const hit = dealDamage(game, foe, card.power + bonus, who);
    event.damage = hit.dealt;
    event.blocked = hit.absorbed;
  } else if (card.kind === "guard") {
    me.block += card.power + bonus;
    event.blocked = card.power + bonus;
  } else if (card.kind === "surge") {
    const times = resonating ? 2 : 1;
    for (let t = 0; t < times; t++) applySurge(game, me, card, event);
  }

  const name = who === "player" ? "You" : "Sable";
  let line = `${name} played ${card.name}`;
  if (resonating) line += ` — RESONANCE! +${RESONANCE_BONUS}`;
  if (event.damage > 0) line += `, dealing ${event.damage} damage`;
  if (card.kind === "guard") line += `, gaining ${event.blocked} block`;
  addLog(game, line + ".");

  checkEnd(game);
  return event;
}

function applySurge(game, me, card, event) {
  if (card.effect === "draw2") {
    drawCards(me, 2, game);
    event.drawn += 2;
  } else if (card.effect === "energy2") {
    me.energy = Math.min(me.maxEnergy + 2, me.energy + 2);
    event.energy += 2;
  } else if (card.effect === "heal4") {
    const healed = Math.min(me.maxLife - me.life, 4);
    me.life += healed;
    event.healed += healed;
  } else if (card.effect === "draw1energy1") {
    drawCards(me, 1, game);
    me.energy = Math.min(me.maxEnergy + 2, me.energy + 1);
    event.drawn += 1;
    event.energy += 1;
  }
}

export function checkEnd(game) {
  if (game.winner) return;
  if (game.enemy.life <= 0 && game.player.life <= 0) {
    game.winner = game.damageDealt >= game.damageTaken ? "player" : "enemy";
  } else if (game.enemy.life <= 0) {
    game.winner = "player";
  } else if (game.player.life <= 0) {
    game.winner = "enemy";
  }
  if (game.winner) {
    game.phase = "over";
    game.screen = game.winner === "player" ? "won" : "lost";
    addLog(game, game.winner === "player" ? "Sable falls. The winds are yours!" : "Your ember fades. Sable wins this duel.");
  }
}

export function endPlayerTurn(game) {
  if (game.phase !== "player" || game.winner) return false;
  game.phase = "enemy";
  game.enemy.block = 0;
  game.enemy.energy = game.enemy.maxEnergy;
  game.enemy.playedSuits = [];
  game.resonance = null;
  addLog(game, "— Sable's turn —");
  return true;
}

export function endEnemyTurn(game) {
  if (game.phase !== "enemy" || game.winner) return false;
  game.turn++;
  game.phase = "player";
  game.player.block = 0;
  game.player.energy = game.player.maxEnergy;
  game.player.playedSuits = [];
  game.resonance = null;
  drawUpTo(game.player, HAND_SIZE, game);
  drawUpTo(game.enemy, HAND_SIZE, game);
  addLog(game, `— Round ${game.turn}: your turn —`);
  return true;
}

export function scoreOf(game) {
  const lifeBonus = game.winner === "player" ? game.player.life * 10 : 0;
  return game.damageDealt * 10 + game.cardsPlayed * 5 + lifeBonus;
}
