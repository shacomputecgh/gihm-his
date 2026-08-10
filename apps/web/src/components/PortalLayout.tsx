import { Link, NavLink, Outlet } from 'react-router-dom';
import { FlagStripe, Icon } from './ui';
import { useAuth } from '../lib/auth';

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
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-g-navy text-white shadow-sm">
        <Icon name="pulse" className="h-5 w-5" />
      </span>
      <span className="leading-tight">
        <span className={dark ? 'block text-sm font-bold text-white' : 'block text-sm font-bold text-g-ink'}>GIHM-HIS</span>
        <span className={dark ? 'block text-[10px] text-slate-400' : 'block text-[10px] text-slate-500'}>Ghana Health Platform</span>
      </span>
    </Link>
  );
}

export default function PortalLayout() {
  const { user } = useAuth();
  return (
    <div className="flex min-h-screen flex-col">
      <FlagStripe />
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'text-g-red' : 'text-slate-600 hover:bg-g-mist hover:text-g-ink'}`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Link
                to={user.scope === 'PATIENT' ? '/patient' : '/app'}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-g-navy px-4 text-sm font-semibold text-white transition hover:bg-g-navy-2"
              >
                <Icon name="user" className="h-4 w-4" />
                {user.fullName.split(' ')[0]}
              </Link>
            ) : (
              <Link to="/login" className="inline-flex h-10 items-center rounded-lg bg-g-red px-4 text-sm font-semibold text-white transition hover:bg-g-red-dark">
                Login
              </Link>
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
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Explore</p>
            <ul className="space-y-2 text-sm">
              <li><Link className="hover:text-white" to="/find-healthcare">Find Healthcare</Link></li>
              <li><Link className="hover:text-white" to="/facilities">Facility Directory</Link></li>
              <li><Link className="hover:text-white" to="/register-facility">Register a Facility</Link></li>
              <li><Link className="hover:text-white" to="/login">Staff Login</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Platform</p>
            <ul className="space-y-2 text-sm">
              <li><span>16 regions · 261 districts</span></li>
              <li><span>Offline-first · Web · PWA</span></li>
              <li><span>API documentation: <a className="text-g-gold hover:underline" href="http://localhost:4000/docs" target="_blank" rel="noreferrer">/docs</a></span></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
            <span>© {new Date().getFullYear()} GIHM-HIS · DEMO / SYNTHETIC DATA ONLY</span>
            <span>Unofficial development prototype — not affiliated with or endorsed by the Ministry of Health or Ghana Health Service.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
