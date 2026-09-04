import fs from 'fs';
import sharp from 'sharp';

async function make(size, out) {
  const rx = Math.round(size * 0.18);
  const inset = Math.round(size * 0.06);
  const inner = Math.round(size * 0.88);
  const innerRx = Math.round(size * 0.14);
  const bg = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">` +
      `<rect width="100%" height="100%" rx="${rx}" fill="#0a0a0a"/>` +
      `<rect x="${inset}" y="${inset}" width="${inner}" height="${inner}" rx="${innerRx}" fill="#111827"/>` +
      `</svg>`,
  );
  const logoSize = Math.round(size * 0.62);
  const logo = await sharp('public/sam_logo.png')
    .resize(logoSize, logoSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  await sharp(bg)
    .composite([{ input: logo, gravity: 'centre' }])
    .png()
    .toFile(out);
  console.log('wrote', out);
}

fs.mkdirSync('public/icons', { recursive: true });
await make(192, 'public/icons/icon-192.png');
await make(512, 'public/icons/icon-512.png');
await make(180, 'public/apple-touch-icon.png');
await sharp('public/icons/icon-192.png').resize(32, 32).png().toFile('public/favicon-32.png');
console.log('done');
