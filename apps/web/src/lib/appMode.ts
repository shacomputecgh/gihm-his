/**
 * Detect the running mode from the URL query parameter set by the desktop shell.
 *
 * Modes:
 *   - "online":  Connects to live API server (requires internet)
 *   - "offline": Uses local IndexedDB data, no API calls (works without internet)
 *   - "mobile":  Local data + SSE sync with mobile devices
 *   - "" (empty): Default — web browser or unknown client
 *
 * The WPF desktop shell appends ?appmode=online|offline|mobile to the URL.
 * The Expo mobile app uses the same query parameter.
 */

export type AppMode = 'online' | 'offline' | 'mobile' | '';

let cachedMode: AppMode | null = null;

export function getAppMode(): AppMode {
  if (cachedMode !== null) return cachedMode;

  const params = new URLSearchParams(window.location.search);
  const raw = params.get('appmode')?.toLowerCase() ?? '';

  if (raw === 'offline' || raw === 'mobile' || raw === 'online') {
    cachedMode = raw;
  } else {
    // Detect from hostname
    const host = window.location.hostname;
    if (host === 'app.local') {
      // Local bundled dist — check for explicit mode
      cachedMode = raw as AppMode || 'offline';
    } else if (host === 'localhost' || host === '127.0.0.1') {
      cachedMode = 'online'; // dev server = online
    } else {
      cachedMode = 'online'; // remote server = online
    }
  }

  return cachedMode;
}

export function isOfflineMode(): boolean {
  return getAppMode() === 'offline';
}

export function isMobileSyncMode(): boolean {
  return getAppMode() === 'mobile';
}

export function isOnlineMode(): boolean {
  return getAppMode() === 'online' || getAppMode() === '';
}

/** Clear the cached mode (for testing) */
export function resetAppMode(): void {
  cachedMode = null;
}
