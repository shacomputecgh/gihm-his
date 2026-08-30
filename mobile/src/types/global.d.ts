/** Global type augmentation for the injected offline bridge. */

interface GESOfflineBridge {
  /** Request a cached page (response arrives via onMessage). */
  getCachedPage(url: string): void;
  /** Cache a page for offline reading. */
  cachePage(url: string, html: string): void;
}

interface Window {
  GESOffline?: GESOfflineBridge;
}
