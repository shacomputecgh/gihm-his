const { app, BrowserWindow, shell, Menu, Tray, nativeImage } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let apiProcess;
let tray;

const API_PORT = 4000;
const isDev = !app.isPackaged;

// Start the API server
function startApiServer() {
  const apiDir = isDev 
    ? path.join(__dirname, '..', 'apps', 'api')
    : path.join(process.resourcesPath, 'api');

  console.log('Starting API server from:', apiDir);

  try {
    // Try to start with tsx
    apiProcess = spawn('npx', ['tsx', 'src/server.ts'], {
      cwd: apiDir,
      env: { ...process.env, PORT: String(API_PORT), DATABASE_URL: `file:${path.join(apiDir, 'prisma', 'dev.db')}` },
      stdio: 'pipe',
      shell: true
    });

    apiProcess.stdout.on('data', (data) => {
      console.log('API:', data.toString());
    });

    apiProcess.stderr.on('data', (data) => {
      console.error('API Error:', data.toString());
    });

    apiProcess.on('error', (err) => {
      console.error('Failed to start API:', err);
      // Try alternative: run with node directly
      tryAlternativeApiStart(apiDir);
    });

    apiProcess.on('exit', (code) => {
      console.log('API exited with code:', code);
    });
  } catch (err) {
    console.error('Error starting API:', err);
    tryAlternativeApiStart(apiDir);
  }
}

function tryAlternativeApiStart(apiDir) {
  try {
    apiProcess = spawn('node', ['node_modules/.bin/tsx', 'src/server.ts'], {
      cwd: apiDir,
      env: { ...process.env, PORT: String(API_PORT), DATABASE_URL: `file:${path.join(apiDir, 'prisma', 'dev.db')}` },
      stdio: 'pipe',
      shell: true
    });
    apiProcess.stdout.on('data', (d) => console.log('API:', d.toString()));
    apiProcess.stderr.on('data', (d) => console.error('API:', d.toString()));
  } catch (err) {
    console.error('Alternative API start failed:', err);
  }
}

// Wait for API to be ready
async function waitForApi(maxRetries = 30, delay = 1000) {
  const http = require('http');
  for (let i = 0; i < maxRetries; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${API_PORT}/api/v1/health`, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.setTimeout(500, () => { req.destroy(); reject(new Error('timeout')); });
      });
      console.log('API is ready!');
      return true;
    } catch {
      await new Promise(r => setTimeout(r, delay));
    }
  }
  console.log('API did not start in time, loading frontend anyway');
  return false;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'GIHM-HIS - Ghana Integrated Health Management System',
    icon: path.join(__dirname, 'icons', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    titleBarStyle: 'default',
    show: false
  });

  // Build menu
  const template = [
    {
      label: 'GIHM-HIS',
      submenu: [
        { label: 'About GIHM-HIS', click: () => shell.openExternal('https://shacomputecghapp.unaux.com') },
        { type: 'separator' },
        { label: 'Developer Console', accelerator: 'CmdOrCtrl+Shift+D', click: () => openDevConsole() },
        { type: 'separator' },
        { label: 'Exit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => mainWindow.reload() },
        { label: 'Toggle DevTools', accelerator: 'F12', click: () => mainWindow.webContents.toggleDevTools() },
        { type: 'separator' },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+=', click: () => mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() + 0.1) },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', click: () => mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() - 0.1) },
        { label: 'Reset Zoom', accelerator: 'CmdOrCtrl+0', click: () => mainWindow.webContents.setZoomLevel(0) },
        { type: 'separator' },
        { label: 'Fullscreen', accelerator: 'F11', click: () => mainWindow.setFullScreen(!mainWindow.isFullScreen()) }
      ]
    },
    {
      label: 'Help',
      submenu: [
        { label: 'System Guide', click: () => mainWindow.loadURL(`http://localhost:${API_PORT}/app/system-guide`) },
        { label: 'API Documentation', click: () => shell.openExternal('http://localhost:4000/docs') },
        { type: 'separator' },
        { label: 'Visit ShaComputeC', click: () => shell.openExternal('https://shacomputecghapp.unaux.com') },
        { label: 'Report Issue', click: () => shell.openExternal('mailto:shacomputec@gmail.com?subject=GIHM-HIS Issue Report') }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Show when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load the frontend
  mainWindow.loadURL(`http://localhost:${API_PORT}`);

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function openDevConsole() {
  const devWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Developer Console - ShaComputeC',
    icon: path.join(__dirname, 'icons', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  devWindow.loadURL(`http://localhost:${API_PORT}/developer`);
}

// App lifecycle
app.whenReady().then(async () => {
  console.log('Starting GIHM-HIS...');
  console.log('Packaged:', app.isPackaged);
  console.log('Resources:', process.resourcesPath);

  startApiServer();

  const apiReady = await waitForApi(45, 1000);
  console.log('API ready:', apiReady);

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // Kill API server
  if (apiProcess) {
    apiProcess.kill('SIGTERM');
    setTimeout(() => {
      try { apiProcess.kill('SIGKILL'); } catch {}
    }, 3000);
  }
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (apiProcess) {
    apiProcess.kill('SIGTERM');
  }
});
