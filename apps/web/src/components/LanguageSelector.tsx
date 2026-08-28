import { useState, useRef, useEffect } from 'react';
import { LANGUAGES, type Language } from '../lib/i18n';
import { useTranslation } from '../lib/i18n';
import { Icon } from './ui';

export default function LanguageSelector() {
  const { lang, setLang } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = LANGUAGES[lang];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:border-slate-300 cursor-pointer shadow-sm"
        title="Change language"
      >
        <span className="text-base">{current.flag}</span>
        <span className="text-xs font-semibold text-slate-700">{current.name.toUpperCase()}</span>
        <Icon name="chevDown" className="h-3 w-3 text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-xl dark:border-g-dark-border dark:bg-g-dark-surface">
          {Object.entries(LANGUAGES).map(([code, info]) => (
            <button
              key={code}
              onClick={() => {
                setLang(code as Language);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition ${
                lang === code
                  ? 'bg-g-red/10 text-g-red font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5'
              }`}
            >
              <span className="text-lg">{info.flag}</span>
              <div>
                <p className="font-medium">{info.name}</p>
                <p className="text-[10px] text-slate-400">{info.nativeName}</p>
              </div>
              {lang === code && <Icon name="check" className="ml-auto h-4 w-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
