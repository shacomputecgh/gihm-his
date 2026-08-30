#!/usr/bin/env node
/**
 * build-release.mjs — GIHM-HIS Desktop Build Orchestrator
 *
 * Cross-platform script (Node.js + dotnet) for the full release pipeline:
 *   1. Generate app icon
 *   2. dotnet publish → self-contained single-file .exe
 *   3. Create portable .zip (via PowerShell Compress-Archive on Windows, tar on Linux)
 *   4. dotnet publish → Setup.exe (self-extracting installer)
 *   5. Append app payload to Setup.exe
 *   6. Generate SHA-256 manifest (latest.json)
 *
 * Usage:
 *   node desktop/dotnet/build-release.mjs [--version 0.1.0] [--config Release]
 */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync, statSync, unlinkSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { createHash } from "node:crypto";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = dirname(__filename);
const REPO_ROOT = resolve(SCRIPT_DIR, "../..");
const DOTNET_DIR = SCRIPT_DIR;
const ASSETS_DIR = join(REPO_ROOT, "desktop", "assets");

const PRODUCT = "GIHM-HIS";

// ── CLI args ───────────────────────────────────────────────────

const { values: args } = parseArgs({
  options: {
    version: { type: "string", default: "" },
    config: { type: "string", default: "Release" },
    output: { type: "string", default: "" },
  },
  strict: false,
});

const OUTPUT_ROOT = args.output || join(DOTNET_DIR, "publish");
const CONFIG = args.config;
const VERSION = args.version ||
  JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf8")).version;

const isWin = process.platform === "win32";

// ── Helpers ────────────────────────────────────────────────────

function log(step, total, msg) {
  console.log(`\n[${step}/${total}] ${msg}`);
}

function run(cmd) {
  console.log(`  $ ${cmd}`);
  execSync(cmd, { cwd: REPO_ROOT, stdio: "inherit", env: { ...process.env } });
}

function sha256(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function mb(bytes) {
  return (bytes / 1024 / 1024).toFixed(1);
}

function zipDir(sourceDir, zipPath) {
  if (isWin) {
    const psScript = `Compress-Archive -Path '${sourceDir}\\*' -DestinationPath '${zipPath}' -CompressionLevel Optimal`;
    execSync(`powershell -NoProfile -Command "${psScript}"`, { stdio: "inherit" });
  } else {
    execSync(`cd "${sourceDir}" && tar -czf "${zipPath}" .`, { stdio: "inherit" });
  }
}

// ════════════════════════════════════════════════════════════════
// BUILD PIPELINE
// ════════════════════════════════════════════════════════════════

console.log(`
═══════════════════════════════════════════════════
  ${PRODUCT} Desktop — v${VERSION} (${CONFIG})
═══════════════════════════════════════════════════`);

// ── Step 1: Generate App Icon ──────────────────────────────────

log(1, 6, "Generating app icon…");
mkdirSync(ASSETS_DIR, { recursive: true });
const iconScript = join(REPO_ROOT, "scripts", "generate-app-icon.mjs");
if (existsSync(iconScript)) {
  run(`node "${iconScript}" --platform desktop --output "${ASSETS_DIR}"`);
} else {
  console.log("  ⚠ Icon script not found, skipping.");
}

// ── Step 2: Publish self-contained .exe ────────────────────────

log(2, 7, "Publishing self-contained .exe…");
const appPublishDir = join(OUTPUT_ROOT, "app");
run(
  `dotnet publish "${join(DOTNET_DIR, "src", "SchoolManagement", "SchoolManagement.csproj")}"` +
  ` -c ${CONFIG} -r win-x64 --self-contained true` +
  ` -p:PublishSingleFile=true -p:Version=${VERSION}` +
  ` -o "${appPublishDir}"`
);

const appExe = join(appPublishDir, `${PRODUCT}.exe`);
console.log(`  ✓ Published: ${appExe}`);

// ── Step 3: Bundle web dist + API + database ──────────────────

log(3, 7, "Bundling web dist + API + database…");
const webDistSrc = join(REPO_ROOT, "apps", "web", "dist");
const webDistDst = join(appPublishDir, "web-dist");
if (existsSync(webDistSrc)) {
  execSync(`xcopy "${webDistSrc}" "${webDistDst}\" /E /I /Y /Q`, { stdio: "inherit" });
  console.log(`  ✓ Web dist → web-dist/`);
} else {
  console.log("  ⚠ Web dist not found — run 'npm run build' first");
}

// Copy API server + database for offline mode
const apiSrc = join(REPO_ROOT, "apps", "api");
const apiDst = join(appPublishDir, "api");
mkdirSync(apiDst, { recursive: true });
const apiFiles = ["src", "prisma", "package.json"];
for (const f of apiFiles) {
  const src = join(apiSrc, f);
  if (existsSync(src)) {
    const dst = join(apiDst, f);
    execSync(`xcopy "${src}" "${dst}" /E /I /Y /Q`, { stdio: "inherit" });
  }
}
console.log(`  ✓ API server + database → api/`);

// ── Step 4: Create portable .zip ───────────────────────────────

log(4, 7, "Creating portable .zip…");
const zipName = `${PRODUCT}-${VERSION}-Portable.zip`;
const zipPath = join(OUTPUT_ROOT, zipName);

if (existsSync(zipPath)) unlinkSync(zipPath);

zipDir(appPublishDir, zipPath);
console.log(`  ✓ Created: ${zipPath}`);

// ── Step 5: Build Setup.exe installer ──────────────────────────

log(5, 7, "Building Setup.exe…");
const setupPublishDir = join(OUTPUT_ROOT, "setup");
run(
  `dotnet publish "${join(DOTNET_DIR, "src", "SchoolManagement.Setup", "SchoolManagement.Setup.csproj")}"` +
  ` -c ${CONFIG} -r win-x64 --self-contained true` +
  ` -p:PublishSingleFile=true -p:Version=${VERSION}` +
  ` -o "${setupPublishDir}"`
);

// ── Step 6: Create ZIP payload of entire system ───────────────

log(6, 7, "Creating ZIP payload of entire system…");
const payloadZip = join(OUTPUT_ROOT, "payload.zip");
if (existsSync(payloadZip)) unlinkSync(payloadZip);
zipDir(appPublishDir, payloadZip);
const payloadSize = statSync(payloadZip).size;
console.log(`  ✓ Payload ZIP: ${mb(payloadSize)} MB (web dist + API + DB + exe)`);

// Append payload ZIP to Setup.exe
const setupExe = join(setupPublishDir, `${PRODUCT}-Setup.exe`);
const installerExe = join(OUTPUT_ROOT, `${PRODUCT}-${VERSION}-Setup.exe`);

const setupBytes = readFileSync(setupExe);
const payloadBytes = readFileSync(payloadZip);

// Format: [setup.exe] [ZIP payload] [4-byte LE payload length] [GCM\0 marker]
const marker = Buffer.from("GCM\0");
const lenBuf = Buffer.alloc(4);
lenBuf.writeUInt32LE(payloadBytes.length, 0);

writeFileSync(installerExe, Buffer.concat([setupBytes, payloadBytes, lenBuf, marker]));
const installerSize = statSync(installerExe).size;
console.log(`  ✓ Created: ${installerExe} (${mb(installerSize)} MB)`);
if (existsSync(payloadZip)) unlinkSync(payloadZip);

// ── Step 7: Generate auto-update manifest ──────────────────────

log(7, 7, "Publishing auto-update manifest…");
const publicDir = join(REPO_ROOT, "public", "desktop");
mkdirSync(publicDir, { recursive: true });

const hash = sha256(installerExe);
const artifactName = `${PRODUCT}-${VERSION}-Setup.exe`;

copyFileSync(installerExe, join(publicDir, artifactName));
copyFileSync(zipPath, join(publicDir, zipName));

const manifest = {
  version: VERSION,
  releaseDate: new Date().toISOString().replace(/\.\d+Z$/, "Z"),
  url: `/desktop/${artifactName}`,
  sha256: hash,
  releaseNotes: "",
  artifacts: {
    setup: `/desktop/${artifactName}`,
    portable: `/desktop/${zipName}`,
  },
};

writeFileSync(join(publicDir, "latest.json"), JSON.stringify(manifest, null, 2));
console.log(`  ✓ Manifest: ${join(publicDir, "latest.json")}`);
console.log(`  ✓ SHA-256:  ${hash}`);

// ── Summary ────────────────────────────────────────────────────

const zipSize = statSync(zipPath).size;

console.log(`
═══════════════════════════════════════════════════
  ✅ Build complete — ${PRODUCT} v${VERSION} (${CONFIG})
═══════════════════════════════════════════════════

  📦 Setup.exe:    ${installerExe}
     ${mb(installerSize)} MB (full system: web + API + DB + exe)
     SHA-256: ${hash}

  📁 Portable.zip: ${zipPath}
     ${mb(zipSize)} MB (unzip and run)

  📋 Manifest:     ${join(publicDir, "latest.json")}

  Distribution:
    • ${PRODUCT}-${VERSION}-Setup.exe — double-click install
    • ${PRODUCT}-${VERSION}-Portable.zip — unzip anywhere
    • latest.json — auto-update manifest
═══════════════════════════════════════════════════`);
