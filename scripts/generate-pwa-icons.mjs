import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
}

const crcTable = createCRC32Table();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  chunk.writeUInt32BE(crc32(typeAndData), 8 + len);
  return chunk;
}

function generatePNG(width, height, isMaskable = false) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth 8
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Scanlines: 1 filter byte + width * 4 bytes per row
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  const bgR = 13, bgG = 92, bgB = 90; // #0D5C5A (Deep Teal brand color)
  const fgR = 255, fgG = 255, fgB = 255; // White brand mark
  const accentR = 20, accentG = 184, accentB = 166; // #14B8A6 Teal accent

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = width * (isMaskable ? 0.42 : 0.46);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Check if inside circular icon or square background
      if (isMaskable) {
        // Maskable has solid full background to the edge
        let r = bgR, g = bgG, b = bgB, a = 255;
        // Inner logo: checkbox mark / "T" geometric symbol inside safe area (40% radius)
        const safeRadius = width * 0.30;
        if (dist < safeRadius) {
          // Draw geometric stylized 'T'
          const inTBar = Math.abs(dy - (-safeRadius * 0.3)) < (safeRadius * 0.18) && Math.abs(dx) < (safeRadius * 0.65);
          const inTStem = dy > (-safeRadius * 0.3) && dy < (safeRadius * 0.7) && Math.abs(dx) < (safeRadius * 0.2);
          if (inTBar || inTStem) {
            r = fgR; g = fgG; b = fgB;
          } else if (dist < safeRadius * 0.95 && dist > safeRadius * 0.85) {
            r = accentR; g = accentG; b = accentB;
          }
        }
        rawData[pxOffset] = r;
        rawData[pxOffset + 1] = g;
        rawData[pxOffset + 2] = b;
        rawData[pxOffset + 3] = a;
      } else {
        // Standard icon: smooth rounded badge or circle
        if (dist <= radius) {
          let r = bgR, g = bgG, b = bgB, a = 255;
          const innerR = radius * 0.65;
          const inTBar = Math.abs(dy - (-innerR * 0.3)) < (innerR * 0.22) && Math.abs(dx) < (innerR * 0.7);
          const inTStem = dy > (-innerR * 0.3) && dy < (innerR * 0.75) && Math.abs(dx) < (innerR * 0.24);
          if (inTBar || inTStem) {
            r = fgR; g = fgG; b = fgB;
          }
          rawData[pxOffset] = r;
          rawData[pxOffset + 1] = g;
          rawData[pxOffset + 2] = b;
          rawData[pxOffset + 3] = a;
        } else {
          // Transparent outside circle
          rawData[pxOffset] = 0;
          rawData[pxOffset + 1] = 0;
          rawData[pxOffset + 2] = 0;
          rawData[pxOffset + 3] = 0;
        }
      }
    }
  }

  const idatData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', idatData);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = path.resolve(process.cwd(), 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 1. icon-192.png (192x192, purpose: any)
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), generatePNG(192, 192, false));

// 2. icon-512.png (512x512, purpose: any)
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), generatePNG(512, 512, false));

// 3. icon-maskable-512.png (512x512, purpose: maskable, opaque)
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-512.png'), generatePNG(512, 512, true));

// 4. apple-touch-icon.png (180x180, opaque, no alpha)
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), generatePNG(180, 180, true));

console.log('Successfully generated all PWA icons in public/icons/');
