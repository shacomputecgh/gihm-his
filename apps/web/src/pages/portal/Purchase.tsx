import { useState } from 'react';
import { DEVELOPER_CREDENTIALS } from '../../lib/apiConfig';

const PLANS = [
  {
    id: 'community',
    name: 'Community',
    tagline: 'For small clinics and health posts',
    price: 2500,
    currency: 'GHS',
    period: 'year',
    features: [
      '1 Facility',
      '10 Staff Users',
      'Core modules: Patients, Queue, Pharmacy, Lab, Billing',
      'Basic reporting',
      'Email support',
      'Community updates',
    ],
    color: 'from-emerald-500 to-teal-600',
    badge: 'Most Affordable',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
  {
    id: 'professional',
    name: 'Professional',
    tagline: 'For district hospitals and polyclinics',
    price: 7500,
    currency: 'GHS',
    period: 'year',
    features: [
      '5 Facilities',
      '50 Staff Users',
      'All Core modules + Surveillance + Referrals + Telemedicine',
      'Advanced reporting & DHIMS2 integration',
      'NHIS claims management',
      'SMS & WhatsApp notifications',
      'Priority email & phone support',
      'Quarterly updates',
    ],
    color: 'from-blue-500 to-indigo-600',
    badge: 'Most Popular',
    badgeColor: 'bg-blue-100 text-blue-700',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'For regional and teaching hospitals',
    price: 15000,
    currency: 'GHS',
    period: 'year',
    features: [
      'Unlimited Facilities',
      'Unlimited Staff Users',
      'All modules including ID Cards, Asset Tracking, Blood Bank',
      'All national integrations (DHIMS2, SORMAS, NHIS, HRIMS, LHIMS)',
      'Multi-level admin hierarchy',
      'Developer Console & System Administration',
      'Custom branding & logo',
      'Dedicated support & SLA',
      'Monthly updates & on-site training',
    ],
    color: 'from-purple-500 to-violet-600',
    badge: 'Full Access',
    badgeColor: 'bg-purple-100 text-purple-700',
  },
];

function formatCurrency(amount: number): string {
  return `GH₵ ${amount.toLocaleString()}`;
}

export default function Purchase() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    facilityName: '',
    facilityType: 'hospital',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    region: '',
    district: '',
  });
  const [step, setStep] = useState<'select' | 'details' | 'payment' | 'processing' | 'success'>('select');
  const [processing, setProcessing] = useState(false);

  const selectedPlanData = PLANS.find((p) => p.id === selectedPlan);

  function handleSelectPlan(planId: string) {
    setSelectedPlan(planId);
    setStep('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleDetailsSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.facilityName || !formData.contactName || !formData.contactEmail || !formData.contactPhone) {
      return;
    }
    setStep('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handlePayment() {
    if (!selectedPlanData) return;
    setProcessing(true);
    setStep('processing');

    try {
      // Initialize Paystack payment
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DEVELOPER_CREDENTIALS.paystack.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.contactEmail,
          amount: selectedPlanData.price * 100, // Paystack uses kobo/pesewas
          currency: 'GHS',
          metadata: {
            plan: selectedPlanData.id,
            planName: selectedPlanData.name,
            facilityName: formData.facilityName,
            facilityType: formData.facilityType,
            contactName: formData.contactName,
            contactPhone: formData.contactPhone,
            region: formData.region,
            district: formData.district,
            custom_fields: [
              {
                display_name: 'Facility Name',
                variable_name: 'facility_name',
                value: formData.facilityName,
              },
              {
                display_name: 'Contact Phone',
                variable_name: 'contact_phone',
                value: formData.contactPhone,
              },
            ],
          },
          callback_url: `${window.location.origin}/purchase/verify`,
        }),
      });

      const data = await response.json();

      if (data.status && data.data?.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = data.data.authorization_url;
      } else {
        // Payment initialization failed
        setStep('payment');
        setProcessing(false);
        alert('Payment initialization failed. Please try again or contact support.');
      }
    } catch (error) {
      setStep('payment');
      setProcessing(false);
      alert('Network error. Please check your connection and try again.');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 px-6 py-16 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ij48cGF0aCBkPSJNMzYgMzRhMiAyIDAgMSAxLTQgMCAyIDIgMCAwIDEgNCAwIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-6 flex items-center justify-center gap-4">
            <img src="/shacomputec-logo.png" alt="ShaComputeC" className="h-16 w-16 rounded-xl shadow-lg" />
            <div className="text-left">
              <h2 className="text-lg font-bold text-blue-100">GIHM-HIS</h2>
              <p className="text-sm text-blue-200">Ghana Integrated Health Management System</p>
            </div>
          </div>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-5xl">
            Purchase a License
          </h1>
          <p className="mx-auto mb-6 max-w-2xl text-lg text-blue-100">
            The complete hospital management system for Ghana — desktop, web, and mobile.
            Each license is per facility/hospital. Each region or district needs its own license.
          </p>
          <div className="mx-auto mb-4 max-w-2xl rounded-lg bg-yellow-500/20 border border-yellow-400/30 px-4 py-2 text-sm text-yellow-100">
            ⚠️ <strong>One license per hospital/facility.</strong> Each region or district administration requires a separate license. Contact us for multi-facility bulk pricing.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-blue-200">
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              No setup fees
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Free updates included
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Secure Paystack payment
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Ghana Cedis (GHS)
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Step Indicator */}
        <div className="mb-10 flex items-center justify-center gap-2">
          {(['select', 'details', 'payment'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                step === s ? 'bg-blue-600 text-white' :
                (step === 'details' && s === 'select') || (step === 'payment' && (s === 'select' || s === 'details')) || step === 'processing' || step === 'success' ? 'bg-green-500 text-white' :
                'bg-slate-200 text-slate-500'
              }`}>
                {i + 1}
              </div>
              <span className={`hidden text-sm font-medium md:inline ${
                step === s ? 'text-blue-600' : 'text-slate-400'
              }`}>
                {s === 'select' ? 'Choose Plan' : s === 'details' ? 'Your Details' : 'Payment'}
              </span>
              {i < 2 && <div className="mx-2 h-0.5 w-8 bg-slate-200" />}
            </div>
          ))}
        </div>

        {/* Step 1: Select Plan */}
        {step === 'select' && (
          <div className="grid gap-8 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative overflow-hidden rounded-2xl border-2 bg-white shadow-lg transition-all hover:shadow-xl ${
                  plan.popular ? 'border-blue-500' : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                {plan.popular && (
                  <div className="absolute right-4 top-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${plan.badgeColor}`}>
                      {plan.badge}
                    </span>
                  </div>
                )}
                {!plan.popular && (
                  <div className="absolute right-4 top-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${plan.badgeColor}`}>
                      {plan.badge}
                    </span>
                  </div>
                )}
                <div className={`bg-gradient-to-r ${plan.color} px-6 py-8 text-white`}>
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                  <p className="mt-1 text-sm opacity-90">{plan.tagline}</p>
                  <div className="mt-4">
                    <span className="text-4xl font-extrabold">{formatCurrency(plan.price)}</span>
                    <span className="text-sm opacity-75"> / {plan.period}</span>
                  </div>
                </div>
                <div className="px-6 py-6">
                  <ul className="mb-6 space-y-3">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full rounded-xl bg-gradient-to-r ${plan.color} py-3 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110`}
                  >
                    Select {plan.name}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 2: Facility Details */}
        {step === 'details' && selectedPlanData && (
          <div className="mx-auto max-w-2xl">
            <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm text-blue-700">
                You selected: <strong>{selectedPlanData.name}</strong> — {formatCurrency(selectedPlanData.price)}/{selectedPlanData.period}
              </p>
              <button onClick={() => { setStep('select'); setSelectedPlan(null); }} className="mt-1 text-xs font-semibold text-blue-500 hover:underline">
                ← Change plan
              </button>
            </div>

            <form onSubmit={handleDetailsSubmit} className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
              <h3 className="mb-6 text-xl font-bold text-slate-800">Facility & Contact Details</h3>

              <div className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Facility Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.facilityName}
                    onChange={(e) => setFormData({ ...formData, facilityName: e.target.value })}
                    placeholder="e.g. Korle-Bu Teaching Hospital"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Facility Type</label>
                  <select
                    value={formData.facilityType}
                    onChange={(e) => setFormData({ ...formData, facilityType: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="teaching_hospital">Teaching Hospital</option>
                    <option value="hospital">Hospital</option>
                    <option value="polyclinic">Polyclinic</option>
                    <option value="health_centre">Health Centre</option>
                    <option value="chps">CHPS Compound</option>
                    <option value="clinic">Private Clinic</option>
                    <option value="pharmacy">Pharmacy</option>
                    <option value="laboratory">Laboratory</option>
                  </select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Region</label>
                    <select
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="">Select region</option>
                      <option value="Greater Accra">Greater Accra</option>
                      <option value="Ashanti">Ashanti</option>
                      <option value="Western">Western</option>
                      <option value="Central">Central</option>
                      <option value="Eastern">Eastern</option>
                      <option value="Northern">Northern</option>
                      <option value="Volta">Volta</option>
                      <option value="Upper East">Upper East</option>
                      <option value="Upper West">Upper West</option>
                      <option value="Brong-Ahafo">Brong-Ahafo</option>
                      <option value="Western North">Western North</option>
                      <option value="Ahafo">Ahafo</option>
                      <option value="Bono East">Bono East</option>
                      <option value="Oti">Oti</option>
                      <option value="Savannah">Savannah</option>
                      <option value="North East">North East</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">District</label>
                    <input
                      type="text"
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      placeholder="e.g. Accra Metropolitan"
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-5">
                  <h4 className="mb-4 text-sm font-bold text-slate-700">Contact Person</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.contactName}
                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                        placeholder="e.g. Dr. John Mensah"
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email Address *</label>
                        <input
                          type="email"
                          required
                          value={formData.contactEmail}
                          onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                          placeholder="you@facility.gov.gh"
                          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Phone Number *</label>
                        <input
                          type="tel"
                          required
                          value={formData.contactPhone}
                          onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                          placeholder="+233 24 000 0000"
                          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setStep('select'); setSelectedPlan(null); }}
                  className="rounded-xl border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className={`rounded-xl bg-gradient-to-r ${selectedPlanData.color} px-8 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg`}
                >
                  Continue to Payment →
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Payment Confirmation */}
        {step === 'payment' && selectedPlanData && (
          <div className="mx-auto max-w-2xl">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
              <div className={`bg-gradient-to-r ${selectedPlanData.color} px-8 py-6 text-white`}>
                <h3 className="text-2xl font-bold">Order Summary</h3>
              </div>
              <div className="p-8">
                <div className="mb-6 space-y-3">
                  <div className="flex justify-between border-b border-slate-100 pb-3">
                    <span className="text-sm text-slate-500">Plan</span>
                    <span className="font-semibold text-slate-800">{selectedPlanData.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-3">
                    <span className="text-sm text-slate-500">Facility</span>
                    <span className="font-semibold text-slate-800">{formData.facilityName}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-3">
                    <span className="text-sm text-slate-500">Contact</span>
                    <span className="font-semibold text-slate-800">{formData.contactName}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-3">
                    <span className="text-sm text-slate-500">Email</span>
                    <span className="font-semibold text-slate-800">{formData.contactEmail}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-3">
                    <span className="text-sm text-slate-500">Phone</span>
                    <span className="font-semibold text-slate-800">{formData.contactPhone}</span>
                  </div>
                  {formData.region && (
                    <div className="flex justify-between border-b border-slate-100 pb-3">
                      <span className="text-sm text-slate-500">Location</span>
                      <span className="font-semibold text-slate-800">{formData.district ? `${formData.district}, ` : ''}{formData.region}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2">
                    <span className="text-lg font-bold text-slate-800">Total</span>
                    <span className="text-2xl font-extrabold text-slate-900">{formatCurrency(selectedPlanData.price)}</span>
                  </div>
                </div>

                <div className="mb-6 rounded-lg bg-green-50 p-4">
                  <p className="flex items-center gap-2 text-sm text-green-700">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Payment is secured by <strong>Paystack</strong>. You will be redirected to complete payment safely.
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setStep('details')}
                    className="rounded-xl border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => void handlePayment()}
                    disabled={processing}
                    className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-3 text-sm font-bold text-white shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    💳 Pay {formatCurrency(selectedPlanData.price)} with Paystack
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Processing */}
        {step === 'processing' && (
          <div className="mx-auto max-w-md text-center">
            <div className="rounded-2xl border border-slate-200 bg-white p-12 shadow-lg">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
              <h3 className="mb-2 text-xl font-bold text-slate-800">Processing Payment...</h3>
              <p className="text-sm text-slate-500">
                Redirecting you to Paystack secure payment page.
                Please do not close this window.
              </p>
            </div>
          </div>
        )}

        {/* Success Message (shown if redirected back after payment) */}
        {step === 'success' && (
          <div className="mx-auto max-w-md text-center">
            <div className="rounded-2xl border border-green-200 bg-white p-12 shadow-lg">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg className="h-8 w-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-800">Payment Successful!</h3>
              <p className="mb-6 text-sm text-slate-500">
                Your license has been activated. You will receive login credentials via email and SMS shortly.
              </p>
              <a
                href="/login"
                className="inline-block rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white shadow-lg hover:bg-blue-700"
              >
                Go to Login →
              </a>
            </div>
          </div>
        )}

        {/* Developer Contact */}
        <div className="mt-16 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center gap-6 md:flex-row">
            <img src="/shacomputec-logo.png" alt="ShaComputeC" className="h-20 w-20 rounded-xl" />
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg font-bold text-slate-800">Developed by ShaComputeC</h3>
              <p className="mt-1 text-sm text-slate-500">Hard Works Never Fail</p>
              <div className="mt-3 flex flex-wrap justify-center gap-4 text-sm text-slate-600 md:justify-start">
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  shacomputec@gmail.com
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  0266692501
                </span>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-xs text-slate-400">Secured by</p>
              <p className="font-bold text-slate-700">Paystack</p>
              <p className="text-xs text-slate-400">PCI-DSS Level 1</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
