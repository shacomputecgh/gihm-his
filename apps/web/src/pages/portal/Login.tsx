import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { Button, Card, DemoBanner, Field, FlagStripe, Icon, Input } from '../../components/ui';

const DEMO_ACCOUNTS = [
  { label: 'Staff (Korle-Bu)', email: 'hospital@demo.gh', scope: 'FACILITY' },
  { label: 'Doctor', email: 'doctor@demo.gh', scope: 'FACILITY' },
  { label: 'Regional Director', email: 'regional@demo.gh', scope: 'REGIONAL' },
  { label: 'National Admin', email: 'admin@demo.gh', scope: 'NATIONAL' },
  { label: 'Patient', email: 'patient@demo.gh', scope: 'PATIENT' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const user = await login(email, password);
      navigate(user.scope === 'PATIENT' ? '/patient' : '/app', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-14">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-g-navy text-white shadow-lg">
          <Icon name="pulse" className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-g-ink">Sign in to GIHM-HIS</h1>
        <p className="mt-1 text-sm text-slate-500">Hospital information system · patient portal</p>
      </div>

      <Card className="p-6">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email">
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@facility.example.gh" autoComplete="email" />
          </Field>
          <Field label="Password">
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
          </Field>
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-g-red/20 bg-g-red/5 px-3 py-2.5 text-sm text-g-red">
              <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          <Button type="submit" loading={busy} className="w-full" size="lg">
            Sign in
          </Button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-5">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Demo accounts (password: Demo@123)</p>
          <div className="grid grid-cols-1 gap-1.5">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                onClick={() => { setEmail(a.email); setPassword('Demo@123'); }}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left text-xs transition hover:border-g-red hover:bg-g-red/5"
              >
                <span className="font-semibold text-g-ink">{a.label}</span>
                <span className="text-slate-400">{a.email}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      <p className="mt-6 text-center text-xs text-slate-400">
        <Link to="/" className="font-semibold text-g-red hover:underline">← Back to public portal</Link>
      </p>
      <div className="mt-4"><DemoBanner /></div>
      <FlagStripe className="mt-6 rounded-full opacity-30" />
    </div>
  );
}
