/**
 * PWA Icon Generator Script
 * 
 * This script generates all required PWA icons from a source image.
 * 
 * Usage:
 *   1. Place a high-resolution source image (1024x1024 PNG) at public/icons/source.png
 *   2. Run: npx tsx scripts/generate-icons.ts
 * 
 * Requirements:
 *   npm install sharp --save-dev
 */

import * as fs from 'fs';
import * as path from 'path';

// Icon sizes needed for PWA
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const MASKABLE_SIZES = [192, 512];

async function generateIcons() {
  console.log('🎨 PWA Icon Generator');
  console.log('=====================\n');
  
  const sourceFile = path.join(process.cwd(), 'public/icons/source.png');
  const outputDir = path.join(process.cwd(), 'public/icons');
  
  // Check if source image exists
  if (!fs.existsSync(sourceFile)) {
    console.log('⚠️  No source image found at public/icons/source.png\n');
    console.log('Creating placeholder SVG icons instead...\n');
    await createPlaceholderIcons(outputDir);
    return;
  }
  
  try {
    // Dynamic import for sharp (may not be installed)
    const sharp = await import('sharp');
    
    console.log('📁 Source: public/icons/source.png');
    console.log('📂 Output: public/icons/\n');
    
    // Generate standard icons
    for (const size of ICON_SIZES) {
      const outputFile = path.join(outputDir, `icon-${size}.png`);
      await sharp.default(sourceFile)
        .resize(size, size)
        .png()
        .toFile(outputFile);
      console.log(`✅ Generated icon-${size}.png`);
    }
    
    // Generate maskable icons (with padding for safe area)
    for (const size of MASKABLE_SIZES) {
      const outputFile = path.join(outputDir, `icon-maskable-${size}.png`);
      const innerSize = Math.floor(size * 0.8); // 80% of size for safe area
      const padding = Math.floor((size - innerSize) / 2);
      
      await sharp.default(sourceFile)
        .resize(innerSize, innerSize)
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(outputFile);
      console.log(`✅ Generated icon-maskable-${size}.png`);
    }
    
    console.log('\n🎉 All icons generated successfully!');
    
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    console.log('\nFalling back to placeholder icons...');
    await createPlaceholderIcons(outputDir);
  }
}

async function createPlaceholderIcons(outputDir: string) {
  // Create simple SVG placeholder that can be converted to PNG later
  const allSizes = [...ICON_SIZES, ...MASKABLE_SIZES.map(s => `maskable-${s}`)];
  
  for (const sizeSpec of allSizes) {
    const isMaskable = typeof sizeSpec === 'string' && sizeSpec.startsWith('maskable-');
    const size = isMaskable ? parseInt(sizeSpec.replace('maskable-', '')) : sizeSpec;
    const filename = isMaskable ? `icon-${sizeSpec}.svg` : `icon-${size}.svg`;
    
    const svg = createPlaceholderSVG(size as number, isMaskable);
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, svg);
    console.log(`✅ Created placeholder ${filename}`);
  }
  
  console.log('\n📝 Note: These are SVG placeholders.');
  console.log('   For production, either:');
  console.log('   1. Add source.png and run again with sharp installed');
  console.log('   2. Replace SVGs with properly designed PNG icons');
  console.log('   3. Use an online tool like realfavicongenerator.net\n');
}

function createPlaceholderSVG(size: number, isMaskable: boolean): string {
  const bgColor = '#3b82f6'; // Blue-500
  const textColor = '#ffffff';
  const text = 'O'; // First letter of Overmark
  const fontSize = Math.floor(size * 0.5);
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${bgColor}" rx="${isMaskable ? 0 : size * 0.1}"/>
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" 
        font-family="system-ui, sans-serif" font-weight="bold" font-size="${fontSize}" fill="${textColor}">
    ${text}
  </text>
</svg>`;
}

// Run the generator
generateIcons().catch(console.error);
