const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPng(width, height, drawPixel) {
  // RGBA buffer
  const rowSize = width * 4;
  const rawData = Buffer.alloc((rowSize + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowSize + 1);
    rawData[rowOffset] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawPixel(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc ^= buf[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (-(crc & 1) & 0xedb88320);
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const typeAndData = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(typeAndData), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Simple shield shape
function shieldPainter(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;

  // Background: dark zinc #18181b
  const bg = [24, 24, 27, 255];
  // Shield emerald #10b981
  const shield = [16, 185, 129, 255];
  // Border slate #3f3f46
  const border = [63, 63, 70, 255];

  // Shield boundary calculation
  const cx = 0.5;
  const dx = Math.abs(nx - cx);
  
  // Top: 0.18 to 0.5 is straight box width dx <= 0.32
  // Bottom: 0.5 to 0.85 curves to a point at (0.5, 0.85)
  let inShield = false;
  if (ny >= 0.18 && ny <= 0.5) {
    if (dx <= 0.32) inShield = true;
  } else if (ny > 0.5 && ny <= 0.85) {
    const progress = (ny - 0.5) / 0.35;
    const maxDx = 0.32 * (1 - progress * progress);
    if (dx <= maxDx) inShield = true;
  }

  // Rounded rectangle outer frame
  const cornerR = 0.15;
  const inOuter = (
    (nx >= cornerR && nx <= 1 - cornerR) ||
    (ny >= cornerR && ny <= 1 - cornerR) ||
    Math.hypot(nx - cornerR, ny - cornerR) <= cornerR ||
    Math.hypot(nx - (1 - cornerR), ny - cornerR) <= cornerR ||
    Math.hypot(nx - cornerR, ny - (1 - cornerR)) <= cornerR ||
    Math.hypot(nx - (1 - cornerR), ny - (1 - cornerR)) <= cornerR
  );

  if (!inOuter) return [0, 0, 0, 0];
  if (inShield) return shield;
  return bg;
}

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. 32x32 PNG
const png32 = createPng(32, 32, shieldPainter);
fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), png32);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), png32);

// 2. 180x180 Apple touch icon
const png180 = createPng(180, 180, shieldPainter);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), png180);

console.log('PNG icons created successfully in public/');
