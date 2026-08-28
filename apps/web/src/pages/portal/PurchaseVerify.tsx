import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { DEVELOPER_CREDENTIALS } from '../../lib/apiConfig';
import {
  createLicenseFromPayment,
  saveLicense,
  sendLicenseViaSms,
  sendLicenseViaWhatsApp,
  type LicenseRecord,
} from '../../lib/licenseGenerator';
import { createReceiptFromPayment, openReceiptInNewTab } from '../../lib/receiptGenerator';

export default function PurchaseVerify() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'sending' | 'success' | 'failed'>('verifying');
  const [license, setLicense] = useState<LicenseRecord | null>(null);
  const [smsSent, setSmsSent] = useState(false);
  const [waSent, setWaSent] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const reference = searchParams.get('reference') || searchParams.get('trxref');
    if (!reference) {
      setStatus('failed');
      return;
    }

    async function verify() {
      try {
        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
          headers: {
            'Authorization': `Bearer ${DEVELOPER_CREDENTIALS.paystack.secretKey}`,
          },
        });

        const data = await response.json();

        if (data.status && data.data?.status === 'success') {
          const meta = data.data.metadata || {};

          // Create license from payment data
          const newLicense = createLicenseFromPayment({
            planId: meta.plan || 'community',
            planName: meta.planName || 'Community',
            facilityName: meta.facilityName || 'My Facility',
            facilityType: meta.facilityType || 'hospital',
            contactName: meta.contactName || 'Customer',
            contactEmail: data.data.customer?.email || meta.contactEmail || '',
            contactPhone: meta.contactPhone || '',
            region: meta.region || '',
            district: meta.district || '',
            paystackRef: data.data.reference,
            amountPaid: data.data.amount / 100,
          });

          // Save license
          saveLicense(newLicense);
          setLicense(newLicense);

          // Send license key via SMS and WhatsApp
          setStatus('sending');

          if (newLicense.contactPhone) {
            const smsResult = await sendLicenseViaSms(
              newLicense.contactPhone,
              newLicense.key,
              newLicense.edition,
              newLicense.facilityName,
            );
            setSmsSent(smsResult);

            const waResult = await sendLicenseViaWhatsApp(
              newLicense.contactPhone,
              newLicense.key,
              newLicense.edition,
              newLicense.facilityName,
            );
            setWaSent(waResult);
          }

          setStatus('success');
        } else {
          setStatus('failed');
        }
      } catch {
        setStatus('failed');
      }
    }

    void verify();
  }, [searchParams]);

  function copyKey() {
    if (license) {
      navigator.clipboard.writeText(license.key).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
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
      </div>

      <div className="relative flex min-h-screen flex-col items-center justify-center p-6">
        {/* Verifying */}
        {status === 'verifying' && (
          <div className="w-full max-w-lg">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-12 text-center shadow-2xl backdrop-blur-xl">
              <div className="mx-auto mb-6 h-16 w-16">
                <svg className="h-16 w-16 animate-spin text-blue-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Verifying Payment...</h2>
              <p className="mt-2 text-blue-200">Please wait while we confirm your transaction</p>
            </div>
          </div>
        )}

        {/* Sending */}
        {status === 'sending' && (
          <div className="w-full max-w-lg">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-12 text-center shadow-2xl backdrop-blur-xl">
              <div className="mx-auto mb-6 h-16 w-16">
                <svg className="h-16 w-16 animate-spin text-green-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Generating Your License...</h2>
              <p className="mt-2 text-blue-200">Sending your key via SMS and WhatsApp</p>
            </div>
          </div>
        )}

        {/* Success */}
        {status === 'success' && license && (
          <div className="w-full max-w-lg">
            <div className="overflow-hidden rounded-3xl border border-green-400/30 bg-white/10 shadow-2xl backdrop-blur-xl">
              {/* Success header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-8 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
                  <svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-2xl font-extrabold text-white">Payment Successful! 🎉</h2>
                <p className="mt-1 text-green-100">Your license has been generated</p>
              </div>

              <div className="p-8">
                {/* License Key */}
                <div className="mb-6">
                  <p className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-blue-300/60">
                    Your License Key — Save This!
                  </p>
                  <div className="flex items-center gap-2 rounded-2xl border-2 border-green-400/30 bg-green-500/10 px-5 py-4">
                    <span className="flex-1 text-center font-mono text-xl font-bold tracking-wider text-white">
                      {license.key}
                    </span>
                    <button
                      onClick={copyKey}
                      className="shrink-0 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
                    >
                      {copied ? '✓ Copied' : '📋 Copy'}
                    </button>
                  </div>
                </div>

                {/* Edition badge */}
                <div className="mb-6 flex justify-center">
                  <span className={`rounded-full px-5 py-2 text-sm font-bold ${editionBadge[license.edition]?.bg} ${editionBadge[license.edition]?.text}`}>
                    {license.edition} Edition
                  </span>
                </div>

                {/* Delivery status */}
                <div className="mb-6 space-y-2">
                  <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
                    <span className="text-lg">💳</span>
                    <span className="flex-1 text-sm text-blue-200">Payment confirmed</span>
                    <span className="text-sm font-bold text-green-400">✓ Done</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
                    <span className="text-lg">🔑</span>
                    <span className="flex-1 text-sm text-blue-200">License key generated</span>
                    <span className="text-sm font-bold text-green-400">✓ Done</span>
                  </div>
                  {license.contactPhone && (
                    <>
                      <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
                        <span className="text-lg">📱</span>
                        <span className="flex-1 text-sm text-blue-200">SMS sent to {license.contactPhone}</span>
                        <span className={`text-sm font-bold ${smsSent ? 'text-green-400' : 'text-amber-400'}`}>
                          {smsSent ? '✓ Sent' : '⏳ Pending'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
                        <span className="text-lg">💬</span>
                        <span className="flex-1 text-sm text-blue-200">WhatsApp sent to {license.contactPhone}</span>
                        <span className={`text-sm font-bold ${waSent ? 'text-green-400' : 'text-amber-400'}`}>
                          {waSent ? '✓ Sent' : '⏳ Pending'}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Login credentials */}
                <div className="mb-6 rounded-2xl border border-blue-400/20 bg-blue-500/10 p-5">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-blue-200">
                    🔐 Your Login Credentials
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
                </div>

                {/* Activate button */}
                <Link
                  to={`/activate?key=${license.key}`}
                  className="block w-full rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 py-4 text-center text-lg font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/40"
                >
                  🚀 Activate Now →
                </Link>

                {/* Download Receipt */}
                <button
                  onClick={() => {
                    const receipt = createReceiptFromPayment({
                      planName: license.edition,
                      edition: license.edition,
                      amount: license.amountPaid,
                      facilityName: license.facilityName,
                      contactName: license.contactName,
                      contactEmail: license.contactEmail,
                      contactPhone: license.contactPhone,
                      transactionRef: license.paystackRef,
                    });
                    openReceiptInNewTab(receipt);
                  }}
                  className="mt-3 block w-full rounded-2xl border border-white/15 bg-white/5 py-3 text-center text-sm font-semibold text-blue-200 transition hover:bg-white/10"
                >
                  🧾 Download Receipt
                </button>

                <div className="mt-4 flex justify-center gap-4">
                  <Link to="/login" className="text-xs text-blue-300/50 hover:text-white">
                    Go to Login
                  </Link>
                  <span className="text-blue-300/30">·</span>
                  <Link to="/" className="text-xs text-blue-300/50 hover:text-white">
                    Back to Home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Failed */}
        {status === 'failed' && (
          <div className="w-full max-w-lg">
            <div className="overflow-hidden rounded-3xl border border-red-400/30 bg-white/10 shadow-2xl backdrop-blur-xl">
              <div className="bg-gradient-to-r from-red-500 to-rose-600 px-8 py-8 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
                  <svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-2xl font-extrabold text-white">Payment Verification Failed</h2>
              </div>
              <div className="p-8">
                <div className="mb-6 rounded-2xl bg-amber-500/10 p-4 text-center text-sm text-amber-200">
                  We could not verify your payment. Please try again or contact support.
                </div>
                <div className="flex flex-col gap-3">
                  <Link
                    to="/purchase"
                    className="block w-full rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 py-3 text-center font-bold text-white transition-all hover:shadow-xl"
                  >
                    💳 Try Again
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
