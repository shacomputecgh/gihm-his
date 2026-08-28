#!/usr/bin/env node
// Downloads the k6 binary into tools/k6/ if it is missing (the `k6` npm
// package is only a typing stub; there is no official npm binary wrapper).
// The binary is gitignored — CI/dev machines fetch it on first use.
//
// Usage: node tools/k6/ensure.js   (or: npm run load:k6)

const { execSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const { join } = require('node:path');

const VERSION = 'v1.4.0';
const dir = join(__dirname, '.');
const bin = join(dir, process.platform === 'win32' ? 'k6.exe' : 'k6');

if (existsSync(bin)) {
  console.log(`k6 already present: ${bin}`);
  process.exit(0);
}

const platform =
  process.platform === 'linux' ? 'linux' : process.platform === 'darwin' ? 'macos' : process.platform === 'win32' ? 'windows' : null;
const arch = process.arch === 'arm64' ? 'arm64' : 'amd64';
if (!platform) {
  console.error(`Unsupported platform: ${process.platform}`);
  process.exit(1);
}

const url = `https://github.com/grafana/k6/releases/download/${VERSION}/k6-${VERSION}-${platform}-${arch}.tar.gz`;
console.log(`Downloading k6 ${VERSION} (${platform}/${arch}) …`);
const tarball = join(dir, 'k6.tar.gz');
execSync(`curl -fsSL -o "${tarball}" "${url}"`, { stdio: 'inherit' });
execSync(`tar -xzf "${tarball}" -C "${dir}" --strip-components=1 "k6-${VERSION}-${platform}-${arch}/k6"`, { stdio: 'inherit' });
execSync(`rm -f "${tarball}"`);
console.log(`Installed: ${bin}`);
execSync(`${bin} version`, { stdio: 'inherit' });
