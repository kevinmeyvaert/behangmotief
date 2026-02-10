import { decode } from 'blurhash';
import sharp from 'sharp';

export async function blurhashToDataUrl(blurhash: string): Promise<string> {
  if (!blurhash || blurhash.length < 6) {
    return '';
  }

  const pixels = decode(blurhash, 32, 32);
  const buffer = Buffer.from(pixels);

  return sharp(buffer, {
    raw: {
      width: 32,
      height: 32,
      channels: 4,
    },
  })
    .png()
    .toBuffer()
    .then((pngBuffer) => `data:image/png;base64,${pngBuffer.toString('base64')}`);
}
