import { Link, NavLink, Outlet } from 'react-router-dom';
import { FlagStripe, Icon } from './ui';
import { useAuth } from '../lib/auth';
import ThemeToggle from './ThemeToggle';
import LanguageSelector from './LanguageSelector';

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/find-healthcare', label: 'Find Healthcare' },
  { to: '/facilities', label: 'Facilities' },
  { to: '/health-information', label: 'Health Info' },
  { to: '/news', label: 'News' },
  { to: '/register-facility', label: 'Register Facility' },
  { to: '/contact', label: 'Contact' },
];

export function Logo({ dark }: { dark?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <img src="/shacomputec-logo.png" alt="ShaComputeC" className="h-9 w-9 rounded-xl object-contain shadow-md" />
      <span className="leading-tight">
        <span className={dark ? 'block text-sm font-bold text-white' : 'block text-sm font-bold text-g-ink'}>GIHM-HIS</span>
        <span className={dark ? 'block text-[10px] text-slate-400' : 'block text-[10px] text-slate-500'}>by ShaComputeC · Ghana Health Platform</span>
      </span>
    </Link>
  );
}

export default function PortalLayout() {
  const { user } = useAuth();
  return (
    <div className="flex min-h-screen flex-col">
      <FlagStripe />
      <header className="sticky top-0 z-30 glass border-b border-slate-200 dark:border-g-dark-border">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${isActive ? 'text-g-red bg-g-red/5' : 'text-slate-600 hover:bg-g-mist hover:text-g-ink dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white'}`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to={user.scope === 'PATIENT' ? '/patient' : '/app'}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-g-navy px-4 text-sm font-semibold text-white transition-all duration-200 hover:bg-g-navy-2 hover:shadow-lg hover:shadow-g-navy/20"
              >
                <Icon name="user" className="h-4 w-4" />
                {user.fullName.split(' ')[0]}
              </Link>
            ) : (
              <>
                <Link
                  to="/purchase"
                  className="inline-flex h-10 items-center rounded-xl border border-blue-500 px-4 text-sm font-semibold text-blue-600 transition-all duration-200 hover:bg-blue-50"
                >
                  Purchase
                </Link>
                <Link
                  to="/login"
                  className="inline-flex h-10 items-center rounded-xl bg-g-red px-4 text-sm font-semibold text-white transition-all duration-200 hover:bg-g-red-dark hover:shadow-lg hover:shadow-g-red/20"
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-16 border-t border-slate-200 bg-g-navy text-slate-300">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo dark />
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
              Foundation prototype for a secure, offline-first, interoperable national health-information platform —
              one shared architecture for public healthcare, facility directory, hospital information systems, and national analytics.
            </p>
            <div className="mt-6 flex gap-3">
              <a href="http://localhost:4000/docs" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/20 hover:text-white">
                <Icon name="code" className="h-3.5 w-3.5" />
                API Docs
              </a>
            </div>
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Explore</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link className="transition hover:text-white" to="/find-healthcare">Find Healthcare</Link></li>
              <li><Link className="transition hover:text-white" to="/facilities">Facility Directory</Link></li>
              <li><Link className="transition hover:text-white" to="/register-facility">Register a Facility</Link></li>
              <li><Link className="transition hover:text-white" to="/book-appointment">Book Appointment</Link></li>
              <li><Link className="transition hover:text-white" to="/login">Staff Login</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Platform</p>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2"><Icon name="globe" className="h-3.5 w-3.5 text-g-gold" /> 16 regions · 261 districts</li>
              <li className="flex items-center gap-2"><Icon name="wifi" className="h-3.5 w-3.5 text-g-green" /> Offline-first · Web · PWA</li>
              <li className="flex items-center gap-2"><Icon name="shield" className="h-3.5 w-3.5 text-g-red" /> HIPAA-ready security</li>
            </ul>
            <p className="mb-3 mt-5 text-xs font-bold uppercase tracking-wider text-slate-500">Follow Us</p>
            <ul className="space-y-2.5 text-sm">
              <li><a href="https://web.facebook.com/shacomputecgh" target="_blank" rel="noopener noreferrer" className="transition hover:text-white">Facebook</a></li>
              <li><a href="https://tiktok.com/@shacomputecgh" target="_blank" rel="noopener noreferrer" className="transition hover:text-white">TikTok</a></li>
              <li><a href="https://www.youtube.com/@shacomputec" target="_blank" rel="noopener noreferrer" className="transition hover:text-white">YouTube</a></li>
              <li><a href="https://whatsapp.com/channel/shacomputec" target="_blank" rel="noopener noreferrer" className="transition hover:text-white">WhatsApp</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <div className="flex flex-col gap-3 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-1">
                <span>© {new Date().getFullYear()} GIHM-HIS — Developed by <strong className="text-g-gold">ShaComputeC</strong></span>
                <span>Hard Works Never Fail · shacomputec@gmail.com · +233 530 941 750</span>
              </div>
              <span>DEMO / SYNTHETIC DATA ONLY — Not affiliated with the Ministry of Health or Ghana Health Service.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
