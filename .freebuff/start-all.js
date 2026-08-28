/**
 * Combined launcher — starts both the API backend and Vite dev server
 * as detached background processes on Windows.
 *
 * Usage: node .freebuff/start-all.js
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const base = 'C:\\myHMS';

function launch(label, cmd, args, cwd, env) {
  const logFile = path.join(base, '.freebuff', `${label}.log`);
  const errFile = logFile + '.err';
  const pidFile = path.join(base, '.freebuff', `${label}-pid.txt`);

  const logFd = fs.openSync(logFile, 'w');
  const errFd = fs.openSync(errFile, 'w');

  const p = spawn(cmd, args, {
    cwd,
    detached: true,
    stdio: ['ignore', logFd, errFd],
    windowsHide: true,
    env: { ...process.env, ...env },
  });
  p.unref();
  fs.closeSync(logFd);
  fs.closeSync(errFd);
  fs.writeFileSync(pidFile, String(p.pid));
  return p.pid;
}

// 1) API server (port 4000)
const apiPid = launch(
  'api-server',
  process.execPath,
  [path.join(base, 'node_modules', 'tsx', 'dist', 'cli.mjs'), 'src/server.ts'],
  path.join(base, 'apps', 'api'),
  { PORT: '4000' },
);

// 2) Vite dev server (port 5173)
const vitePid = launch(
  'preview-5f4bb682-93eb-4587-b2da-69305bdcc188',
  process.execPath,
  [path.join(base, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', '5173'],
  path.join(base, 'apps', 'web'),
  {},
);

console.log(`API server PID: ${apiPid}`);
console.log(`Vite dev server PID: ${vitePid}`);
console.log('Logs in C:\\myHMS\\.freebuff\\');
