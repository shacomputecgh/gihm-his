import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import type { LicenseStatus } from '../types';
import { Badge } from './ui';

/** How often the header badge refetches license status (avoids a DB round-trip
 * pair on every navigation). */
const REFRESH_MS = 60_000;

/** Compact license status for the app header — visible to every staff user. */
export default function LicenseBadge() {
  const [license, setLicense] = useState<LicenseStatus | null>(null);
  const lastFetch = useRef(0);
  const location = useLocation();

  useEffect(() => {
    // Throttle: on navigation refetch only if the cached value is stale.
    if (Date.now() - lastFetch.current < REFRESH_MS && license) return;
    lastFetch.current = Date.now();
    let cancelled = false;
    void api<{ license: LicenseStatus }>('/license/status')
      .then((res) => {
        if (!cancelled) setLicense(res.license);
      })
      .catch(() => {
        // No backend — default to trial mode
        if (!cancelled) {
          setLicense({
            activated: false,
            edition: 'Trial',
            keySuffix: null,
            expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
            expired: false,
            daysLeft: 30,
            facilities: { used: 1, max: null },
            users: { used: 5, max: null },
            compliant: true,
            limitsExceeded: [],
          });
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  if (!license) return null;

  if (!license.activated) {
    return (
      <span title="Free 30-day trial — all features available. Activate a license in Developer Mode → Licensing." className="inline-flex cursor-help">
        <Badge tone="green">TRIAL · 30 DAYS</Badge>
      </span>
    );
  }

  const overLimit = license.limitsExceeded.length > 0;
  const tone = license.expired || overLimit ? 'red' : 'green';
  const days = license.daysLeft !== null ? ` · ${license.daysLeft}d left` : '';
  const label = license.expired ? 'EXPIRED' : overLimit ? 'OVER LIMIT' : `${license.edition ?? 'LICENSED'}${days}`;
  const title = [
    `License: ${license.edition ?? 'unknown'} edition`,
    license.expiresAt ? `Expires ${new Date(license.expiresAt).toLocaleDateString('en-GB')} (${license.daysLeft} days)` : 'No expiry',
    `Facilities ${license.facilities.used}/${license.facilities.max ?? '∞'} · Users ${license.users.used}/${license.users.max ?? '∞'}`,
    license.compliant ? 'Compliant' : 'Non-compliant',
  ].join(' — ');

  return (
    <span title={title} className="inline-flex cursor-help">
      <Badge tone={tone}>{label}</Badge>
    </span>
  );
}
