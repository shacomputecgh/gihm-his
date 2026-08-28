import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { Button, Card, DemoBanner, Field, FlagStripe, Icon, Input, Segmented } from '../../components/ui';

const SECTORS = [
  { value: 'GOVERNMENT', label: '🏛 Government Hospital' },
  { value: 'PRIVATE', label: '🏥 Private Hospital' },
];

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

export default function Login() {
  const { login, revocationNotice } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden w-1/2 bg-g-navy lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-12">
        <div className="max-w-md text-center">
          <img src="/shacomputec-logo.png" alt="ShaComputeC" className="mx-auto mb-6 h-24 w-24 rounded-2xl object-contain shadow-xl" />
          <h2 className="text-3xl font-bold text-white">GIHM-HIS</h2>
          <p className="mt-2 text-lg text-slate-300">Ghana Integrated Health Management</p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-g-gold">16</p>
              <p className="text-xs text-slate-400">Regions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-g-gold">261</p>
              <p className="text-xs text-slate-400">Districts</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-g-gold">24/7</p>
              <p className="text-xs text-slate-400">Offline-first</p>
            </div>
          </div>
          <p className="mt-8 text-sm text-slate-400 leading-relaxed">
            A secure, offline-first national digital-health architecture serving government,
            private, mission and teaching providers across Ghana.
          </p>
          <div className="mt-8 border-t border-white/10 pt-6">
            <p className="text-xs text-slate-500">Developed by</p>
            <p className="text-sm font-bold text-white">ShaComputeC</p>
            <p className="text-xs text-slate-400 mt-1">Hard Works Never Fail</p>
            <p className="text-xs text-slate-500 mt-2">📧 shacomputec@gmail.com</p>
            <p className="text-xs text-slate-500">📞 +233 530 941 750</p>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col dark:bg-g-dark-bg">
        <FlagStripe />

        <div className="mx-auto flex w-full max-w-md flex-col px-6 py-10 lg:flex-1 lg:justify-center lg:px-12">
          {/* Mobile logo */}
          <div className="mb-8 text-center lg:hidden">
            <img src="/shacomputec-logo.png" alt="ShaComputeC" className="mx-auto mb-3 h-14 w-14 rounded-2xl object-contain shadow-lg" />
            <h1 className="text-2xl font-bold text-g-ink dark:text-g-dark-text">Sign in to GIHM-HIS</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-g-dark-muted">Hospital information system · by ShaComputeC</p>
          </div>

          {/* Desktop heading */}
          <div className="mb-8 hidden lg:block">
            <h1 className="text-3xl font-bold text-g-ink">Welcome back</h1>
            <p className="mt-2 text-sm text-slate-500">Sign in to your hospital information system</p>
          </div>

          {revocationNotice && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-g-red fade-in">
              <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{revocationNotice}</span>
            </div>
          )}

          <Card className="p-6 scale-in">
            <div className="mb-5">
              <p className="mb-2 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">Hospital sector</p>
              <Segmented
                value={sector}
                onChange={(v) => chooseSector(v as Sector)}
                options={SECTORS.map((s) => ({ value: s.value, label: s.label }))}
              />
              <p className="mt-2 text-center text-xs text-slate-500">
                {sector === 'GOVERNMENT'
                  ? 'Public hospitals, CHPS compounds, and government health facilities across Ghana.'
                  : 'Private hospitals, clinics, pharmacies, and independent health facilities.'}
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <Field label="Email">
                <Input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@facility.example.gh"
                  autoComplete="email"
                />
              </Field>
              <Field label="Password">
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </Field>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-g-red fade-in">
                  <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <Button type="submit" loading={busy} className="w-full" size="lg">
                Sign in
              </Button>
            </form>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Demo accounts · {sector.toLowerCase()} (password: Demo@123)
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {sectorAccounts.map((a) => (
                  <button
                    key={a.email}
                    onClick={() => { setEmail(a.email); setPassword('Demo@123'); setError(null); }}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 px-3.5 py-2.5 text-left text-xs transition-all hover:border-g-red hover:bg-g-red/5 hover:shadow-sm"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-g-ink">{a.label}</span>
                      <span className="text-[10px] text-slate-400">{a.role}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${a.color}`}>{a.scope}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <p className="mt-6 text-center text-xs text-slate-400">
            <Link to="/" className="font-semibold text-g-red transition hover:underline">← Back to public portal</Link>
          </p>
          <p className="mt-2 flex justify-center gap-4 text-center">
            <Link to="/purchase" className="text-xs font-bold text-blue-600 transition hover:underline">💳 Purchase a License</Link>
            <Link to="/activate" className="text-xs font-bold text-green-600 transition hover:underline">🔑 Activate License</Link>
          </p>
          <div className="mt-4"><DemoBanner /></div>
          <FlagStripe className="mt-6 rounded-full opacity-30" />
        </div>
      </div>
    </div>
  );
}
