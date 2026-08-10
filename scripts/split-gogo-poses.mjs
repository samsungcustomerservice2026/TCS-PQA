/**
 * Split GoGo pose gallery into individual assets.
 * Layout (verified): row1=6, row2=6, row3=5, row4=4  → 21 panels.
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SRC = path.resolve('public/gogo/_gallery-source.png');
const OUT_DIR = path.resolve('public/gogo/poses');
const FINAL_DIR = path.resolve('public/gogo');
const INSET = 4;
const TRIM_NUMBER = 20;

const ROWS = [
  { top: 46, bottom: 296, cols: 6 }, // 1–6
  { top: 306, bottom: 556, cols: 6 }, // 7–12
  { top: 566, bottom: 806, cols: 5 }, // 13–17
  { top: 816, bottom: 1018, cols: 4 }, // 17b–20
];

/** 1-based scan order → semantic name */
const STATE_MAP = {
  idle: 1, // phone in hand
  welcome: 2, // salute / temple
  success: 3, // thumbs up
  listening: 4, // arms crossed
  point: 5, // point at viewer
  explaining: 6, // open palms
  wave: 7, // wave
  shrug: 8, // shrug / open hands
  empathetic: 9, // bow
  think: 10, // hand to glasses
  point_ui: 11, // hologram point
  typing_tablet: 12, // tablet
  walk: 13, // run
  celebrate: 14, // jump
  typing: 15, // seated typing
  error: 16, // falling
  think_chin: 17, // chin think (full)
  success_fists: 18, // fists up close
  think_close: 19, // chin close-up
  speak: 20, // big smile close-up
  shock: 21, // gasp close-up
};

const LIVE_EXPORTS = {
  'idle.png': 'idle',
  'welcome.png': 'welcome',
  'wave.png': 'wave',
  'bye.png': 'wave',
  'speak.png': 'speak',
  'think.png': 'think',
  'point.png': 'point',
  'walk-a.png': 'walk',
  'walk-b.png': 'walk',
  'typing.png': 'typing',
  'explaining.png': 'explaining',
  'success.png': 'success',
  'empathetic.png': 'empathetic',
  'error.png': 'error',
  'listening.png': 'listening',
  'celebrate.png': 'celebrate',
  'gogo.png': 'idle',
};

function buildPanels(width) {
  const panels = [];
  let index = 0;
  for (const row of ROWS) {
    const cellW = Math.floor(width / row.cols);
    const cellH = row.bottom - row.top;
    for (let c = 0; c < row.cols; c += 1) {
      index += 1;
      const left = Math.min(c * cellW + INSET, width - 10);
      const top = row.top + INSET;
      const w = Math.max(8, Math.min(cellW - INSET * 2, width - left));
      const h = Math.max(8, cellH - INSET * 2 - TRIM_NUMBER);
      panels.push({ index, left, top, width: w, height: h });
    }
  }
  return panels;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  // clean prior debug/pose files except source
  for (const name of fs.readdirSync(OUT_DIR)) {
    if (name.startsWith('_debug')) fs.unlinkSync(path.join(OUT_DIR, name));
  }

  const { width, height } = await sharp(SRC).metadata();
  const panels = buildPanels(width);
  console.log(`Gallery ${width}x${height}, panels=${panels.length}`);

  for (const p of panels) {
    await sharp(SRC)
      .extract({ left: p.left, top: p.top, width: p.width, height: p.height })
      .png()
      .toFile(path.join(OUT_DIR, `pose-${String(p.index).padStart(2, '0')}.png`));
  }

  for (const [name, idx] of Object.entries(STATE_MAP)) {
    fs.copyFileSync(
      path.join(OUT_DIR, `pose-${String(idx).padStart(2, '0')}.png`),
      path.join(OUT_DIR, `${name}.png`),
    );
  }

  for (const [file, key] of Object.entries(LIVE_EXPORTS)) {
    const idx = STATE_MAP[key];
    fs.copyFileSync(
      path.join(OUT_DIR, `pose-${String(idx).padStart(2, '0')}.png`),
      path.join(FINAL_DIR, file),
    );
    console.log(`wrote ${file} <- pose ${idx} (${key})`);
  }

  fs.writeFileSync(
    path.join(OUT_DIR, 'manifest.json'),
    JSON.stringify(
      {
        source: 'public/gogo/_gallery-source.png',
        generatedAt: new Date().toISOString(),
        layout: '6+6+5+4',
        rows: ROWS,
        stateMap: STATE_MAP,
        liveExports: LIVE_EXPORTS,
        chatStateToFile: {
          idle: 'idle.png ← pose 1',
          thinking: 'think.png ← pose 10',
          typing: 'typing.png ← pose 15',
          explaining: 'explaining.png ← pose 6',
          pointing: 'point.png ← pose 5',
          success: 'success.png ← pose 3',
          empathetic: 'empathetic.png ← pose 9',
        },
      },
      null,
      2,
    ),
  );
  console.log('done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
