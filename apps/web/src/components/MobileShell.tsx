import { useState, useEffect } from 'react';
import { Badge } from './ui';

interface NetworkStatus {
  online: boolean;
  connectionType: string;
}

/**
 * MobileShell — wraps the app with Capacitor-specific functionality:
 * - Online/offline detection
 * - Offline-first data caching
 * - Device information display
 * - Camera access for barcode scanning
 *
 * When running in a native Capacitor shell, this provides the bridge
 * between the web app and native device features.
 */
export function MobileShell({ children }: { children: React.ReactNode }) {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    online: navigator.onLine,
    connectionType: 'unknown',
  });
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    // Detect if running in Capacitor
    const capacitor = (window as any).Capacitor;
    setIsNative(!!capacitor);

    // Monitor network status
    function updateStatus() {
      const conn = (navigator as any).connection;
      setNetworkStatus({
        online: navigator.onLine,
        connectionType: conn?.effectiveType ?? 'unknown',
      });
    }

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    updateStatus();

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  return (
    <div className="relative">
      {/* Network status banner */}
      {!networkStatus.online && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-amber-500 px-3 py-1.5 text-xs font-medium text-white">
          📡 Offline mode — using cached data
        </div>
      )}

      {/* Native app indicator */}
      {isNative && (
        <div className="fixed bottom-2 right-2 z-40">
          <Badge tone="blue">📱 Native App</Badge>
        </div>
      )}

      {children}
    </div>
  );
}

/**
 * Service Worker registration for offline support
 */
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('SW registered:', reg.scope);
        })
        .catch((err) => {
          console.log('SW registration failed:', err);
        });
    });
  }
}

/**
 * Check if the app is running in a native Capacitor shell
 */
export function isNativeApp(): boolean {
  return !!(window as any).Capacitor;
}

/**
 * Get device information for native apps
 */
export function getDeviceInfo(): { platform: string; isNative: boolean; version: string } {
  const capacitor = (window as any).Capacitor;
  if (capacitor) {
    return {
      platform: capacitor.getPlatform?.() ?? 'unknown',
      isNative: true,
      version: capacitor.getManifest?.()?.version ?? '1.0.0',
    };
  }
  return {
    platform: navigator.userAgent.includes('Mobile') ? 'mobile-web' : 'desktop-web',
    isNative: false,
    version: '1.0.0',
  };
}
