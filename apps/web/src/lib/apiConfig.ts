/**
 * API Configuration System
 * 
 * Two-tier credential architecture:
 * 
 * 1. DEVELOPER CREDENTIALS (locked, used only by the platform for developer-level operations):
 *    - Hellio Messaging API (SMS, WhatsApp)
 *    - Paystack API (payments)
 *    - These are encrypted and stored in the system, not editable by admins
 * 
 * 2. ADMIN CREDENTIALS (editable by facility/super-admin after purchase):
 *    - Facility's own SMS gateway
 *    - Facility's own WhatsApp gateway
 *    - Facility's own payment gateway
 *    - Facility's own email SMTP settings
 * 
 * The system checks admin credentials first, falls back to developer credentials.
 */

import { api } from './api';

export interface DeveloperApiConfig {
  hellio: {
    apiKey: string;
    baseUrl: string;
    enabled: boolean;
  };
  paystack: {
    secretKey: string;
    publicKey: string;
    enabled: boolean;
  };
}

export interface AdminApiConfig {
  sms: {
    provider: 'hellio' | 'twilio' | 'africastalking' | 'custom';
    apiKey: string;
    apiSecret: string;
    senderId: string;
    enabled: boolean;
  };
  whatsapp: {
    provider: 'hellio' | 'twilio' | 'meta' | 'custom';
    apiKey: string;
    apiSecret: string;
    phoneNumberId: string;
    enabled: boolean;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    fromEmail: string;
    fromName: string;
    enabled: boolean;
  };
  payment: {
    provider: 'paystack' | 'flutterwave' | 'custom';
    apiKey: string;
    apiSecret: string;
    webhookSecret: string;
    enabled: boolean;
  };
}

export interface SystemApiConfig {
  developer: DeveloperApiConfig;
  admin: AdminApiConfig | null;
  purchased: boolean;
  trialMode: boolean;
  trialEndsAt: string | null;
}

// Developer's pre-configured credentials (loaded from environment variables)
export const DEVELOPER_CREDENTIALS: DeveloperApiConfig = {
  hellio: {
    apiKey: import.meta.env.VITE_DEV_HELIO_KEY || 'DEV_KEY_NOT_SET',
    baseUrl: import.meta.env.VITE_DEV_HELIO_URL || 'https://cloud.helliomessaging.com/api',
    enabled: true,
  },
  paystack: {
    secretKey: import.meta.env.VITE_DEV_PAYSTACK_SECRET || 'DEV_SECRET_NOT_SET',
    publicKey: import.meta.env.VITE_DEV_PAYSTACK_PUBLIC || 'DEV_PUBLIC_NOT_SET',
    enabled: true,
  },
};

// Get effective SMS config (admin first, then developer fallback)
export function getEffectiveSmsConfig(config: SystemApiConfig): {
  apiKey: string;
  senderId: string;
  enabled: boolean;
  isDeveloper: boolean;
} {
  if (config.admin?.sms.enabled && config.admin.sms.apiKey) {
    return {
      apiKey: config.admin.sms.apiKey,
      senderId: config.admin.sms.senderId,
      enabled: true,
      isDeveloper: false,
    };
  }
  // Fall back to developer Hellio
  return {
    apiKey: config.developer.hellio.apiKey,
    senderId: 'GIHM',
    enabled: config.developer.hellio.enabled,
    isDeveloper: true,
  };
}

// Get effective WhatsApp config
export function getEffectiveWhatsAppConfig(config: SystemApiConfig): {
  apiKey: string;
  enabled: boolean;
  isDeveloper: boolean;
} {
  if (config.admin?.whatsapp.enabled && config.admin.whatsapp.apiKey) {
    return {
      apiKey: config.admin.whatsapp.apiKey,
      enabled: true,
      isDeveloper: false,
    };
  }
  return {
    apiKey: config.developer.hellio.apiKey,
    enabled: config.developer.hellio.enabled,
    isDeveloper: true,
  };
}

// Get effective email config
export function getEffectiveEmailConfig(config: SystemApiConfig): {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;
  fromName: string;
  enabled: boolean;
  isDeveloper: boolean;
} | null {
  if (config.admin?.email.enabled && config.admin.email.smtpHost) {
    return {
      ...config.admin.email,
      isDeveloper: false,
    };
  }
  // No developer email config — admin must configure their own
  return null;
}

// Get effective payment config
export function getEffectivePaymentConfig(config: SystemApiConfig): {
  provider: string;
  publicKey: string;
  enabled: boolean;
  isDeveloper: boolean;
} {
  if (config.admin?.payment.enabled && config.admin.payment.apiKey) {
    return {
      provider: config.admin.payment.provider,
      publicKey: config.admin.payment.apiKey,
      enabled: true,
      isDeveloper: false,
    };
  }
  return {
    provider: 'paystack',
    publicKey: config.developer.paystack.publicKey,
    enabled: config.developer.paystack.enabled,
    isDeveloper: true,
  };
}

// Load config from API
export async function loadApiConfig(): Promise<SystemApiConfig> {
  try {
    const res = await api<SystemApiConfig>('/system/api-config');
    return res;
  } catch {
    // Default to developer credentials in trial mode
    return {
      developer: DEVELOPER_CREDENTIALS,
      admin: null,
      purchased: false,
      trialMode: true,
      trialEndsAt: null,
    };
  }
}

// Save admin config (only admin/super-admin can do this)
export async function saveAdminConfig(config: Partial<AdminApiConfig>): Promise<void> {
  await api('/system/api-config/admin', { method: 'PUT', body: config });
}

// Send SMS (uses effective config)
export async function sendSms(to: string, message: string, config: SystemApiConfig): Promise<boolean> {
  const smsConfig = getEffectiveSmsConfig(config);
  if (!smsConfig.enabled) return false;

  // Hellio Messaging API
  const response = await fetch(`${config.developer.hellio.baseUrl}/v1/sms/send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${smsConfig.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to,
      message,
      sender_id: smsConfig.senderId,
    }),
  });

  return response.ok;
}

// Send WhatsApp message (uses effective config)
export async function sendWhatsApp(to: string, message: string, config: SystemApiConfig): Promise<boolean> {
  const waConfig = getEffectiveWhatsAppConfig(config);
  if (!waConfig.enabled) return false;

  const response = await fetch(`${config.developer.hellio.baseUrl}/v1/whatsapp/send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${waConfig.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to,
      message,
    }),
  });

  return response.ok;
}

// Initialize payment (uses effective config)
export async function initializePayment(
  email: string,
  amount: number,
  metadata: Record<string, unknown>,
  config: SystemApiConfig
): Promise<{ authorization_url: string; reference: string } | null> {
  const paymentConfig = getEffectivePaymentConfig(config);
  if (!paymentConfig.enabled) return null;

  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.developer.paystack.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // Paystack uses kobo
        metadata,
      }),
    });

    const data = await response.json();
    if (data.status) {
      return data.data;
    }
    return null;
  } catch {
    return null;
  }
}
