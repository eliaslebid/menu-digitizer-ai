import sharp from 'sharp';
import { createWorker } from 'tesseract.js';
// @ts-ignore - no types available for heic-convert
import heicConvert from 'heic-convert';

async function convertHeicIfNeeded(buffer: Buffer, mimeType: string): Promise<Buffer> {
  if (mimeType === 'image/heic' || mimeType === 'image/heif') {
    console.log('Converting HEIC to JPEG...');
    const converted = await heicConvert({
      buffer,
      format: 'JPEG',
      quality: 0.9
    });
    return Buffer.from(converted);
  }
  return buffer;
}

async function preprocessImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .grayscale()
    .resize({ width: 2000, withoutEnlargement: true })
    .toBuffer();
}

export async function extractTextFromImage(buffer: Buffer, mimeType: string = 'image/jpeg'): Promise<string> {
  const convertedBuffer = await convertHeicIfNeeded(buffer, mimeType);
  const processedBuffer = await preprocessImage(convertedBuffer);
  
  // Support multiple languages: English, Ukrainian, Russian
  const worker = await createWorker(['eng', 'ukr', 'rus']);
  
  try {
    const { data: { text } } = await worker.recognize(processedBuffer);
    return text;
  } finally {
    await worker.terminate();
  }
}
