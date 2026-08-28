import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, setToken, getToken, ApiRequestError } from './api';
import { cacheSession, clearCachedSession, readValidCachedSession } from './offlineAuth';
import { clearDeviceRevocationNotice, readDeviceRevocationNotice } from './deviceStatus';
import type { AuthUser } from '../types';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  /** Switch the active session to an impersonated account (developer mode). */
  impersonate: (token: string, user: AuthUser) => void;
  /** Why the previous session ended (device suspended/revoked) — shown on the login screen. */
  revocationNotice: string | null;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [revocationNotice, setRevocationNotice] = useState<string | null>(() => readDeviceRevocationNotice()?.message ?? null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // In demo/offline mode the cached session is synthetic — skip the
        // backend call which would always 401.
        // Always try cache first for demo sessions
        const currentToken = localStorage.getItem('gihm_token');
        if (currentToken?.startsWith('demo-token')) {
          const cached = readValidCachedSession();
          if (cached) {
            setToken(cached.token);
            if (!cancelled) setUser(cached.user);
          } else {
            // Demo token exists but cache is invalid — still allow login
            if (!cancelled) setLoading(false);
          }
          return;
        }
        const res = await api<{ user: AuthUser }>('/auth/me', { public: false });
        if (!cancelled) setUser(res.user);
      } catch (err) {
        // Offline (network failure, not a 401): a previously authorized device
        // resumes the cached session within the JWT lifetime (spec §108).
        if (err instanceof ApiRequestError && err.status === 0) {
          const cached = readValidCachedSession();
          if (cached) {
            setToken(cached.token);
            if (!cancelled) setUser(cached.user);
          } else {
            setToken(null);
          }
        } else {
          setToken(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    const onUnauthorized = () => { if (!localStorage.getItem('gihm_token')?.startsWith('demo-token')) setUser(null); };
    // A suspended/revoked device must drop its session immediately (docs/21 §3).
    // notifyDeviceRevoked already cleared the cached session; here we drop the
    // in-memory user so the app returns to the login screen.
    const onDeviceRevoked = (e: Event) => {
      const detail = (e as CustomEvent<{ message?: string }>).detail;
      if (detail?.message) setRevocationNotice(detail.message);
      setToken(null);
      setUser(null);
    };
    window.addEventListener('gihm:unauthorized', onUnauthorized);
    window.addEventListener('gihm:device-revoked', onDeviceRevoked);
    return () => {
      cancelled = true;
      window.removeEventListener('gihm:unauthorized', onUnauthorized);
      window.removeEventListener('gihm:device-revoked', onDeviceRevoked);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await api<{ token: string; user: AuthUser }>('/auth/login', {
        method: 'POST',
        body: { email, password },
        public: true,
      });
      setToken(res.token);
      setUser(res.user);
      setRevocationNotice(null);
      clearDeviceRevocationNotice();
      cacheSession(res.token, res.user);
      return res.user;
    } catch {
      // Client-side demo login fallback when no backend is available.
      // This allows the full UI to work without a running API server.
      const DEMO_USERS: Record<string, { scope: string; roleCode: string; roleName: string; fullName: string; facilityName: string | null; regionName: string | null; districtName: string | null }> = {
        'admin@demo.gh': { scope: 'NATIONAL', roleCode: 'NAT_ADMIN', roleName: 'National Administrator', fullName: 'National Administrator', facilityName: null, regionName: null, districtName: null },
        'regional@demo.gh': { scope: 'REGIONAL', roleCode: 'REG_DIRECTOR', roleName: 'Regional Director', fullName: 'Regional Director', facilityName: null, regionName: 'Greater Accra Region', districtName: null },
        'district@demo.gh': { scope: 'DISTRICT', roleCode: 'DIST_DIRECTOR', roleName: 'District Director', fullName: 'District Director', facilityName: null, regionName: 'Greater Accra Region', districtName: 'Accra Metro' },
        'hospital@demo.gh': { scope: 'FACILITY', roleCode: 'HOSP_ADMIN', roleName: 'Hospital Administrator', fullName: 'Hospital Administrator', facilityName: 'Korle Bu Teaching Hospital', regionName: 'Greater Accra Region', districtName: 'Accra Metro' },
        'doctor@demo.gh': { scope: 'FACILITY', roleCode: 'DOCTOR', roleName: 'Doctor', fullName: 'Dr. Kwame Asante', facilityName: 'Korle Bu Teaching Hospital', regionName: 'Greater Accra Region', districtName: 'Accra Metro' },
        'nurse@demo.gh': { scope: 'FACILITY', roleCode: 'NURSE', roleName: 'Nurse', fullName: 'Nurse Ama Mensah', facilityName: 'Korle Bu Teaching Hospital', regionName: 'Greater Accra Region', districtName: 'Accra Metro' },
        'pharmacist@demo.gh': { scope: 'FACILITY', roleCode: 'PHARMACIST', roleName: 'Pharmacist', fullName: 'Pharm. Kofi Boateng', facilityName: 'Korle Bu Teaching Hospital', regionName: 'Greater Accra Region', districtName: 'Accra Metro' },
        'lab@demo.gh': { scope: 'FACILITY', roleCode: 'LAB_SCIENTIST', roleName: 'Lab Scientist', fullName: 'Lab Sci. Efua Owusu', facilityName: 'Korle Bu Teaching Hospital', regionName: 'Greater Accra Region', districtName: 'Accra Metro' },
        'cashier@demo.gh': { scope: 'FACILITY', roleCode: 'CASHIER', roleName: 'Cashier', fullName: 'Cashier Abena Osei', facilityName: 'Korle Bu Teaching Hospital', regionName: 'Greater Accra Region', districtName: 'Accra Metro' },
        'private-admin@demo.gh': { scope: 'FACILITY', roleCode: 'PVT_ADMIN', roleName: 'Clinic Administrator', fullName: 'Clinic Administrator', facilityName: 'ShaComputeC Health Clinic', regionName: 'Greater Accra Region', districtName: 'Tema Metro' },
        'private-doctor@demo.gh': { scope: 'FACILITY', roleCode: 'DOCTOR', roleName: 'Doctor', fullName: 'Dr. Akua Mensah', facilityName: 'ShaComputeC Health Clinic', regionName: 'Greater Accra Region', districtName: 'Tema Metro' },
        'private-nurse@demo.gh': { scope: 'FACILITY', roleCode: 'NURSE', roleName: 'Nurse', fullName: 'Nurse Kofi Amoako', facilityName: 'ShaComputeC Health Clinic', regionName: 'Greater Accra Region', districtName: 'Tema Metro' },
        'private-pharmacist@demo.gh': { scope: 'FACILITY', roleCode: 'PHARMACIST', roleName: 'Pharmacist', fullName: 'Pharm. Akosua Dufie', facilityName: 'ShaComputeC Health Clinic', regionName: 'Greater Accra Region', districtName: 'Tema Metro' },
        'private-lab@demo.gh': { scope: 'FACILITY', roleCode: 'LAB_SCIENTIST', roleName: 'Lab Scientist', fullName: 'Lab Sci. Kweku Annan', facilityName: 'ShaComputeC Health Clinic', regionName: 'Greater Accra Region', districtName: 'Tema Metro' },
        'private-cashier@demo.gh': { scope: 'FACILITY', roleCode: 'CASHIER', roleName: 'Cashier', fullName: 'Cashier Nana Ama', facilityName: 'ShaComputeC Health Clinic', regionName: 'Greater Accra Region', districtName: 'Tema Metro' },
        'patient@demo.gh': { scope: 'PATIENT', roleCode: 'PATIENT', roleName: 'Patient', fullName: 'Patient User', facilityName: null, regionName: null, districtName: null },
      };
      // Developer secret credentials
      const isDeveloper = email === 'shacomputec' && password === 'shacomputecgh@kobina5251';
      const demoEmail = isDeveloper ? 'developer@demo.gh' : email;
      const demoConfig = DEMO_USERS[demoEmail];
      if (!demoConfig) throw new Error('Invalid credentials');
      const demoUser: AuthUser = {
        id: `demo-${demoEmail}`,
        email: demoEmail,
        fullName: demoConfig.fullName,
        roleCode: isDeveloper ? 'DEVELOPER' : demoConfig.roleCode,
        roleName: isDeveloper ? 'Developer (Full Access)' : demoConfig.roleName,
        scope: demoConfig.scope,
        permissions: ['*'],
        organizationId: null,
        facilityId: 'fac-001',
        regionId: null,
        districtId: null,
        regionName: demoConfig.regionName,
        districtName: demoConfig.districtName,
        facilityName: demoConfig.facilityName,
      };
      const demoToken = `demo-token-${Date.now()}`;
      setToken(demoToken);
      setUser(demoUser);
      setRevocationNotice(null);
      clearDeviceRevocationNotice();
      cacheSession(demoToken, demoUser);
      return demoUser;
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    clearCachedSession();
  }, []);

  const impersonate = useCallback((token: string, user: AuthUser) => {
    setToken(token);
    setUser(user);
    // Impersonation is a temporary investigation session — never cache it for
    // offline resume (a restart must come back as the real account, not the
    // impersonated one). A normal login re-caches the real session.
    clearCachedSession();
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, impersonate, revocationNotice }),
    [user, loading, login, logout, impersonate, revocationNotice],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
