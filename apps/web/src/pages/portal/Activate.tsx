import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { activateLicense, type LicenseRecord } from '../../lib/licenseGenerator';

export default function Activate() {
  const [searchParams] = useSearchParams();
  const [key, setKey] = useState('');
  const [step, setStep] = useState<'enter' | 'activating' | 'success' | 'error'>('enter');
  const [license, setLicense] = useState<LicenseRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  // Pre-fill key from URL params
  useEffect(() => {
    const urlKey = searchParams.get('key');
    if (urlKey) {
      setKey(urlKey.toUpperCase());
    }
  }, [searchParams]);

  function formatKey(input: string): string {
    // Auto-format as GIHM-XXXX-XXXX-XXXX-XXXX
    const cleaned = input.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const parts: string[] = [];
    for (let i = 0; i < cleaned.length && i < 20; i += 4) {
      parts.push(cleaned.slice(i, i + 4));
    }
    return parts.join('-');
  }

  function handleKeyChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatKey(e.target.value);
    setKey(formatted);
  }

  async function handleActivate() {
    if (!key || key.length < 10) {
      setErrorMsg('Please enter a valid license key (GIHM-XXXX-XXXX-XXXX-XXXX)');
      setStep('error');
      return;
    }

    setStep('activating');
    setErrorMsg('');

    // Simulate brief processing
    await new Promise((r) => setTimeout(r, 1500));

    const result = activateLicense(key);

    if (result.success && result.license) {
      setLicense(result.license);
      setStep('success');
    } else {
      setErrorMsg(result.error || 'Activation failed');
      setStep('error');
    }
  }

  function copyKey() {
    if (license) {
      navigator.clipboard.writeText(license.key).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  function handleTryAgain() {
    setStep('enter');
    setErrorMsg('');
  }

  const editionBadge: Record<string, { bg: string; text: string }> = {
    COMMUNITY: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
    PROFESSIONAL: { bg: 'bg-blue-100', text: 'text-blue-700' },
    ENTERPRISE: { bg: 'bg-purple-100', text: 'text-purple-700' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-60 w-60 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen flex-col items-center justify-center p-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <img
            src="/shacomputec-logo.png"
            alt="ShaComputeC"
            className="mx-auto mb-4 h-16 w-16 rounded-2xl shadow-2xl"
          />
          <h1 className="text-3xl font-extrabold text-white md:text-4xl">
            Activate Your License
          </h1>
          <p className="mt-2 text-blue-200">
            Enter your license key to activate GIHM-HIS
          </p>
        </div>

        {/* Enter Key */}
        {step === 'enter' && (
          <div className="w-full max-w-lg">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
              <div className="mb-6">
                <label className="mb-2 block text-sm font-semibold text-blue-100">
                  License Key
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={key}
                    onChange={handleKeyChange}
                    placeholder="GIHM-XXXX-XXXX-XXXX-XXXX"
                    maxLength={25}
                    className="w-full rounded-2xl border-2 border-white/20 bg-white/10 px-5 py-4 text-center font-mono text-xl font-bold tracking-widest text-white placeholder:text-white/30 focus:border-blue-400 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                    autoFocus
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {key.length > 5 && (
                      <button
                        onClick={() => { setKey(''); setStep('enter'); }}
                        className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-center text-xs text-blue-300/60">
                  Format: GIHM-XXXX-XXXX-XXXX-XXXX (20 characters)
                </p>
              </div>

              <button
                onClick={() => void handleActivate()}
                disabled={!key || key.length < 10}
                className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 py-4 text-lg font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:from-blue-400 hover:to-indigo-500 hover:shadow-xl hover:shadow-blue-500/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              >
                🚀 Activate License
              </button>
            </div>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm text-blue-300/60 hover:text-white">
                ← Back to Login
              </Link>
            </div>
          </div>
        )}

        {/* Activating */}
        {step === 'activating' && (
          <div className="w-full max-w-lg">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-12 text-center shadow-2xl backdrop-blur-xl">
              <div className="mx-auto mb-6 h-16 w-16">
                <svg className="h-16 w-16 animate-spin text-blue-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Activating Your License...</h2>
              <p className="mt-2 text-blue-200">Please wait while we verify your key</p>
            </div>
          </div>
        )}

        {/* Success */}
        {step === 'success' && license && (
          <div className="w-full max-w-lg">
            <div className="overflow-hidden rounded-3xl border border-green-400/30 bg-white/10 shadow-2xl backdrop-blur-xl">
              {/* Success header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-8 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
                  <svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-2xl font-extrabold text-white">License Activated! 🎉</h2>
                <p className="mt-1 text-green-100">Your system is now ready to use</p>
              </div>

              {/* License details */}
              <div className="p-8">
                {/* License Key */}
                <div className="mb-6">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-blue-300/60">
                    Your License Key
                  </p>
                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                    <span className="flex-1 text-center font-mono text-lg font-bold tracking-wider text-white">
                      {license.key}
                    </span>
                    <button
                      onClick={copyKey}
                      className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
                    >
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Edition badge */}
                <div className="mb-6 flex justify-center">
                  <span className={`rounded-full px-5 py-2 text-sm font-bold ${editionBadge[license.edition]?.bg} ${editionBadge[license.edition]?.text}`}>
                    {license.edition} Edition
                  </span>
                </div>

                {/* Details grid */}
                <div className="mb-6 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/5 p-3 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-300/50">Facility</p>
                    <p className="mt-1 text-sm font-semibold text-white">{license.facilityName}</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-300/50">Status</p>
                    <p className="mt-1 text-sm font-bold text-green-400">✓ ACTIVE</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-300/50">Max Facilities</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {license.maxFacilities > 1000 ? '∞' : license.maxFacilities}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-300/50">Max Users</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {license.maxUsers > 1000 ? '∞' : license.maxUsers}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-300/50">Activated</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {license.activatedAt ? new Date(license.activatedAt).toLocaleDateString() : 'Now'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-300/50">Expires</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {new Date(license.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Login credentials */}
                <div className="mb-6 rounded-2xl border border-blue-400/30 bg-blue-500/10 p-5">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-blue-200">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Your Login Credentials
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-300/60">Email</span>
                      <span className="font-mono text-white">{license.contactEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-300/60">Password</span>
                      <span className="font-mono text-white">GIHM-{license.key.slice(-4)}</span>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-blue-300/50">
                    You can change your password after first login
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-3">
                  <Link
                    to="/login"
                    className="block w-full rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 py-4 text-center text-lg font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/40"
                  >
                    🔐 Go to Login →
                  </Link>
                  <Link
                    to="/"
                    className="block w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-center text-sm font-semibold text-blue-200 transition hover:bg-white/10"
                  >
                    ← Back to Home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {step === 'error' && (
          <div className="w-full max-w-lg">
            <div className="overflow-hidden rounded-3xl border border-red-400/30 bg-white/10 shadow-2xl backdrop-blur-xl">
              <div className="bg-gradient-to-r from-red-500 to-rose-600 px-8 py-8 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
                  <svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-2xl font-extrabold text-white">Activation Failed</h2>
              </div>
              <div className="p-8">
                <div className="mb-6 rounded-2xl bg-red-500/10 p-4 text-center">
                  <p className="text-sm font-semibold text-red-200">{errorMsg}</p>
                </div>
                <div className="mb-6 rounded-2xl bg-white/5 p-4">
                  <p className="text-xs font-semibold text-blue-200/60">Troubleshooting:</p>
                  <ul className="mt-2 space-y-1 text-xs text-blue-300/50">
                    <li>• Make sure the key format is GIHM-XXXX-XXXX-XXXX-XXXX</li>
                    <li>• Check for typos — keys are case-insensitive</li>
                    <li>• Contact support if you need a new key</li>
                  </ul>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleTryAgain}
                    className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 py-4 text-lg font-bold text-white shadow-lg transition-all hover:shadow-xl"
                  >
                    Try Again
                  </button>
                  <Link
                    to="/purchase"
                    className="block w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-center text-sm font-semibold text-blue-200 transition hover:bg-white/10"
                  >
                    💳 Purchase a New License
                  </Link>
                  <a
                    href="mailto:shacomputec@gmail.com"
                    className="block w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-center text-sm font-semibold text-blue-200 transition hover:bg-white/10"
                  >
                    📧 Contact Support
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-blue-300/30">
            Developed by <strong>ShaComputeC</strong> · Hard Works Never Fail
          </p>
        </div>
      </div>
    </div>
  );
}
