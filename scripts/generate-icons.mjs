/**
 * Slinkto — Android Icon Generator
 * Génère ic_launcher.png + ic_launcher_round.png dans chaque mipmap-*
 * et ic_launcher_foreground.png pour les Adaptive Icons (Android 8+)
 */
import sharp from 'sharp';
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT   = join(__dir, '..');
const ASSETS = join(ROOT, 'assets');
const RES    = join(ROOT, 'android', 'app', 'src', 'main', 'res');

// ─── Tailles Android ─────────────────────────────────────────────────────────
const SIZES = [
  { folder: 'mipmap-mdpi',     size: 48  },
  { folder: 'mipmap-hdpi',     size: 72  },
  { folder: 'mipmap-xhdpi',    size: 96  },
  { folder: 'mipmap-xxhdpi',   size: 144 },
  { folder: 'mipmap-xxxhdpi',  size: 192 },
];

// ─── SVG sources ─────────────────────────────────────────────────────────────

// Icône normale (fond sombre, coins arrondis)
const svgNormal = readFileSync(join(ASSETS, 'icon.svg'));

// Icône foreground pour Adaptive Icon :
// même icône SANS le fond noir — transparent, pour se superposer au fond système
const svgFg = readFileSync(join(ASSETS, 'icon.svg'), 'utf-8')
  .replace(/<rect[^>]+fill="#111111"[^>]*\/>/, ''); // retire le fond

// Foreground au format Buffer SVG
const svgFgBuf = Buffer.from(svgFg);

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function toPng(svgBuf, size) {
  return sharp(svgBuf)
    .resize(size, size)
    .png()
    .toBuffer();
}

// ─── Génération ──────────────────────────────────────────────────────────────
async function main() {
  console.log('🔴 Génération des icônes Android – Slinkto\n');

  // 1. mipmap-* : ic_launcher + ic_launcher_round
  for (const { folder, size } of SIZES) {
    const dir = join(RES, folder);
    mkdirSync(dir, { recursive: true });

    const png = await toPng(svgNormal, size);
    writeFileSync(join(dir, 'ic_launcher.png'), png);
    writeFileSync(join(dir, 'ic_launcher_round.png'), png); // même source = déjà arrondi

    console.log(`  ✅  ${folder}/ic_launcher.png  (${size}×${size})`);
  }

  // 2. mipmap-xxxhdpi : ic_launcher_foreground.png (Adaptive Icon)
  //    Taille recommandée : 432×432 (108dp × 4x)  → on centre dans 432px
  const fgSize  = 432;
  const iconIn  = 280; // zone safe = ~65% de 432px
  const padding = Math.round((fgSize - iconIn) / 2);

  // on génère la foreground à 280px puis on l'étend avec du transparent
  const fgCore = await toPng(svgFgBuf, iconIn);
  const fgFull = await sharp({
    create: { width: fgSize, height: fgSize, channels: 4, background: { r:0,g:0,b:0,alpha:0 } }
  })
    .composite([{ input: fgCore, top: padding, left: padding }])
    .png()
    .toBuffer();

  const fgDir = join(RES, 'mipmap-xxxhdpi');
  writeFileSync(join(fgDir, 'ic_launcher_foreground.png'), fgFull);
  console.log(`\n  ✅  mipmap-xxxhdpi/ic_launcher_foreground.png  (${fgSize}×${fgSize})`);

  // 3. Assets export : Google Play (512px) + haute-rés (1024px)
  mkdirSync(join(ASSETS, 'export'), { recursive: true });

  const p512  = await toPng(svgNormal, 512);
  const p1024 = await toPng(svgNormal, 1024);
  writeFileSync(join(ASSETS, 'export', 'icon-512.png'),  p512);
  writeFileSync(join(ASSETS, 'export', 'icon-1024.png'), p1024);
  console.log('\n  ✅  assets/export/icon-512.png   → Google Play Store');
  console.log('  ✅  assets/export/icon-1024.png  → haute résolution');

  console.log('\n✨ Terminé !\n');
}

main().catch(err => { console.error(err); process.exit(1); });
