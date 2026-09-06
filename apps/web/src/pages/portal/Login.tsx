import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { Button, DemoBanner, FlagStripe, Icon } from '../../components/ui';

const SECTORS = [
  { value: 'GOVERNMENT', label: '🏛 Government' },
  { value: 'PRIVATE', label: '💼 Private' },
] as const;

const DEMO_ACCOUNTS = [
  // DEVELOPER — hidden from UI, only accessible via secret credentials
  // Username: shacomputec | Password: shacomputecgh@kobina5251
  // GOVERNMENT accounts
  { label: 'National Admin', email: 'admin@demo.gh', scope: 'NATIONAL', sector: 'GOVERNMENT', role: 'National oversight', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { label: 'Regional Director', email: 'regional@demo.gh', scope: 'REGIONAL', sector: 'GOVERNMENT', role: 'Regional management', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { label: 'District Director', email: 'district@demo.gh', scope: 'DISTRICT', sector: 'GOVERNMENT', role: 'District oversight', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
  { label: 'Hospital Administrator', email: 'hospital@demo.gh', scope: 'FACILITY', sector: 'GOVERNMENT', role: 'Facility management', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  { label: 'Doctor', email: 'doctor@demo.gh', scope: 'FACILITY', sector: 'GOVERNMENT', role: 'Clinical care', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  { label: 'Nurse', email: 'nurse@demo.gh', scope: 'FACILITY', sector: 'GOVERNMENT', role: 'Patient care', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
  { label: 'Pharmacist', email: 'pharmacist@demo.gh', scope: 'FACILITY', sector: 'GOVERNMENT', role: 'Pharmacy operations', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  { label: 'Lab Scientist', email: 'lab@demo.gh', scope: 'FACILITY', sector: 'GOVERNMENT', role: 'Laboratory services', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
  { label: 'Cashier', email: 'cashier@demo.gh', scope: 'FACILITY', sector: 'GOVERNMENT', role: 'Billing & payments', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  // PRIVATE accounts — same roles as government
  { label: 'Clinic Administrator', email: 'private-admin@demo.gh', scope: 'FACILITY', sector: 'PRIVATE', role: 'Facility management', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
  { label: 'Doctor', email: 'private-doctor@demo.gh', scope: 'FACILITY', sector: 'PRIVATE', role: 'Clinical care', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
  { label: 'Nurse', email: 'private-nurse@demo.gh', scope: 'FACILITY', sector: 'PRIVATE', role: 'Patient care', color: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400' },
  { label: 'Pharmacist', email: 'private-pharmacist@demo.gh', scope: 'FACILITY', sector: 'PRIVATE', role: 'Pharmacy operations', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  { label: 'Lab Scientist', email: 'private-lab@demo.gh', scope: 'FACILITY', sector: 'PRIVATE', role: 'Laboratory services', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
  { label: 'Cashier', email: 'private-cashier@demo.gh', scope: 'FACILITY', sector: 'PRIVATE', role: 'Billing & payments', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  // PATIENT — available in both
  { label: 'Patient', email: 'patient@demo.gh', scope: 'PATIENT', sector: 'BOTH', role: 'Patient portal access', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' },
];

type Sector = 'GOVERNMENT' | 'PRIVATE';

const LEFT_FEATURES = [
  { icon: 'pulse' as const, title: 'Real-time clinical operations', sub: 'Queue, admissions, pharmacy, lab and billing in one flow' },
  { icon: 'shield' as const, title: 'Bank-grade security', sub: 'Device binding, audit trail and revocable sessions' },
  { icon: 'wifiOff' as const, title: 'Offline-first architecture', sub: 'Full functionality without internet — syncs when back online' },
  { icon: 'globe' as const, title: 'National coverage', sub: '16 regions · 261 districts · every facility type' },
];

export default function Login() {
  const { login, revocationNotice } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sector, setSector] = useState<Sector>((localStorage.getItem('gihm_sector') as Sector) ?? 'GOVERNMENT');

  const sectorAccounts = DEMO_ACCOUNTS.filter((a) => a.sector === sector || a.sector === 'BOTH');

  function chooseSector(s: Sector) {
    setSector(s);
    localStorage.setItem('gihm_sector', s);
    setEmail('');
    setPassword('');
    setError(null);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      // Secret developer credentials — not shown anywhere in the UI
      if (email === 'shacomputec' && password === 'shacomputecgh@kobina5251') {
        await login('developer@demo.gh', 'Demo@123');
        navigate('/app', { replace: true });
        return;
      }
      const loggedInUser = await login(email, password);
      navigate(loggedInUser.scope === 'PATIENT' ? '/patient' : '/app', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-g-paper dark:bg-g-dark-bg">
      {/* Left panel — animated branding */}
      <div className="relative hidden w-[46%] shrink-0 overflow-hidden bg-g-navy lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-14">
        {/* Animated gradient blobs */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-g-red/25 blur-3xl animate-[gihmFloat_9s_ease-in-out_infinite]" />
        <div className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-g-gold/15 blur-3xl animate-[gihmFloat_11s_ease-in-out_infinite_reverse]" />
        <div className="pointer-events-none absolute left-1/3 top-1/2 h-72 w-72 rounded-full bg-g-green/20 blur-3xl animate-[gihmFloat_13s_ease-in-out_infinite]" />
        {/* Subtle grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)', backgroundSize: '44px 44px' }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <img src="/shacomputec-logo.png" alt="ShaComputeC" className="h-14 w-14 rounded-2xl bg-white/95 object-contain p-1.5 shadow-2xl ring-1 ring-white/20" />
            <div>
              <p className="text-lg font-black tracking-tight text-white">GIHM-HIS</p>
              <p className="text-xs font-medium text-slate-300">by ShaComputeC</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <FlagStripe className="mb-8 h-1.5 w-24 rounded-full" />
          <h1 className="text-4xl font-black leading-[1.15] tracking-tight text-white">
            Ghana's Integrated<br />
            <span className="bg-gradient-to-r from-g-gold via-amber-200 to-g-gold bg-clip-text text-transparent">Health Platform</span>
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">
            One secure, offline-first system for government hospitals, private clinics,
            mission facilities and teaching hospitals — from CHPS compounds to Korle-Bu.
          </p>

          <ul className="mt-8 space-y-4">
            {LEFT_FEATURES.map((f) => (
              <li key={f.title} className="flex items-start gap-3.5">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-g-gold ring-1 ring-white/15">
                  <Icon name={f.icon} className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <p className="text-sm font-bold text-white">{f.title}</p>
                  <p className="text-xs text-slate-400">{f.sub}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 border-t border-white/10 pt-5">
          <p className="text-xs font-bold text-white">ShaComputeC</p>
          <p className="mt-0.5 text-[11px] italic text-g-gold">Hard Works Never Fail</p>
          <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1"><Icon name="mail" className="h-3 w-3" /> shacomputec@gmail.com</span>
            <span className="inline-flex items-center gap-1"><Icon name="phone" className="h-3 w-3" /> +233 530 941 750</span>
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="relative flex flex-1 flex-col">
        {/* Mobile-only branding header */}
        <div className="relative overflow-hidden bg-g-navy px-6 pb-10 pt-8 lg:hidden">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-g-red/25 blur-2xl" />
          <div className="relative z-10 text-center">
            <img src="/shacomputec-logo.png" alt="ShaComputeC" className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-white/95 object-contain p-1 shadow-xl" />
            <h1 className="text-xl font-black text-white">Sign in to GIHM-HIS</h1>
            <p className="mt-1 text-xs text-slate-300">Ghana Integrated Health Management · by ShaComputeC</p>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center px-5 py-8 sm:px-8">
          <div className="-mt-2 mb-6 rounded-2xl bg-white p-[2px] shadow-2xl shadow-g-navy/10 dark:shadow-black/40 lg:mt-0" style={{ background: 'linear-gradient(135deg, rgba(206,17,38,.55), rgba(252,209,22,.55), rgba(0,107,63,.55))' }}>
            <div className="rounded-[14px] bg-white p-6 sm:p-7 dark:bg-g-dark-surface">
              <div className="mb-5 hidden items-center justify-between lg:flex">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-g-ink dark:text-g-dark-text">Welcome back</h2>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-g-dark-muted">Sign in to your hospital information system</p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-g-red/10 text-g-red">
                  <Icon name="stethoscope" className="h-5 w-5" />
                </span>
              </div>

              {revocationNotice && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-g-red fade-in dark:border-red-900/50 dark:bg-red-950/40">
                  <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{revocationNotice}</span>
                </div>
              )}

              {/* Sector switch */}
              <div className="mb-5">
                <div className="grid grid-cols-2 gap-1 rounded-xl bg-g-mist p-1 dark:bg-g-dark-bg">
                  {SECTORS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => chooseSector(s.value)}
                      className={`cursor-pointer rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                        sector === s.value
                          ? 'bg-white text-g-navy shadow-md dark:bg-g-dark-border dark:text-white'
                          : 'text-slate-500 hover:text-g-ink dark:text-g-dark-muted dark:hover:text-g-dark-text'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-center text-[11px] leading-snug text-slate-400 dark:text-g-dark-muted">
                  {sector === 'GOVERNMENT'
                    ? 'Public hospitals, CHPS compounds and government health facilities.'
                    : 'Private hospitals, clinics, pharmacies and independent facilities.'}
                </p>
              </div>

              <form onSubmit={submit} className="space-y-3.5">
                {/* Floating-label email */}
                <div className="group relative">
                  <input
                    id="gihm-email"
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder=" "
                    autoComplete="email"
                    className="peer w-full rounded-xl border-2 border-slate-200 bg-white px-4 pb-2.5 pt-6 text-sm font-medium text-g-ink outline-none transition-all placeholder-shown:pt-6 focus:border-g-red focus:ring-4 focus:ring-g-red/10 dark:border-g-dark-border dark:bg-g-dark-bg dark:text-g-dark-text"
                  />
                  <label
                    htmlFor="gihm-email"
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 transition-all peer-focus:top-3.5 peer-focus:text-[10px] peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-g-red peer-[:not(:placeholder-shown)]:top-3.5 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:font-bold peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-wider"
                  >
                    Email address
                  </label>
                </div>

                {/* Floating-label password + visibility toggle */}
                <div className="group relative">
                  <input
                    id="gihm-pass"
                    type={showPass ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder=" "
                    autoComplete="current-password"
                    className="peer w-full rounded-xl border-2 border-slate-200 bg-white px-4 pb-2.5 pt-6 pr-12 text-sm font-medium text-g-ink outline-none transition-all focus:border-g-red focus:ring-4 focus:ring-g-red/10 dark:border-g-dark-border dark:bg-g-dark-bg dark:text-g-dark-text"
                  />
                  <label
                    htmlFor="gihm-pass"
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 transition-all peer-focus:top-3.5 peer-focus:text-[10px] peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-g-red peer-[:not(:placeholder-shown)]:top-3.5 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:font-bold peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-wider"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-g-ink dark:hover:bg-g-dark-border dark:hover:text-g-dark-text"
                  >
                    {showPass ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 8 10 8a9.74 9.74 0 0 0 5.39-1.61" /><path d="M2 2l20 20" /><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" /></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8Z" /><circle cx="12" cy="12" r="3" /></svg>
                    )}
                  </button>
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-g-red fade-in dark:border-red-900/50 dark:bg-red-950/40">
                    <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <Button type="submit" loading={busy} className="w-full" size="lg">
                  {busy ? 'Signing you in…' : 'Sign in to dashboard'}
                  {!busy && <Icon name="arrowRight" className="h-4 w-4" />}
                </Button>
              </form>

              {/* Demo accounts */}
              <div className="mt-6 border-t border-slate-100 pt-4 dark:border-g-dark-border">
                <p className="mb-2.5 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-g-dark-muted">
                  <Icon name="sparkles" className="h-3.5 w-3.5 text-g-gold" />
                  Demo accounts · {sector.toLowerCase()} · password Demo@123
                </p>
                <div className="grid max-h-56 grid-cols-1 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
                  {sectorAccounts.map((a) => (
                    <button
                      key={a.email}
                      type="button"
                      onClick={() => { setEmail(a.email); setPassword('Demo@123'); setError(null); }}
                      className="group flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs transition-all hover:-translate-y-0.5 hover:border-g-red/60 hover:shadow-md dark:border-g-dark-border dark:bg-g-dark-bg"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-bold text-g-ink dark:text-g-dark-text">{a.label}</p>
                        <p className="truncate text-[10px] text-slate-400 dark:text-g-dark-muted">{a.role}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[8.5px] font-black uppercase ${a.color}`}>{a.scope}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-2 text-center">
            <p className="text-xs text-slate-400">
              <Link to="/" className="font-bold text-g-red transition hover:underline">← Back to public portal</Link>
            </p>
            <p className="flex justify-center gap-4">
              <Link to="/purchase" className="text-xs font-bold text-blue-600 transition hover:underline">💳 Purchase a License</Link>
              <Link to="/activate" className="text-xs font-bold text-green-600 transition hover:underline">🔑 Activate License</Link>
            </p>
            <div className="pt-1"><DemoBanner compact /></div>
            <FlagStripe className="mx-auto mt-3 h-1 w-28 rounded-full opacity-40" />
          </div>
        </div>
      </div>
    </div>
  );
}
