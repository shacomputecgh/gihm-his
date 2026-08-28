const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const base = 'C:\\myHMS';
const logFile = path.join(base, '.freebuff', 'api-server.log');
const errFile = logFile + '.err';
const pidFile = path.join(base, '.freebuff', 'api-pid.txt');
const cwd = path.join(base, 'apps', 'api');
const tsxBin = path.join(base, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const nodeExe = process.execPath;

const logFd = fs.openSync(logFile, 'w');
const errFd = fs.openSync(errFile, 'w');

const p = spawn(nodeExe, [tsxBin, 'src/server.ts'], {
  cwd,
  detached: true,
  stdio: ['ignore', logFd, errFd],
  windowsHide: true,
  env: { ...process.env, PORT: '4000' },
});
p.unref();
fs.closeSync(logFd);
fs.closeSync(errFd);
fs.writeFileSync(pidFile, String(p.pid));
console.log('API PID:', p.pid);
