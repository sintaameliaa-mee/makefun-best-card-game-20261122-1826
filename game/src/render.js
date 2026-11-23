// The table: turns game state into DOM. Cards are real DOM elements so
// their values stay crisp at thumbnail size. Newly dealt cards slide in
// with a staggered deal animation; played cards flip into the arena.
// Rendering is pure: it never mutates game state, it only reads it.

import { SUITS, sigilSvg, kindVerb } from "./cards.js";
import { HAND_SIZE, scoreOf } from "./engine.js";
import { planIntent } from "./ai.js";

const seenUids = new Set();

export function cardFace(card, opts = {}) {
  const suit = SUITS[card.suit];
  const el = document.createElement("div");
  el.className = `card suit-${card.suit}${opts.playable ? " playable" : ""}${opts.disabled ? " disabled" : ""}${opts.mini ? " mini" : ""}`;
  el.dataset.uid = card.uid;
  el.style.setProperty("--suit", suit.color);
  el.style.setProperty("--suit-dark", suit.dark);
  el.innerHTML = `
    <div class="card-cost" title="Energy cost">${card.cost}</div>
    <div class="card-sigil">${sigilSvg(suit.sigil, opts.mini ? 26 : 44)}</div>
    <div class="card-name">${card.name}</div>
    <div class="card-suit-name">${suit.name}</div>
    <div class="card-power"><span class="power-kind">${kindVerb(card.kind)}</span>${card.power}</div>
    <div class="card-text">${card.text}</div>
    ${opts.keyHint ? `<div class="card-key">${opts.keyHint}</div>` : ""}`;
  return el;
}

export function cardBack() {
  const el = document.createElement("div");
  el.className = "card card-back";
  el.innerHTML = `<div class="back-sigil">✦</div><div class="back-word">EMBERFALL</div>`;
  return el;
}

function renderHand(container, hand, game, isPlayer) {
  container.innerHTML = "";
  hand.forEach((card, i) => {
    let el;
    if (isPlayer) {
      const playable = game.phase === "player" && card.cost <= game.player.energy;
      el = cardFace(card, { playable, disabled: !playable, keyHint: String(i + 1) });
      el.addEventListener("click", () => window.__emberfallPlay(card.uid));
    } else {
      el = cardBack();
    }
    // Fan the hand into a slight arc, like a real dealt hand: cards near
    // the middle sit upright, cards toward the ends tilt outward and drop.
    const spread = hand.length - 1;
    const offset = spread === 0 ? 0 : (i / spread - 0.5) * 2;
    el.style.setProperty("--fan-rot", `${(offset * 7).toFixed(1)}deg`);
    el.style.setProperty("--fan-y", `${(Math.abs(offset) * 10).toFixed(1)}px`);
    if (isPlayer && !seenUids.has(card.uid)) {
      el.classList.add("card-enter");
      el.style.animationDelay = `${(i * 0.09).toFixed(2)}s`;
      seenUids.add(card.uid);
    }
    container.appendChild(el);
  });
}

function renderArenaSlot(container, card, animate) {
  container.querySelectorAll(".card").forEach((n) => n.remove());
  if (!card) return;
  const el = cardFace(card, { mini: true });
  if (animate) el.classList.add("card-flip");
  container.appendChild(el);
}

function lifeBar(fillEl, textEl, duelist) {
  const pct = Math.max(0, (duelist.life / duelist.maxLife) * 100);
  fillEl.style.width = `${pct}%`;
  fillEl.classList.toggle("low", pct <= 30);
  textEl.textContent = `${duelist.life} / ${duelist.maxLife}`;
}

function blockBadge(el, duelist) {
  el.classList.toggle("hidden", duelist.block <= 0);
  el.textContent = `🛡 ${duelist.block}`;
}

function renderComboMeter(game) {
  const meter = document.getElementById("combo-meter");
  meter.innerHTML = "";
  for (const [key, suit] of Object.entries(SUITS)) {
    const count = game.player.playedSuits.filter((s) => s === key).length;
    const chip = document.createElement("span");
    chip.className = `combo-chip suit-${key}${count >= 1 ? " armed" : ""}${count >= 2 ? " fired" : ""}`;
    chip.style.setProperty("--suit", suit.color);
    chip.innerHTML = `${sigilSvg(suit.sigil, 18)}<b>${count}/2</b>`;
    chip.title = `${suit.name}: play 2 in one turn for Resonance (+3)`;
    meter.appendChild(chip);
  }
  const hint = document.createElement("span");
  hint.className = "combo-hint";
  hint.textContent = "Play 2 of one suit in a turn → Resonance +3";
  meter.appendChild(hint);
}

export function showScreen(name) {
  for (const id of ["title-screen", "table-screen", "end-screen"]) {
    document.getElementById(id).classList.toggle("hidden", id !== `${name}-screen`);
  }
}

export function renderTitleShowcase() {
  const showcase = document.getElementById("title-cards");
  showcase.innerHTML = "";
  const picks = [
    { id: "t1", name: "Inferno", suit: "ember", kind: "strike", cost: 3, power: 9, text: "Deal 9 damage.", uid: -1 },
    { id: "t2", name: "Tidewall", suit: "tide", kind: "guard", cost: 2, power: 7, text: "Gain 7 block.", uid: -2 },
    { id: "t3", name: "Bloom", suit: "thorn", kind: "surge", cost: 2, power: 4, text: "Heal 4 life.", uid: -3 },
    { id: "t4", name: "Tempest", suit: "gale", kind: "strike", cost: 3, power: 9, text: "Deal 9 damage.", uid: -4 },
  ];
  picks.forEach((card, i) => {
    const el = cardFace(card, { mini: true });
    el.classList.add("showcase-card");
    el.style.setProperty("--fan-rot", `${(i - 1.5) * 8}deg`);
    el.style.setProperty("--fan-y", `${Math.abs(i - 1.5) * 8}px`);
    showcase.appendChild(el);
  });
}

export function renderGame(game, opts = {}) {
  showScreen("table");
  renderHand(document.getElementById("enemy-hand"), game.enemy.hand, game, false);
  renderHand(document.getElementById("player-hand"), game.player.hand, game, true);
  renderArenaSlot(document.getElementById("player-played"), game.arenaPlayer, opts.animateArena === "player");
  renderArenaSlot(document.getElementById("enemy-played"), game.arenaEnemy, opts.animateArena === "enemy");

  lifeBar(document.getElementById("player-life-fill"), document.getElementById("player-life-text"), game.player);
  lifeBar(document.getElementById("enemy-life-fill"), document.getElementById("enemy-life-text"), game.enemy);
  blockBadge(document.getElementById("player-block"), game.player);
  blockBadge(document.getElementById("enemy-block"), game.enemy);

  const energyEl = document.getElementById("player-energy");
  energyEl.textContent = `${"◆".repeat(Math.max(0, game.player.energy))}${"◇".repeat(Math.max(0, game.player.maxEnergy - game.player.energy))} ${game.player.energy}`;
  energyEl.classList.toggle("empty", game.player.energy === 0);

  const intentEl = document.getElementById("enemy-intent");
  if (game.phase === "player" && !game.winner) {
    const intent = planIntent(game);
    intentEl.textContent = intent.label;
    intentEl.className = `intent-badge intent-${intent.kind}`;
  } else if (game.phase === "enemy") {
    intentEl.textContent = "Sable is playing…";
    intentEl.className = "intent-badge intent-busy";
  } else {
    intentEl.textContent = "—";
    intentEl.className = "intent-badge";
  }

  document.getElementById("turn-label").textContent = `ROUND ${game.turn}`;
  document.getElementById("score-label").textContent = `SCORE ${scoreOf(game)}`;
  document.getElementById("phase-label").textContent =
    game.phase === "player" ? "Your turn" : game.phase === "enemy" ? "Sable's turn" : "Duel over";
  document.getElementById("phase-label").className =
    `phase-label phase-${game.phase}`;

  const banner = document.getElementById("resonance-banner");
  if (game.resonance) {
    banner.classList.remove("hidden");
    banner.textContent = `✦ ${SUITS[game.resonance.suit].name.toUpperCase()} RESONANCE ✦ +3`;
    banner.style.setProperty("--suit", SUITS[game.resonance.suit].color);
  } else {
    banner.classList.add("hidden");
  }

  const message = document.getElementById("arena-message");
  if (game.winner) {
    message.textContent = game.winner === "player" ? "Sable falls!" : "Your ember fades…";
  } else if (game.phase === "player") {
    message.textContent = game.player.hand.length === 0
      ? "Hand empty — end your turn to draw new cards."
      : "Your turn — play a card, or end the turn.";
  } else {
    message.textContent = "Sable plays…";
  }

  renderComboMeter(game);

  document.getElementById("deck-counts").textContent =
    `Your deck ${game.player.deck.length} · discard ${game.player.discard.length}   |   Sable's deck ${game.enemy.deck.length}`;
  document.getElementById("end-turn-button").disabled = game.phase !== "player";

  // Battle log is newest-first (engine unshifts), so slice the 6 latest lines.
  const log = document.getElementById("battle-log");
  log.innerHTML = game.log.slice(0, 6).map((line) => `<div>${line}</div>`).join("");
}

export function renderEnd(game) {
  showScreen("end");
  const won = game.winner === "player";
  document.getElementById("end-emblem").textContent = won ? "🏆" : "🥀";
  document.getElementById("end-title").textContent = won ? "VICTORY" : "DEFEAT";
  document.getElementById("end-title").className = `end-title ${won ? "win" : "lose"}`;
  document.getElementById("end-subtitle").textContent = won
    ? "Sable bows to the Ember Warden. The four winds are yours."
    : "Sable claims this duel — but every ember can be rekindled.";
  document.getElementById("end-stats").innerHTML = `
    <div class="stat"><span>Final score</span><b>${scoreOf(game)}</b></div>
    <div class="stat"><span>Damage dealt</span><b>${game.damageDealt}</b></div>
    <div class="stat"><span>Damage taken</span><b>${game.damageTaken}</b></div>
    <div class="stat"><span>Cards played</span><b>${game.cardsPlayed}</b></div>
    <div class="stat"><span>Rounds</span><b>${game.turn}</b></div>
    <div class="stat"><span>Your life left</span><b>${game.player.life} / ${game.player.maxLife}</b></div>`;
  document.getElementById("end-screen").classList.toggle("won", won);
  document.getElementById("end-screen").classList.toggle("lost", !won);
}

export function resetSeenCards() {
  seenUids.clear();
}
