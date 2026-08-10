import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { DemoBanner, Icon, type IconName } from './ui';
import { useAuth } from '../lib/auth';
import { SyncBadge } from './SyncBadge';
import { Logo } from './PortalLayout';

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  perms?: string[];
}

const NAV: NavItem[] = [
  { to: '/app', label: 'Dashboard', icon: 'home', perms: ['view_dashboard'] },
  { to: '/app/queue', label: 'Queue', icon: 'list', perms: ['view_queue', 'manage_queue'] },
  { to: '/app/patients', label: 'Patients', icon: 'users', perms: ['view_patient'] },
  { to: '/app/register', label: 'Register Patient', icon: 'plus', perms: ['create_patient'] },
  { to: '/app/appointments', label: 'Appointments', icon: 'calendar', perms: ['view_appointments'] },
  { to: '/app/pharmacy', label: 'Pharmacy', icon: 'pill', perms: ['dispense', 'view_patient'] },
  { to: '/app/lab', label: 'Laboratory', icon: 'flask', perms: ['order_lab', 'verify_lab'] },
  { to: '/app/stock', label: 'Stock & Inventory', icon: 'truck', perms: ['manage_stock', 'view_financial'] },
  { to: '/app/referrals', label: 'Referrals', icon: 'globe', perms: ['view_patient', 'view_clinical_record'] },
  { to: '/app/immunizations', label: 'Immunizations', icon: 'syringe', perms: ['view_clinical_record', 'write_clinical_note'] },
  { to: '/app/beds', label: 'Beds', icon: 'bed', perms: ['view_patient', 'write_clinical_note'] },
  { to: '/app/ambulances', label: 'Ambulances', icon: 'ambulance', perms: ['manage_ambulance', 'view_patient'] },
  { to: '/app/bloodbank', label: 'Blood bank', icon: 'drop', perms: ['manage_blood_bank', 'view_patient'] },
  { to: '/app/theatre', label: 'Theatre', icon: 'clipboard', perms: ['manage_theatre', 'write_clinical_note'] },
  { to: '/app/directorate', label: 'Directorate', icon: 'globe', perms: ['view_reports', 'view_dashboard'] },
  { to: '/app/admin', label: 'Admin & Sync', icon: 'shield', perms: ['view_audit', 'manage_devices', 'sync_data'] },
];

function canSee(user: { scope: string; permissions: string[] } | null, perms?: string[]): boolean {
  if (!user) return false;
  if (user.scope === 'PATIENT') return false;
  if (!perms) return true;
  return perms.some((p) => user.permissions.includes(p));
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-g-paper">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col bg-g-navy text-slate-300">
        <div className="flex h-16 items-center border-b border-white/10 px-4">
          <Logo dark />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV.filter((n) => canSee(user, n.perms)).map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/app'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`
              }
            >
              <Icon name={n.icon} className="h-4.5 w-4.5" />
              {n.label}
            </NavLink>
          ))}
          <div className="pt-4">
            <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white">
              <Icon name="globe" className="h-4.5 w-4.5" />
              Public portal
            </Link>
          </div>
        </nav>
        <div className="border-t border-white/10 p-4">
          <DemoBanner compact />
          <div className="mt-3 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-g-red text-xs font-bold text-white">
              {user?.fullName?.charAt(0) ?? '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{user?.fullName}</p>
              <p className="truncate text-[10px] text-slate-400">{user?.roleName}</p>
            </div>
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="cursor-pointer rounded-md p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              title="Log out"
            >
              <Icon name="logout" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="ml-60 flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-6 backdrop-blur">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Icon name="building" className="h-4 w-4 text-g-red" />
            <span className="font-semibold text-g-ink">Korle-Bu Teaching Hospital (DEMO)</span>
            <span className="hidden text-slate-400 sm:inline">· Scope: {user?.scope}</span>
          </div>
          <SyncBadge />
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
