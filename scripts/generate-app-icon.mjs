#!/usr/bin/env node
/**
 * generate-app-icon.mjs
 *
 * Generates app icons for all platforms from the ShaComputeC developer logo.
 *
 * Source: apps/web/public/shacomputec-logo.png (1500×1500)
 *
 * Usage:
 *   node scripts/generate-app-icon.mjs --platform desktop --output desktop/assets
 *   node scripts/generate-app-icon.mjs --platform mobile --output mobile/assets
 *   node scripts/generate-app-icon.mjs --platform all --output .
 *
 * Requires: sharp (npm install sharp)
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { existsSync } from "node:fs";

const { values: args } = parseArgs({
  options: {
    platform: { type: "string", default: "all" },
    output: { type: "string", default: "." },
  },
  strict: false,
});

const OUTPUT_DIR = resolve(args.output);

// Source logo path (relative to repo root)
const REPO_ROOT = resolve(".");
const SOURCE_LOGO = join(REPO_ROOT, "apps", "web", "public", "shacomputec-logo.png");

async function getSharp() {
  const { default: sharp } = await import("sharp");
  return sharp;
}

async function generateDesktopIcons(sharp) {
  console.log("  → Generating desktop icons (.ico, .png) from ShaComputeC logo…");
  const iconsDir = join(OUTPUT_DIR, "icons");
  await mkdir(iconsDir, { recursive: true });

  const source = sharp(SOURCE_LOGO);

  // Generate PNGs at required sizes
  const sizes = [16, 32, 48, 64, 128, 256, 512, 1024];
  const pngBuffers = [];

  for (const size of sizes) {
    const png = await source.clone().resize(size, size, { fit: "contain", background: { r: 18, g: 32, b: 58, alpha: 1 } }).png().toBuffer();
    pngBuffers.push({ size, buffer: png });

    const suffix = size === 512 ? "" : `-${size}`;
    await writeFile(join(iconsDir, `icon${suffix}.png`), png);
  }

  // Generate ICO (multi-resolution)
  const icoSizes = [16, 32, 48, 64, 128, 256];
  const icoPngs = pngBuffers.filter(p => icoSizes.includes(p.size));

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(icoPngs.length, 4);

  const dirEntries = [];
  let dataOffset = 6 + (icoPngs.length * 16);

  for (const { size, buffer } of icoPngs) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size > 255 ? 0 : size, 0);
    entry.writeUInt8(size > 255 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(buffer.length, 8);
    entry.writeUInt32LE(dataOffset, 12);
    dirEntries.push(entry);
    dataOffset += buffer.length;
  }

  const ico = Buffer.concat([header, ...dirEntries, ...icoPngs.map(p => p.buffer)]);
  await writeFile(join(iconsDir, "icon.ico"), ico);

  // Also copy the main icon.png (512×512)
  const mainPng = await source.clone().resize(512, 512, { fit: "contain", background: { r: 18, g: 32, b: 58, alpha: 1 } }).png().toBuffer();
  await writeFile(join(iconsDir, "icon.png"), mainPng);

  // Copy source logo as the app icon too
  const logoCopy = await source.clone().resize(512, 512, { fit: "contain", background: { r: 18, g: 32, b: 58, alpha: 1 } }).png().toBuffer();
  await writeFile(join(OUTPUT_DIR, "app-icon.png"), logoCopy);

  console.log(`  ✓ Desktop icons → ${iconsDir}/`);
}

async function generateMobileIcons(sharp) {
  console.log("  → Generating mobile icons from ShaComputeC logo…");
  await mkdir(OUTPUT_DIR, { recursive: true });

  const source = sharp(SOURCE_LOGO);

  // Android adaptive icon: 1024×1024 with dark background
  const adaptiveIcon = await source.clone()
    .resize(1024, 1024, { fit: "contain", background: { r: 18, g: 32, b: 58, alpha: 1 } })
    .png().toBuffer();
  await writeFile(join(OUTPUT_DIR, "icon.png"), adaptiveIcon);

  // iOS AppIcon: 1024×1024
  await writeFile(join(OUTPUT_DIR, "AppIcon.png"), adaptiveIcon);

  // Splash screens with the logo centered on brand background
  for (const [w, h, name] of [
    [1080, 1920, "splash.png"],
    [1284, 2778, "splash-6.7.png"],
  ]) {
    // Create a dark background canvas with the logo centered
    const splash = await sharp({
      create: { width: w, height: h, channels: 4, background: { r: 18, g: 32, b: 58, alpha: 1 } }
    })
      .composite([{
        input: await source.clone().resize(Math.floor(w * 0.3), Math.floor(w * 0.3), { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(),
        gravity: "center",
      }])
      .png().toBuffer();
    await writeFile(join(OUTPUT_DIR, name), splash);
  }

  // Favicon for PWA
  const favicon = await source.clone().resize(192, 192, { fit: "contain", background: { r: 18, g: 32, b: 58, alpha: 1 } }).png().toBuffer();
  await writeFile(join(OUTPUT_DIR, "favicon.png"), favicon);

  console.log(`  ✓ Mobile icons → ${OUTPUT_DIR}/`);
}

async function main() {
  const platform = args.platform;
  console.log(`\n🎨 Generating GIHM-HIS icons from ShaComputeC logo (platform: ${platform})…\n`);

  // Verify source logo exists
  if (!existsSync(SOURCE_LOGO)) {
    console.error(`❌ Source logo not found: ${SOURCE_LOGO}`);
    console.error("   Place shacomputec-logo.png in apps/web/public/");
    process.exit(1);
  }

  const sharp = await getSharp();
  const meta = await sharp(SOURCE_LOGO).metadata();
  console.log(`  Source: ${SOURCE_LOGO} (${meta.width}×${meta.height} ${meta.format})`);

  if (platform === "desktop" || platform === "all") {
    await generateDesktopIcons(sharp);
  }
  if (platform === "mobile" || platform === "all") {
    await generateMobileIcons(sharp);
  }

  console.log("\n✅ Icon generation complete.\n");
}

main().catch((err) => {
  console.error("❌ Icon generation failed:", err.message);
  process.exit(1);
});
