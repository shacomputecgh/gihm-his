import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { AuthProvider } from './lib/auth';
import { ConnectionProvider } from './lib/connection';
import { LockProvider } from './lib/lock';
import { ensureLocalBackend, initDesktopShell, setupShellEvents } from './lib/desktop';
import { Toaster } from './components/ui';
import { ErrorBoundary } from './components/ErrorBoundary';
import { applyTheme } from './components/ThemeToggle';

// Apply saved dark mode preference immediately (before paint)
try {
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;
  applyTheme(
    localStorage.getItem('gihm_theme') === 'dark' ||
    (!localStorage.getItem('gihm_theme') && prefersDark)
  );
} catch { /* SSR or test env */ }

// Inside the Tauri desktop shell: resolve the OS-stored device id + API base
// and wire native tray events (Sync now, updates result) into the SPA. No-op
// in the browser — the PWA keeps its localStorage identity and proxy base.
void initDesktopShell();
void setupShellEvents();
// 6d: bring the bundled facility edge up (docs/26 §6 6d) so the SPA finds an
// API even when the LAN has no server. The Rust setup() already auto-starts
// it; this is the belt-and-braces retry in case the user stopped it.
void ensureLocalBackend();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <LockProvider>
            <ConnectionProvider>
              <Toaster>
                <App />
              </Toaster>
            </ConnectionProvider>
          </LockProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
