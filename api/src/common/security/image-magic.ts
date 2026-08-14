import { BadRequestException } from '@nestjs/common';

type Detected = { ext: string; mime: string };

/**
 * Sniff image type from magic bytes (ignore client-provided MIME/extension).
 */
export function detectImageType(buffer: Buffer): Detected {
  if (buffer.length < 12) {
    throw new BadRequestException('File too small to be a valid image.');
  }

  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: '.jpg', mime: 'image/jpeg' };
  }
  // PNG
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { ext: '.png', mime: 'image/png' };
  }
  // GIF
  if (
    buffer.toString('ascii', 0, 6) === 'GIF87a' ||
    buffer.toString('ascii', 0, 6) === 'GIF89a'
  ) {
    return { ext: '.gif', mime: 'image/gif' };
  }
  // WEBP (RIFF....WEBP)
  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { ext: '.webp', mime: 'image/webp' };
  }

  throw new BadRequestException(
    'Only real image files are allowed (jpg, png, webp, gif).',
  );
}
