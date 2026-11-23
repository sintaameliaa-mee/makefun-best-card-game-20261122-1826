// main.ts — hands the Emberfall card game in.
//
// Copies game/ and screenshots/ from this repository into the output
// directory, then writes /output/dossier.json with the kit's
// buildDossier, built from the copied files so it matches what the
// gate rebuilds byte for byte.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.
//
// The output directory itself is NEVER removed: on the grader it is a
// mounted volume and removing it fails with EBUSY. Only the entries
// inside it are cleared.

import { mkdir, readdir, rm, cp, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-game.ts";

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const DOSSIER_TEXT_CAP = 163840; // 160 KiB, per the competition rules

async function clearContents(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
  for (const entry of await readdir(dir)) {
    await rm(join(dir, entry), { recursive: true, force: true });
  }
}

async function handIn(): Promise<void> {
  await clearContents(outDir);
  await cp(join(repoRoot, "game"), join(outDir, "game"), { recursive: true });
  await cp(join(repoRoot, "screenshots"), join(outDir, "screenshots"), { recursive: true });
  const dossier = buildDossier(outDir, { text_max_bytes: DOSSIER_TEXT_CAP });
  await writeFile(join(outDir, "dossier.json"), dossier);
}

await handIn();
