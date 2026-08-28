import { createContext, useCallback, useContext, useEffect, useState, type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Icon, type IconName } from './icons';

export { Icon };
export type { IconName };

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

// ------------------------------------------------------------------ Button
type ButtonVariant = 'primary' | 'navy' | 'green' | 'outline' | 'ghost' | 'danger';
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: IconName;
}
const BTN_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-g-red text-white hover:bg-g-red-dark shadow-sm',
  navy: 'bg-g-navy text-white hover:bg-g-navy-2 shadow-sm',
  green: 'bg-g-green text-white hover:bg-g-green-dark shadow-sm',
  outline: 'border border-slate-300 bg-white text-g-ink hover:border-g-navy hover:text-g-navy',
  ghost: 'text-g-navy hover:bg-g-mist',
  danger: 'bg-g-red/10 text-g-red hover:bg-g-red/20',
};
const BTN_SIZES = { sm: 'h-8 px-3 text-xs', md: 'h-10 px-4 text-sm', lg: 'h-12 px-6 text-base' };
export function Button({ variant = 'primary', size = 'md', loading, icon, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-g-red active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
        BTN_VARIANTS[variant],
        BTN_SIZES[size],
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : icon ? <Icon name={icon} className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

// ------------------------------------------------------------------- Card
export function Card({ title, subtitle, action, children, className, pad = true, onClick }: { title?: ReactNode; subtitle?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; pad?: boolean; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={cn('rounded-xl border border-slate-200 bg-white shadow-sm dark:border-g-dark-border dark:bg-g-dark-surface', onClick && 'cursor-pointer hover:shadow-md transition-shadow', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5 dark:border-g-dark-border">
          <div>
            <h3 className="text-sm font-semibold text-g-ink dark:text-g-dark-text">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={pad ? 'p-5' : ''}>{children}</div>
    </div>
  );
}

// ------------------------------------------------------------------- Badge
type Tone = 'green' | 'red' | 'gold' | 'navy' | 'gray' | 'blue' | 'purple' | 'orange';
export type { Tone };
const TONES: Record<Tone, string> = {
  green: 'bg-g-green/10 text-g-green border-g-green/20 dark:bg-g-green/20 dark:text-green-300 dark:border-green-700',
  red: 'bg-g-red/10 text-g-red border-g-red/20 dark:bg-g-red/20 dark:text-red-300 dark:border-red-700',
  gold: 'bg-g-gold/20 text-yellow-800 border-g-gold/40 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
  navy: 'bg-g-navy/10 text-g-navy border-g-navy/20 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
  gray: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600',
  blue: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-700',
  purple: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
  orange: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700',
};
export function Badge({ tone = 'gray', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap', TONES[tone], className)}>{children}</span>;
}

// ----------------------------------------------------------------- StatCard
export function StatCard({ label, value, icon, tone = 'navy', hint }: { label: string; value: ReactNode; icon: IconName; tone?: Tone; hint?: string }) {
  const ICON_TONES: Record<Tone, string> = {
    green: 'bg-g-green/10 text-g-green',
    red: 'bg-g-red/10 text-g-red',
    gold: 'bg-g-gold/25 text-yellow-800',
    navy: 'bg-g-navy/10 text-g-navy',
    gray: 'bg-slate-100 text-slate-500',
    blue: 'bg-sky-50 text-sky-600',
  };
  return (
    <div className="card-hover rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-g-dark-border dark:bg-g-dark-surface">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-g-dark-muted">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-g-ink tabular-nums dark:text-g-dark-text">{value}</p>
          {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
        </div>
        <div className={cn('rounded-lg p-2.5', ICON_TONES[tone])}>
          <Icon name={icon} className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Forms
export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-xs font-semibold text-g-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}
const INPUT_CLS =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-g-ink placeholder:text-slate-400 focus:border-g-red focus:outline-none focus:ring-2 focus:ring-g-red/20 transition dark:border-g-dark-border dark:bg-g-dark-surface dark:text-g-dark-text dark:placeholder:text-slate-500';
export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(INPUT_CLS, className)} {...rest} />;
}
export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(INPUT_CLS, 'appearance-none pr-8 bg-[url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="%2364748b" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>\')] bg-no-repeat bg-[right_0.75rem_center]', className)} {...rest}>
      {children}
    </select>
  );
}
export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(INPUT_CLS, 'min-h-24', className)} {...rest} />;
}

// ------------------------------------------------------------------ Misc
export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-slate-400">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-g-red border-t-transparent" />
      <span className="text-sm">{label ?? 'Loading…'}</span>
    </div>
  );
}

export function EmptyState({ icon = 'info', title, message, action }: { icon?: IconName; title: string; message?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-12 text-center">
      <div className="mb-3 rounded-full bg-white p-3 text-slate-400 shadow-sm"><Icon name={icon} className="h-6 w-6" /></div>
      <p className="text-sm font-semibold text-g-ink">{title}</p>
      {message && <p className="mt-1 max-w-sm text-xs text-slate-500">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-g-ink dark:text-g-dark-text">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-g-dark-muted">{subtitle}</p>}
      </div>
      {action && <div className="flex gap-2">{action}</div>}
    </div>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg bg-g-mist p-1 dark:bg-g-dark-surface">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer',
            value === o.value ? 'bg-white text-g-red shadow-sm' : 'text-slate-500 hover:text-g-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function FlagStripe({ className }: { className?: string }) {
  return <div className={cn('ghana-flag-stripe h-1.5 w-full', className)} />;
}

export function DemoBanner({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-gold/40 bg-g-gold/15 px-3 py-1.5 text-[11px] font-semibold text-yellow-900">
      <Icon name="info" className="h-3.5 w-3.5" />
      {compact ? 'DEMO / SYNTHETIC DATA' : 'DEMO / SYNTHETIC DATA — fictional records for development only. Not affiliated with the Ministry of Health or Ghana Health Service.'}
    </div>
  );
}

// ------------------------------------------------------------------ Toasts
interface Toast {
  id: number;
  message: string;
  tone: 'success' | 'error' | 'info';
}
const ToastContext = createContext<(message: string, tone?: Toast['tone']) => void>(() => undefined);
export function useToast() {
  return useContext(ToastContext);
}
export function Toaster({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string, tone: Toast['tone'] = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);
  useEffect(() => {
    const onOfflineSave = (e: Event) => push((e as CustomEvent<string>).detail ?? 'Saved locally — will sync when connected.', 'info');
    window.addEventListener('gihm:offline-saved', onOfflineSave);
    return () => window.removeEventListener('gihm:offline-saved', onOfflineSave);
  }, [push]);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-5 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 flex-col gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'fade-in pointer-events-auto flex items-start gap-2 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur',
              t.tone === 'success' && 'border-g-green/30 bg-g-green/95 text-white',
              t.tone === 'error' && 'border-g-red/30 bg-g-red/95 text-white',
              t.tone === 'info' && 'border-slate-200 bg-white/95 text-g-ink',
            )}
          >
            <Icon name={t.tone === 'success' ? 'check' : t.tone === 'error' ? 'alert' : 'info'} className="mt-0.5 h-4 w-4 shrink-0" />
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ------------------------------------------------------------------ Modal
export function Modal({ onClose, children, className }: { onClose: () => void; children: ReactNode; className?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className={cn('relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl', className)} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition text-sm font-bold" aria-label="Close">
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Drawer
export function Drawer({ onClose, children, className }: { onClose: () => void; children: ReactNode; className?: string }) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-g-ink/30" onClick={onClose}>
      <div className={cn('relative flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl', className)} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition text-sm font-bold" aria-label="Close">
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
