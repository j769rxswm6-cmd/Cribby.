import sharp from 'sharp';

async function generate() {
  try {
    await sharp('./public/icon.svg')
      .resize(192, 192)
      .png()
      .toFile('./public/icon-192.png');
    console.log('192x192 generated');

    await sharp('./public/icon.svg')
      .resize(512, 512)
      .png()
      .toFile('./public/icon-512.png');
    console.log('512x512 generated');
  } catch (e) {
    console.error('Error generating PNGs:', e);
  }
}

generate();
