// Boot, input (mouse + keyboard) and the enemy-turn driver.
// The player plays by clicking a card or pressing 1-5; Space ends the
// turn; R restarts; Esc returns to the title.

import { newGame, playCard, endPlayerTurn, endEnemyTurn, canPlay } from "./engine.js";
import { choosePlay } from "./ai.js";
import { renderGame, renderEnd, renderTitleShowcase, showScreen, resetSeenCards } from "./render.js";
import { playSound, floatText, launchConfetti } from "./fx.js";
import { shotParams, buildTableShot, buildWinShot, buildLossShot } from "./shots.js";

let game = null;
let enemyTimer = null;

function startDuel(seed) {
  clearTimeout(enemyTimer);
  resetSeenCards();
  game = newGame(seed ?? Math.floor(Math.random() * 100000));
  renderGame(game);
  playSound("deal");
}

function finishIfOver() {
  if (!game.winner) return false;
  setTimeout(() => {
    renderEnd(game);
    if (game.winner === "player") {
      launchConfetti(game.seed);
      playSound("win");
    } else {
      playSound("lose");
    }
  }, 900);
  return true;
}

function afterPlay(event, who) {
  if (!event) return;
  if (event.resonating) playSound("resonance");
  else if (event.card.kind === "strike") playSound("hit");
  else if (event.card.kind === "guard") playSound("guard");
  else playSound("play");

  renderGame(game, { animateArena: who });

  // Floating numbers over the side that felt the card.
  const target = event.card.kind === "strike"
    ? (who === "player" ? document.querySelector(".enemy-side .life-bar") : document.querySelector(".player-side .life-bar"))
    : (who === "player" ? document.querySelector(".player-side .life-bar") : document.querySelector(".enemy-side .life-bar"));
  if (event.damage > 0) floatText(target, `-${event.damage}`, "damage");
  if (event.card.kind === "guard") floatText(target, `+${event.blocked} 🛡`, "block");
  if (event.healed > 0) floatText(target, `+${event.healed} ♥`, "heal");
  if (event.drawn > 0) floatText(target, `+${event.drawn} cards`, "draw");
  if (event.energy > 0) floatText(target, `+${event.energy} ◆`, "energy");

  if (event.damage > 0) {
    const side = who === "player" ? document.querySelector(".enemy-side") : document.querySelector(".player-side");
    side.classList.remove("shake");
    void side.offsetWidth;
    side.classList.add("shake");
  }
  finishIfOver();
}

function playByUid(uid) {
  if (!game || game.phase !== "player" || game.winner) return;
  const card = game.player.hand.find((c) => c.uid === uid);
  if (!card || !canPlay(game, game.player, card)) return;
  const event = playCard(game, "player", uid);
  afterPlay(event, "player");
}

// Exposed for the renderer's click handlers.
window.__emberfallPlay = playByUid;

function runEnemyTurn() {
  if (!game || game.phase !== "enemy") return;
  const pick = choosePlay(game);
  if (!pick || game.winner) {
    endEnemyTurn(game);
    renderGame(game);
    if (!finishIfOver()) playSound("deal");
    return;
  }
  const event = playCard(game, "enemy", pick.uid);
  afterPlay(event, "enemy");
  if (game.winner) return;
  enemyTimer = setTimeout(runEnemyTurn, 950);
}

function endTurn() {
  if (!game || game.phase !== "player" || game.winner) return;
  if (!endPlayerTurn(game)) return;
  renderGame(game);
  enemyTimer = setTimeout(runEnemyTurn, 800);
}

function showTitle() {
  clearTimeout(enemyTimer);
  game = null;
  renderTitleShowcase();
  showScreen("title");
}

document.getElementById("play-button").addEventListener("click", () => startDuel());
document.getElementById("end-turn-button").addEventListener("click", endTurn);
document.getElementById("restart-button").addEventListener("click", () => startDuel());
document.getElementById("again-button").addEventListener("click", () => startDuel());
document.getElementById("title-button").addEventListener("click", showTitle);

document.addEventListener("keydown", (e) => {
  if (!game) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      startDuel();
    }
    return;
  }
  if (game.winner) {
    if (e.key === "r" || e.key === "R" || e.key === "Enter") startDuel();
    if (e.key === "Escape") showTitle();
    return;
  }
  if (e.key >= "1" && e.key <= "5") {
    const card = game.player.hand[Number(e.key) - 1];
    if (card) playByUid(card.uid);
  } else if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    endTurn();
  } else if (e.key === "r" || e.key === "R") {
    startDuel();
  } else if (e.key === "Escape") {
    showTitle();
  }
});

// Screenshot mode: ?shot=table|win|loss renders a deterministic state
// with the same code the player sees. No shot param = the title screen.
const { shot, seed } = shotParams();
if (shot === "table") {
  game = buildTableShot(seed);
  renderGame(game);
} else if (shot === "win") {
  game = buildWinShot(seed);
  renderEnd(game);
  launchConfetti(seed);
} else if (shot === "loss") {
  game = buildLossShot(seed);
  renderEnd(game);
} else {
  showTitle();
}
