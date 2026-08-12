// Sinh icon PWA không phụ thuộc thư viện ngoài: nền vàng Rankev + chữ "R" trắng.
// Dùng zlib built-in để mã hoá PNG (color type 2 = RGB). Chạy: node scripts/gen-icons.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
mkdirSync(OUT, { recursive: true });

const GOLD = [0xd4, 0xa9, 0x4a];
const WHITE = [0xff, 0xff, 0xff];

// Bitmap "R" 5x7 (1 = nét chữ).
const R = [
  [1, 1, 1, 1, 0],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 1, 1, 1, 0],
  [1, 0, 1, 0, 0],
  [1, 0, 0, 1, 0],
  [1, 0, 0, 0, 1],
];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (~c) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function makePng(size) {
  // Buffer pixel RGB, tô nền vàng.
  const px = Buffer.alloc(size * size * 3);
  for (let i = 0; i < size * size; i++) {
    px[i * 3] = GOLD[0];
    px[i * 3 + 1] = GOLD[1];
    px[i * 3 + 2] = GOLD[2];
  }
  // Vẽ chữ R (nearest-neighbor scale), chiếm ~56% chiều cao, canh giữa.
  const glyphH = Math.round(size * 0.56);
  const cell = Math.round(glyphH / 7);
  const gw = cell * 5;
  const gh = cell * 7;
  const ox = Math.round((size - gw) / 2);
  const oy = Math.round((size - gh) / 2);
  for (let ry = 0; ry < 7; ry++) {
    for (let rx = 0; rx < 5; rx++) {
      if (!R[ry][rx]) continue;
      for (let dy = 0; dy < cell; dy++) {
        for (let dx = 0; dx < cell; dx++) {
          const x = ox + rx * cell + dx;
          const y = oy + ry * cell + dy;
          if (x < 0 || y < 0 || x >= size || y >= size) continue;
          const idx = (y * size + x) * 3;
          px[idx] = WHITE[0];
          px[idx + 1] = WHITE[1];
          px[idx + 2] = WHITE[2];
        }
      }
    }
  }
  // Thêm filter byte (0) đầu mỗi scanline.
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    px.copy(raw, y * (size * 3 + 1) + 1, y * size * 3, (y + 1) * size * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const size of [192, 512]) {
  const file = join(OUT, `icon-${size}.png`);
  writeFileSync(file, makePng(size));
  console.log('✓ wrote', file);
}
