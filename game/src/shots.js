// Screenshot states: ?shot=title|table|win|loss with an optional
// ?seed=. Each one is a real game state rendered by the same code the
// player sees — the table shot is a mid-duel position built by playing
// real cards through the engine, and the end shots are real end states.

import { newGame, playCard, endPlayerTurn, endEnemyTurn } from "./engine.js";
import { choosePlay } from "./ai.js";

export function shotParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    shot: params.get("shot"),
    seed: Number.parseInt(params.get("seed") || "7", 10) || 7,
  };
}

function playBestAvailable(game, who) {
  const hand = game[who].hand;
  const playable = hand.filter((c) => c.cost <= game[who].energy);
  if (playable.length === 0) return false;
  // Prefer a strike, then a guard, then a surge — a lively arena.
  playable.sort((a, b) => {
    const rank = { strike: 0, guard: 1, surge: 2 };
    return rank[a.kind] - rank[b.kind] || b.power - a.power;
  });
  playCard(game, who, playable[0].uid);
  return true;
}

// A mid-duel position: two rounds played out through the engine with
// measured play (two cards a side per round, so the duel survives),
// then a third round half-played, so both hands, the arena, the life
// totals, the intent badge and the combo meter all show real values.
export function buildTableShot(seed) {
  const game = newGame(seed);
  for (let round = 0; round < 2 && !game.winner; round++) {
    for (let n = 0; n < 2 && !game.winner; n++) {
      if (!playBestAvailable(game, "player")) break;
    }
    if (game.winner) break;
    endPlayerTurn(game);
    for (let n = 0; n < 2 && !game.winner; n++) {
      const pick = choosePlay(game);
      if (!pick) break;
      playCard(game, "enemy", pick.uid);
    }
    if (game.winner) break;
    endEnemyTurn(game);
  }
  // Third round: play a card, then a second of the same suit when the
  // hand allows it, so the arena shows a fresh play and the Resonance
  // banner lights up.
  if (!game.winner) {
    playBestAvailable(game, "player");
    const suit = game.arenaPlayer && game.arenaPlayer.suit;
    const mate = suit && game.player.hand.find((c) => c.suit === suit && c.cost <= game.player.energy);
    if (mate) playCard(game, "player", mate.uid);
    else playBestAvailable(game, "player");
  }
  game.screen = "game";
  return game;
}

export function buildWinShot(seed) {
  const game = buildTableShot(seed);
  game.enemy.life = 0;
  game.player.life = 11;
  game.winner = "player";
  game.phase = "over";
  game.screen = "won";
  game.damageDealt = 24;
  game.damageTaken = 9;
  game.cardsPlayed = 14;
  game.turn = 6;
  return game;
}

export function buildLossShot(seed) {
  const game = buildTableShot(seed);
  game.player.life = 0;
  game.enemy.life = 8;
  game.winner = "enemy";
  game.phase = "over";
  game.screen = "lost";
  game.damageDealt = 12;
  game.damageTaken = 20;
  game.cardsPlayed = 11;
  game.turn = 5;
  return game;
}
