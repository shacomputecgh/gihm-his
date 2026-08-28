const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const base = 'C:\\myHMS';
const logFile = path.join(base, '.freebuff', 'preview-5f4bb682-93eb-4587-b2da-69305bdcc188.log');
const errFile = logFile + '.err';
const pidFile = path.join(base, '.freebuff', 'preview-pid.txt');
const cwd = path.join(base, 'apps', 'web');
const viteBin = path.join(base, 'node_modules', 'vite', 'bin', 'vite.js');
const nodeExe = process.execPath; // node.exe path

const logFd = fs.openSync(logFile, 'w');
const errFd = fs.openSync(errFile, 'w');

const p = spawn(nodeExe, [viteBin, '--port', '5173'], {
  cwd,
  detached: true,
  stdio: ['ignore', logFd, errFd],
  windowsHide: true,
});
p.unref();
fs.closeSync(logFd);
fs.closeSync(errFd);
fs.writeFileSync(pidFile, String(p.pid));
console.log('PID:', p.pid);
