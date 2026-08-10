/**
 * Knock out near-white backgrounds on GoGo pose PNGs (soft edge).
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('public/gogo');
const POSES = path.join(ROOT, 'poses');
const HARD = 248; // fully transparent above this
const SOFT = 232; // fade between SOFT..HARD

async function knockWhite(filePath) {
  const img = sharp(filePath).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  if (channels < 4) throw new Error(`Expected alpha channel: ${filePath}`);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const minC = Math.min(r, g, b);
    const maxC = Math.max(r, g, b);
    // near-white + low saturation
    if (minC >= HARD && maxC - minC <= 12) {
      data[i + 3] = 0;
    } else if (minC >= SOFT && maxC - minC <= 18) {
      const t = (minC - SOFT) / (HARD - SOFT);
      data[i + 3] = Math.round(data[i + 3] * (1 - t));
    }
  }

  await sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(filePath);
}

async function main() {
  const files = [
    ...fs.readdirSync(ROOT).filter((f) => f.endsWith('.png') && !f.startsWith('_')),
    ...fs.readdirSync(POSES).filter((f) => f.endsWith('.png') && !f.startsWith('_')),
  ];
  const paths = [
    ...fs.readdirSync(ROOT)
      .filter((f) => f.endsWith('.png') && !f.startsWith('_'))
      .map((f) => path.join(ROOT, f)),
    ...fs.readdirSync(POSES)
      .filter((f) => f.endsWith('.png') && !f.startsWith('_'))
      .map((f) => path.join(POSES, f)),
  ];

  for (const file of paths) {
    await knockWhite(file);
    console.log('transparent:', path.relative(process.cwd(), file));
  }
  console.log(`done (${paths.length} files)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
