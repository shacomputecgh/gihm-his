import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from './ui';
import { useAuth } from '../lib/auth';

interface SearchItem {
  label: string;
  path: string;
  icon: string;
  group: string;
  developerOnly?: boolean;
}

const ITEMS: SearchItem[] = [
  { label: 'Dashboard', path: '/app', icon: 'home', group: 'Navigation' },
  { label: 'Queue', path: '/app/queue', icon: 'list', group: 'Navigation' },
  { label: 'Patients', path: '/app/patients', icon: 'users', group: 'Navigation' },
  { label: 'Register Patient', path: '/app/register', icon: 'plus', group: 'Navigation' },
  { label: 'Appointments', path: '/app/appointments', icon: 'calendar', group: 'Navigation' },
  { label: 'Pharmacy', path: '/app/pharmacy', icon: 'pill', group: 'Clinical' },
  { label: 'Laboratory', path: '/app/lab', icon: 'flask', group: 'Clinical' },
  { label: 'Admissions', path: '/app/admissions', icon: 'bed', group: 'Clinical' },
  { label: 'Immunizations', path: '/app/immunizations', icon: 'syringe', group: 'Clinical' },
  { label: 'Blood Bank', path: '/app/bloodbank', icon: 'drop', group: 'Clinical' },
  { label: 'Theatre', path: '/app/theatre', icon: 'scalpel', group: 'Clinical' },
  { label: 'Radiology', path: '/app/radiology', icon: 'flask', group: 'Clinical' },
  { label: 'Telemedicine', path: '/app/telemedicine', icon: 'globe', group: 'Clinical' },
  { label: 'Referrals', path: '/app/referrals', icon: 'arrowRight', group: 'Clinical' },
  { label: 'Stock & Inventory', path: '/app/stock', icon: 'truck', group: 'Operations' },
  { label: 'Insurance', path: '/app/insurance', icon: 'card', group: 'Operations' },
  { label: 'Billing', path: '/app/billing', icon: 'card', group: 'Operations' },
  { label: 'Surveillance', path: '/app/surveillance', icon: 'activity', group: 'Analytics' },
  { label: 'Reports', path: '/app/reports', icon: 'chart', group: 'Analytics' },
  { label: 'Facility Map', path: '/app/gis', icon: 'pin', group: 'Analytics' },
  { label: 'Admin Hierarchy', path: '/app/admin-hierarchy', icon: 'shield', group: 'System' },
  { label: 'Developer Console', path: '/app/developer-console', icon: 'code', group: 'System', developerOnly: true },
  { label: 'Find Healthcare', path: '/find-healthcare', icon: 'search', group: 'Portal' },
  { label: 'Public Portal', path: '/', icon: 'globe', group: 'Portal' },
];

export default function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);

  const isDev = user?.scope === 'DEVELOPER';
  const filtered = ITEMS.filter((item) => {
    if (item.developerOnly && !isDev) return false;
    return item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.group.toLowerCase().includes(query.toLowerCase());
  });

  const pick = useCallback((item: SearchItem) => {
    navigate(item.path);
    onClose();
    setQuery('');
    setSelected(0);
  }, [navigate, onClose]);

  useEffect(() => {
    if (!open) { setQuery(''); setSelected(0); }
  }, [open]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]" role="dialog" aria-modal="true" aria-label="Quick search">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-g-dark-surface dark:border dark:border-g-dark-border">
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 dark:border-g-dark-border">
          <Icon name="search" className="h-5 w-5 text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, filtered.length - 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
              if (e.key === 'Enter' && filtered[selected]) pick(filtered[selected]);
              if (e.key === 'Escape') onClose();
            }}
            placeholder="Search pages, features…"
            className="flex-1 bg-transparent py-4 text-sm text-g-ink outline-none placeholder:text-slate-400 dark:text-g-dark-text"
          />
          <kbd className="rounded-md border border-slate-200 px-2 py-0.5 text-[10px] text-slate-400 dark:border-g-dark-border">ESC</kbd>
        </div>
        {filtered.length > 0 && (
          <div className="max-h-80 overflow-y-auto p-2">
            {filtered.map((item, i) => (
              <button
                key={item.path}
                onClick={() => pick(item)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                  i === selected ? 'bg-g-red/10 text-g-red' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5'
                }`}
              >
                <Icon name={item.icon as any} className="h-4 w-4 shrink-0" />
                <span className="flex-1 font-medium">{item.label}</span>
                <span className="text-[10px] text-slate-400">{item.group}</span>
              </button>
            ))}
          </div>
        )}
        {filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-slate-400">
            No results for "{query}"
          </div>
        )}
      </div>
    </div>
  );
}
