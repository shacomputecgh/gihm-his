import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import type { Region } from '../../types';
import { Icon, Badge, DemoBanner, type IconName } from '../../components/ui';

const QUICK_FIND: { label: string; type: string; icon: IconName }[] = [
  { label: 'Hospitals', type: 'DISTRICT_HOSPITAL', icon: 'building' },
  { label: 'Teaching Hospitals', type: 'TEACHING_HOSPITAL', icon: 'stethoscope' },
  { label: 'Clinics & Health Centres', type: 'HEALTH_CENTRE', icon: 'activity' },
  { label: 'CHPS Compounds', type: 'CHPS_COMPOUND', icon: 'home' },
  { label: 'Pharmacies', type: 'PHARMACY', icon: 'pill' },
  { label: 'Laboratories', type: 'LABORATORY', icon: 'flask' },
];

export default function Home() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [facilityCount, setFacilityCount] = useState<number | null>(null);
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    void api<{ regions: Region[] }>('/geography/regions', { public: true }).then((r) => setRegions(r.regions)).catch(() => undefined);
    void api<{ items: unknown[]; total: number }>('/facilities?pageSize=1', { public: true }).then((r) => setFacilityCount(r.total)).catch(() => undefined);
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-g-navy text-white">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, #fcd116 0, transparent 45%), radial-gradient(circle at 80% 70%, #ce1126 0, transparent 40%)' }} />
        <div className="relative mx-auto max-w-7xl px-4 py-20 md:py-28">
          <DemoBanner compact />
          <div className="mt-4 flex items-center gap-3">
            <img src="/shacomputec-logo.png" alt="ShaComputeC" className="h-12 w-12 rounded-xl object-contain" />
            <div>
              <p className="text-xs text-slate-400">Developed by</p>
              <p className="text-sm font-bold text-white">ShaComputeC</p>
            </div>
          </div>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-g-gold">
            <Icon name="globe" className="h-3.5 w-3.5" />
            One national health platform · 16 regions · 261 districts
          </div>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-tight md:text-5xl">
            Find healthcare anywhere in <span className="text-g-gold">Ghana</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-300">
            Search the national facility directory, book appointments, and access your authorized health information —
            online or offline, from a hospital workstation, a CHPS compound, or your phone.
          </p>

          <form
            onSubmit={(e) => { e.preventDefault(); navigate(`/find-healthcare?q=${encodeURIComponent(q)}`); }}
            className="mt-8 flex max-w-2xl items-center gap-2 rounded-2xl bg-white p-2 shadow-2xl"
          >
            <Icon name="search" className="ml-3 h-5 w-5 shrink-0 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search hospitals, clinics, CHPS, pharmacies…"
              className="h-11 w-full bg-transparent text-g-ink placeholder:text-slate-400 focus:outline-none"
            />
            <button type="submit" className="h-11 shrink-0 rounded-xl bg-g-red px-5 text-sm font-bold text-white transition hover:bg-g-red-dark cursor-pointer">
              Search
            </button>
          </form>

          <div className="mt-8 flex flex-wrap gap-6 text-sm">
            <div><span className="text-2xl font-bold text-g-gold">16</span> <span className="text-slate-400">regions</span></div>
            <div><span className="text-2xl font-bold text-g-gold">261</span> <span className="text-slate-400">districts</span></div>
            <div><span className="text-2xl font-bold text-g-gold">{facilityCount ?? '—'}</span> <span className="text-slate-400">registered facilities</span></div>
            <div><span className="text-2xl font-bold text-g-gold">24/7</span> <span className="text-slate-400">offline-first design</span></div>
          </div>
        </div>
      </section>

      {/* Quick find */}
      <section className="mx-auto max-w-7xl px-4 py-14 dark:bg-g-dark-bg">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-g-ink dark:text-g-dark-text">What are you looking for?</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-g-dark-muted">Browse the national facility registry by type.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {QUICK_FIND.map((f) => (
            <Link key={f.label} to={`/find-healthcare?type=${f.type}`} className="card-hover group rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm dark:border-g-dark-border dark:bg-g-dark-surface">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-g-red/10 text-g-red transition group-hover:bg-g-red group-hover:text-white">
                <Icon name={f.icon} className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-g-ink dark:text-g-dark-text">{f.label}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Regions */}
      <section className="bg-g-mist/60 py-14 dark:bg-g-dark-surface/50">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-2xl font-bold text-g-ink dark:text-g-dark-text">Find care by region</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-g-dark-muted">All 16 administrative regions with their districts and facilities.</p>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {regions.map((r) => (
              <Link key={r.id} to={`/find-healthcare?regionId=${r.id}`} className="card-hover flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm dark:border-g-dark-border dark:bg-g-dark-surface">
                <div>
                  <p className="text-sm font-bold text-g-ink">{r.name}</p>
                  <p className="text-xs text-slate-400">{r.capital} · {r._count?.facilities ?? 0} facilities</p>
                </div>
                <Icon name="arrowRight" className="h-4 w-4 text-g-red" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-14 dark:bg-g-dark-bg">
        <h2 className="text-center text-2xl font-bold text-g-ink dark:text-g-dark-text">One platform, built for Ghana</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-slate-500 dark:text-g-dark-muted">
          A secure, offline-first national digital-health architecture serving government, private, mission and teaching providers —
          while respecting organizational boundaries and patient privacy.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { icon: 'wifiOff' as IconName, title: 'Offline-first', text: 'Clinical work continues through internet outages with automatic, conflict-safe synchronization.' },
            { icon: 'shield' as IconName, title: 'Privacy & RBAC', text: 'Granular roles, facility boundaries and full audit trails. Healthcare employment never grants blanket access.' },
            { icon: 'building' as IconName, title: 'Facility registry', text: 'One authoritative national facility registry with the GSS administrative hierarchy.' },
            { icon: 'pulse' as IconName, title: 'Hospital information system', text: 'OPD, emergency, inpatient, pharmacy, laboratory, imaging, theatre, maternity and more.' },
            { icon: 'users' as IconName, title: 'Master Patient Index', text: 'Duplicate detection with confidence scores — never silently merge medical records.' },
            { icon: 'globe' as IconName, title: 'Interoperability-ready', text: 'Designed to coexist with DHIMS II, LHIMS, SORMAS, GhiLMIS and other national systems.' },
          ].map((f) => (
            <div key={f.title} className="card-hover rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-g-dark-border dark:bg-g-dark-surface">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-g-navy/5 text-g-navy"><Icon name={f.icon} className="h-5 w-5" /></div>
              <h3 className="font-bold text-g-ink dark:text-g-dark-text">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-g-dark-muted">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ADDED: Explore GIHM-HIS — Hospital Management System
          ═══════════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-14 dark:bg-g-dark-bg">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-g-navy to-g-navy-2 p-1 shadow-xl">
          <div className="rounded-xl bg-white p-8 dark:bg-g-dark-surface md:p-10">
            <div className="flex flex-col items-center gap-6 md:flex-row">
              <div className="flex-shrink-0">
                <img src="/shacomputec-logo.png" alt="GIHM-HIS" className="h-20 w-20 rounded-xl object-contain" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 rounded-full bg-g-green/10 px-3 py-1 text-xs font-bold text-g-green mb-3">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-g-green" />
                  FREE 30-DAY TRIAL
                </div>
                <h2 className="text-2xl font-extrabold text-g-ink dark:text-g-dark-text">Explore GIHM-HIS</h2>
                <p className="mt-2 text-slate-500 dark:text-g-dark-muted">
                  Ghana's complete hospital management system with 300+ modules — pharmacy, laboratory, billing, theatre, maternity, emergency, ID cards, AI assistant, and more. Try it free for 30 days.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><span className="text-g-green">✓</span> 300+ modules</span>
                  <span className="flex items-center gap-1"><span className="text-g-green">✓</span> Multi-language</span>
                  <span className="flex items-center gap-1"><span className="text-g-green">✓</span> PDF export</span>
                  <span className="flex items-center gap-1"><span className="text-g-green">✓</span> WhatsApp & SMS</span>
                  <span className="flex items-center gap-1"><span className="text-g-green">✓</span> ShaComputeC AI</span>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Link
                  to="/login"
                  className="inline-flex h-12 items-center gap-2 rounded-xl bg-g-green px-8 text-sm font-bold text-white shadow-lg transition hover:bg-g-green-dark hover:shadow-xl"
                >
                  Start Free Trial →
                </Link>
                <a
                  href="https://shacomputecghapp.unaux.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center justify-center rounded-xl border-2 border-slate-200 px-8 text-sm font-bold text-slate-600 transition hover:border-g-navy hover:text-g-navy dark:border-slate-600 dark:text-slate-300"
                >
                  Visit Website
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Alert strip */}
      <section className="mx-auto max-w-7xl px-4 pb-4">
        <div className="flex items-start gap-3 rounded-xl border border-g-red/20 bg-g-red/5 p-4">
          <Icon name="alert" className="mt-0.5 h-5 w-5 shrink-0 text-g-red" />
          <div>
            <p className="text-sm font-bold text-g-ink dark:text-g-dark-text">Public health alerts (DEMO)</p>
            <p className="mt-0.5 text-sm text-slate-600 dark:text-g-dark-muted">
              Seasonal malaria prevention — sleep under insecticide-treated nets and clear stagnant water. Vaccination services are available at CHPS compounds and health centres.
              <Badge tone="gray" className="ml-2">Synthetic demo alert — not an official GHS notice</Badge>
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-g-green px-8 py-8 text-white md:flex-row">
          <div>
            <h2 className="text-xl font-bold">Are you a healthcare provider?</h2>
            <p className="mt-1 text-sm text-green-100">Join the national facility registry, or sign in to the hospital information system with your facility account.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/register-facility" className="inline-flex h-11 items-center rounded-xl bg-white px-6 text-sm font-bold text-g-green transition hover:bg-green-50">
              Register your facility
            </Link>
            <Link to="/login" className="inline-flex h-11 items-center rounded-xl bg-g-navy px-6 text-sm font-bold text-white transition hover:bg-g-navy-2">
              Staff login →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
