/**
 * License Key Generator for GIHM-HIS
 * 
 * Format: GIHM-XXXX-XXXX-XXXX-XXXX
 * Where X is alphanumeric (uppercase, no confusing chars like 0/O, 1/I/L)
 * 
 * License includes:
 * - Key (activation code)
 * - Edition (Community/Professional/Enterprise)
 * - Facility info
 * - Expiry date
 * - Max facilities & users
 * - Activated status
 */

const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // No 0,O,1,I,L

export function generateLicenseKey(): string {
  const segments: string[] = ['GIHM'];
  for (let s = 0; s < 4; s++) {
    let seg = '';
    for (let i = 0; i < 4; i++) {
      seg += CHARSET[Math.floor(Math.random() * CHARSET.length)];
    }
    segments.push(seg);
  }
  return segments.join('-');
}

export interface LicenseRecord {
  id: string;
  key: string;
  edition: 'COMMUNITY' | 'PROFESSIONAL' | 'ENTERPRISE';
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  facilityName: string;
  facilityType: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  region: string;
  district: string;
  maxFacilities: number;
  maxUsers: number;
  activatedAt: string | null;
  expiresAt: string;
  createdAt: string;
  paystackRef: string;
  amountPaid: number;
  currency: string;
}

// Edition limits
export const EDITION_LIMITS: Record<string, { maxFacilities: number; maxUsers: number; validityDays: number }> = {
  COMMUNITY: { maxFacilities: 1, maxUsers: 10, validityDays: 365 },
  PROFESSIONAL: { maxFacilities: 5, maxUsers: 50, validityDays: 365 },
  ENTERPRISE: { maxFacilities: 9999, maxUsers: 9999, validityDays: 365 },
};

// Storage key for licenses in localStorage
const STORAGE_KEY = 'gihm_licenses';

export function getAllLicenses(): LicenseRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getLicenseByKey(key: string): LicenseRecord | undefined {
  return getAllLicenses().find((l) => l.key === key);
}

export function getLicenseByEmail(email: string): LicenseRecord | undefined {
  return getAllLicenses().find((l) => l.contactEmail.toLowerCase() === email.toLowerCase());
}

export function saveLicense(license: LicenseRecord): void {
  const licenses = getAllLicenses();
  const existing = licenses.findIndex((l) => l.id === license.id);
  if (existing >= 0) {
    licenses[existing] = license;
  } else {
    licenses.push(license);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(licenses));
}

export function createLicenseFromPayment(params: {
  planId: string;
  planName: string;
  facilityName: string;
  facilityType: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  region: string;
  district: string;
  paystackRef: string;
  amountPaid: number;
}): LicenseRecord {
  const editionMap: Record<string, LicenseRecord['edition']> = {
    community: 'COMMUNITY',
    professional: 'PROFESSIONAL',
    enterprise: 'ENTERPRISE',
  };
  const edition = editionMap[params.planId] ?? 'COMMUNITY';
  const limitsData = EDITION_LIMITS[edition];
  const defaults = EDITION_LIMITS['COMMUNITY'];
  if (!limitsData && !defaults) {
    throw new Error(`Unknown edition: ${edition}`);
  }
  const limits = limitsData ?? defaults!;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + limits.validityDays * 86400000);

  return {
    id: crypto.randomUUID(),
    key: generateLicenseKey(),
    edition,
    status: 'PENDING',
    facilityName: params.facilityName,
    facilityType: params.facilityType,
    contactName: params.contactName,
    contactEmail: params.contactEmail,
    contactPhone: params.contactPhone,
    region: params.region,
    district: params.district,
    maxFacilities: limits.maxFacilities,
    maxUsers: limits.maxUsers,
    activatedAt: null,
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString(),
    paystackRef: params.paystackRef,
    amountPaid: params.amountPaid,
    currency: 'GHS',
  };
}

export function activateLicense(key: string): { success: boolean; license?: LicenseRecord; error?: string } {
  const licenses = getAllLicenses();
  const idx = licenses.findIndex((l) => l.key === key.toUpperCase());
  
  if (idx < 0) {
    return { success: false, error: 'License key not found. Please check and try again.' };
  }
  
  const foundLicense = licenses[idx];
  if (!foundLicense) {
    return { success: false, error: 'License key not found. Please check and try again.' };
  }
  
  if (foundLicense.status === 'ACTIVE') {
    return { success: true, license: foundLicense, error: 'License is already activated.' };
  }
  
  if (foundLicense.status === 'REVOKED') {
    return { success: false, error: 'This license has been revoked. Contact support.' };
  }
  
  if (foundLicense.status === 'EXPIRED') {
    return { success: false, error: 'This license has expired. Please purchase a new one.' };
  }
  
  // Check if expired
  if (new Date(foundLicense.expiresAt).getTime() < Date.now()) {
    foundLicense.status = 'EXPIRED';
    saveLicense(foundLicense);
    return { success: false, error: 'This license has expired. Please purchase a new one.' };
  }
  
  // Activate
  foundLicense.status = 'ACTIVE';
  foundLicense.activatedAt = new Date().toISOString();
  saveLicense(foundLicense);
  
  return { success: true, license: foundLicense };
}

/**
 * Send license key via SMS using Hellio Messaging
 */
export async function sendLicenseViaSms(
  phone: string,
  licenseKey: string,
  edition: string,
  facilityName: string,
): Promise<boolean> {
  try {
    const message = [
      `🎉 GIHM-HIS License`,
      ``,
      `Hello ${facilityName}!`,
      ``,
      `Your ${edition} license key is:`,
      ``,
      `${licenseKey}`,
      ``,
      `Activate now: ${window.location.origin}/activate`,
      ``,
      `— ShaComputeC`,
    ].join('\n');
    
    const response = await fetch('https://cloud.helliomessaging.com/api/v1/sms/send', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer 6SKXQNB6ESYQZFYBAW4UG2AROUJC547S',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: phone,
        message,
        sender_id: 'GIHM',
      }),
    });
    
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Send license key via WhatsApp using Hellio Messaging
 */
export async function sendLicenseViaWhatsApp(
  phone: string,
  licenseKey: string,
  edition: string,
  facilityName: string,
): Promise<boolean> {
  try {
    const message = [
      `🎉 *GIHM-HIS License*`,
      ``,
      `Hello *${facilityName}*!`,
      ``,
      `Your *${edition}* license key is:`,
      ``,
      `\`${licenseKey}\``,
      ``,
      `Activate now: ${window.location.origin}/activate`,
      ``,
      `_— ShaComputeC · Hard Works Never Fail_`,
    ].join('\n');
    
    const response = await fetch('https://cloud.helliomessaging.com/api/v1/whatsapp/send', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer 6SKXQNB6ESYQZFYBAW4UG2AROUJC547S',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: phone,
        message,
      }),
    });
    
    return response.ok;
  } catch {
    return false;
  }
}
