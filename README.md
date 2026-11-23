# Emberfall — Duel of the Four Winds

[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/sintaameliaa-mee/makefun-best-card-game-20261122-1826/rank.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/sintaameliaa-mee/makefun-best-card-game-20261122-1826/reward.svg)](https://make.fun/c/best-card-game-20261122-1826)

An original card game for the [make.fun best card game bounty](https://make.fun/c/best-card-game-20261122-1826): a duel against Sable, the Ash Herald, fought with cards of four elemental suits — Ember, Tide, Thorn and Gale — each told apart by colour **and** sigil shape.

## How it plays

- You have **20 life**, Sable **22**; both get **3 energy** a turn. Play cards, end your turn, draw back up to 5.
- **Strike** cards deal damage, **Guard** cards gain block, **Surge** cards draw, heal or grant energy.
- **Resonance:** play two cards of one suit in a single turn and the second one is supercharged (+3 damage/block, surges trigger twice).
- Sable shows its **intent** before every turn — read it and counter: Guard answers Strike, Strike answers Guard.
- First duelist to 0 life loses.

## Controls

- **Click** a card (or press **1–5**) to play it · **Space** / **Enter** to end your turn · **R** to restart · **Esc** for the title screen.

## Run it

Serve `game/` with any static server and open `game/index.html` in a desktop browser. No network requests, no build step — every file the game loads lives under `game/`.

Screenshot states (same code, deterministic setups): `?shot=table`, `?shot=win`, `?shot=loss` (optional `&seed=N`).

## Layout

- `game/index.html` — the table shell (title, table, end screens)
- `game/styles.css` — table, cards, deal/flip/confetti animation
- `game/src/cards.js` — the four suits, sigils and the 20-card pool
- `game/src/engine.js` — turns, energy, block, damage, Resonance, win/loss
- `game/src/ai.js` — Sable's brain and its readable intent
- `game/src/render.js` — hands, arena, life bars, combo meter, log
- `game/src/fx.js` — synthesized sounds, floating numbers, confetti
- `game/src/shots.js` — deterministic screenshot states
- `game/src/main.js` — boot, input, enemy-turn driver
- `main.ts` — hands the game in: copies `game/` + `screenshots/` to `/output` and writes `dossier.json`
