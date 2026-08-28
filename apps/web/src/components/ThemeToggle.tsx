import { useEffect, useState } from 'react';
import { Icon } from './ui';

function getInitialDark(): boolean {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem('gihm_theme');
  if (stored) return stored === 'dark';
  try {
    return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;
  } catch {
    return false;
  }
}

export function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark);
}

export default function ThemeToggle() {
  const [dark, setDark] = useState(getInitialDark);

  useEffect(() => {
    applyTheme(dark);
    localStorage.setItem('gihm_theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <button
      onClick={() => setDark((d) => !d)}
      className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-g-ink dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <Icon name={dark ? 'star' : 'moon'} className="h-4.5 w-4.5" />
    </button>
  );
}
