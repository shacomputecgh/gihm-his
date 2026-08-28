const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const desktopDir = path.resolve(__dirname, '..', 'desktop');
const logFile = path.resolve(__dirname, 'tauri-build.log');
const logStream = fs.createWriteStream(logFile);

const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const child = spawn(npxCmd, ['tauri', 'build', '--bundles', 'msi'], {
  cwd: desktopDir,
  env: { ...process.env, PATH: `${path.join(process.env.USERPROFILE, '.cargo', 'bin')};${process.env.PATH}` },
  stdio: ['ignore', 'pipe', 'pipe'],
  detached: true,
  shell: true,
});

child.stdout.pipe(logStream);
child.stderr.pipe(logStream);
child.unref();

console.log(`Tauri build started, PID: ${child.pid}`);
console.log(`Log: ${logFile}`);
fs.writeFileSync(path.resolve(__dirname, 'tauri-build-pid.txt'), String(child.pid));
