import { useEffect } from 'react';

/**
 * Register global keyboard shortcuts.
 * Usage: useKeyboard({ 'k': () => setSearchOpen(true), 'Escape': () => close() });
 */
export function useKeyboard(shortcuts: Record<string, (e: KeyboardEvent) => void>) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Skip if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      // Support Cmd/Ctrl + key combos
      const key = e.metaKey || e.ctrlKey ? `mod+${e.key.toLowerCase()}` : e.key.toLowerCase();
      const fn = shortcuts[key] ?? shortcuts[e.key];
      if (fn) {
        e.preventDefault();
        fn(e);
      }
    }

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts]);
}
