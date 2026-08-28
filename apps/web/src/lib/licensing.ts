/**
 * Trial Licensing System
 * 
 * After purchasing the software, the system runs in trial mode for a configurable period.
 * - No demo data — all data is real
 * - Full feature access during trial
 * - After trial expires: read-only mode until license is activated
 * - License activation requires a license key from the developer
 */

import { api } from './api';

export interface LicenseInfo {
  id: string;
  key: string;
  type: 'trial' | 'standard' | 'enterprise';
  status: 'active' | 'expired' | 'suspended' | 'pending';
  facilityName: string;
  facilityId: string;
  activatedAt: string | null;
  expiresAt: string | null;
  maxUsers: number;
  maxFacilities: number;
  features: string[];
  createdAt: string;
}

export interface TrialInfo {
  isTrial: boolean;
  trialStart: string;
  trialEnd: string;
  daysRemaining: number;
  expired: boolean;
}

// Trial duration: 30 days
export const TRIAL_DURATION_DAYS = 30;

// Get current license status
export async function getLicenseInfo(): Promise<LicenseInfo | null> {
  try {
    const res = await api<LicenseInfo>('/system/license');
    return res;
  } catch {
    return null;
  }
}

// Get trial info
export async function getTrialInfo(): Promise<TrialInfo> {
  try {
    const res = await api<TrialInfo>('/system/trial');
    return res;
  } catch {
    // Default trial info
    const start = new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + TRIAL_DURATION_DAYS);
    return {
      isTrial: true,
      trialStart: start.toISOString(),
      trialEnd: end.toISOString(),
      daysRemaining: TRIAL_DURATION_DAYS,
      expired: false,
    };
  }
}

// Activate license with key
export async function activateLicense(key: string): Promise<LicenseInfo> {
  const res = await api<LicenseInfo>('/system/license/activate', {
    method: 'POST',
    body: { key },
  });
  return res;
}

// Check if feature is available
export function isFeatureAvailable(license: LicenseInfo | null, feature: string): boolean {
  if (!license) return false; // No license = no features
  if (license.status === 'expired') return false; // Expired = no features
  if (license.status === 'suspended') return false; // Suspended = no features
  return license.features.includes(feature);
}

// Check if user limit is reached
export function isUserLimitReached(license: LicenseInfo | null, currentUsers: number): boolean {
  if (!license) return true; // No license = can't add users
  if (license.maxUsers === -1) return false; // Unlimited
  return currentUsers >= license.maxUsers;
}

// Get license badge tone
export function getLicenseBadgeTone(license: LicenseInfo | null): 'green' | 'gold' | 'red' | 'gray' {
  if (!license) return 'gray';
  if (license.status === 'active') return 'green';
  if (license.status === 'pending') return 'gold';
  if (license.status === 'expired') return 'red';
  return 'gray';
}

// Format license status
export function formatLicenseStatus(license: LicenseInfo | null): string {
  if (!license) return 'No License';
  if (license.status === 'active') return `Active (${license.type})`;
  if (license.status === 'pending') return 'Pending Activation';
  if (license.status === 'expired') return 'Expired';
  if (license.status === 'suspended') return 'Suspended';
  return 'Unknown';
}
