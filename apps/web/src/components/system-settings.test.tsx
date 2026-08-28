// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import SystemSettings from './SystemSettings';
import { Toaster } from './ui';
import type { SystemSetting } from '../types';

const mocks = vi.hoisted(() => ({
  api: vi.fn(),
}));

vi.mock('../lib/api', () => ({ api: mocks.api }));

const setting = (over: Partial<SystemSetting> = {}): SystemSetting => ({
  key: 'sms.provider',
  group: 'sms',
  label: 'SMS provider',
  description: 'Which gateway dispatches reminders',
  env: 'SMS_PROVIDER',
  secret: false,
  source: 'env',
  configured: false,
  value: '',
  ...over,
});

const sms = setting({ key: 'sms.provider', label: 'SMS provider', value: 'hubtel', source: 'custom', configured: true });
const smsSender = setting({
  key: 'sms.senderName',
  group: 'sms',
  label: 'SMS sender name',
  value: 'GIHM-HIS',
  source: 'custom',
  configured: true,
});
const wa = setting({ key: 'wa.provider', group: 'whatsapp', label: 'WhatsApp provider', value: 'hubtel', source: 'custom', configured: true });
const reminderEnabled = setting({ key: 'reminder.enabled', group: 'reminder', label: 'Auto reminders', value: 'true', source: 'custom', configured: true });
const smsKey = setting({
  key: 'sms.apikey',
  group: 'sms',
  label: 'SMS API key',
  secret: true,
  value: 'sk-masked',
  source: 'custom',
  configured: true,
});
const smtpHost = setting({
  key: 'mail.smtpHost',
  group: 'mail',
  label: 'SMTP host',
  value: 'smtp.example.com',
  source: 'env',
  configured: true,
});

const renderPanel = () =>
  render(
    <Toaster>
      <SystemSettings />
    </Toaster>,
  );

beforeEach(() => {
  mocks.api.mockReset();
  mocks.api.mockImplementation((url: string) => {
    if (url === '/admin/settings') return Promise.resolve({ settings: [sms, smsSender, wa, reminderEnabled, smsKey, smtpHost] });
    if (url === '/admin/settings/test-sms') return Promise.resolve({ provider: 'hubtel', balance: '12.40', note: 'Gateway reachable' });
    if (url === '/admin/settings/test-mail') return Promise.resolve({ dispatched: true, note: 'delivered to admin@demo.gh' });
    return Promise.resolve(undefined);
  });
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('SystemSettings', () => {
  it('shows a spinner while loading', () => {
    mocks.api.mockImplementation(() => new Promise(() => {}));
    renderPanel();
    expect(screen.getByText('Loading settings…')).toBeTruthy();
  });

  it('renders each group with its fields, badges and masked secrets', async () => {
    renderPanel();
    await waitFor(() => expect(screen.getByText('SMS gateway')).toBeTruthy());
    expect(screen.getByText('WhatsApp')).toBeTruthy();
    expect(screen.getByText('Auto reminder sweep')).toBeTruthy();
    expect(screen.getByText('Email (SMTP)')).toBeTruthy();
    // Secret fields never expose the stored value.
    // Field hints are part of the label's accessible text — match with a regex.
    const keyInput = screen.getByLabelText(/SMS API key/) as HTMLInputElement;
    expect(keyInput.value).toBe('');
    expect(screen.getByText('set')).toBeTruthy(); // configured badge on the secret
    expect(screen.getByText('custom')).toBeTruthy(); // custom override badge
    expect(screen.getByText('env')).toBeTruthy(); // env-default badge
  });

  it('saves only changed values and skips untouched secrets', async () => {
    renderPanel();
    await waitFor(() => expect(screen.getByText('SMS gateway')).toBeTruthy());
    fireEvent.change(screen.getByLabelText(/SMS provider/), { target: { value: 'twilio' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/settings',
        expect.objectContaining({
          method: 'PUT',
          body: { updates: expect.arrayContaining([{ key: 'sms.provider', value: 'twilio' }]) },
        }),
      ),
    );
    expect(screen.getByText('Settings saved — active immediately')).toBeTruthy();
  });

  it('sends a typed secret replacement but not an empty one', async () => {
    renderPanel();
    await waitFor(() => expect(screen.getByText('SMS gateway')).toBeTruthy());
    fireEvent.change(screen.getByLabelText(/SMS API key/), { target: { value: 'new-key' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/settings',
        expect.objectContaining({
          body: { updates: expect.arrayContaining([{ key: 'sms.apikey', value: 'new-key' }]) },
        }),
      ),
    );
  });

  it('warns when nothing changed', async () => {
    renderPanel();
    await waitFor(() => expect(screen.getByText('SMS gateway')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(screen.getByText('No changes to save')).toBeTruthy());
    expect(mocks.api).not.toHaveBeenCalledWith('/admin/settings', expect.objectContaining({ method: 'PUT' }));
  });

  it('resets customised settings to env defaults after confirmation', async () => {
    renderPanel();
    await waitFor(() => expect(screen.getByText('SMS gateway')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Reset customised' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/settings',
        expect.objectContaining({
          body: { updates: expect.arrayContaining([{ key: 'sms.provider', value: '' }]) },
        }),
      ),
    );
    expect(screen.getByText('Custom settings cleared — env defaults restored')).toBeTruthy();
  });

  it('reverts an individual custom secret to the env default', async () => {
    renderPanel();
    await waitFor(() => expect(screen.getByText('SMS gateway')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'revert' }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        '/admin/settings',
        expect.objectContaining({ method: 'PUT', body: { updates: [{ key: 'sms.apikey', value: '' }] } }),
      ),
    );
    expect(screen.getByText('Reverted to the .env default')).toBeTruthy();
  });

  it('tests the SMS gateway and shows the balance', async () => {
    renderPanel();
    await waitFor(() => expect(screen.getByText('SMS gateway')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Test SMS gateway' }));
    await waitFor(() =>
      expect(screen.getByText(/Gateway reachable \(hubtel, balance 12\.40\)/)).toBeTruthy(),
    );
    expect(screen.getByText('Gateway test complete')).toBeTruthy();
  });

  it('tests email dispatch and reports the outcome', async () => {
    renderPanel();
    await waitFor(() => expect(screen.getByText('SMS gateway')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Test email' }));
    await waitFor(() =>
      expect(screen.getByText(/Email sent — delivered to admin@demo\.gh/)).toBeTruthy(),
    );
    expect(screen.getByText('Test email dispatched')).toBeTruthy();
  });

  it('toasts errors when save, reset, revert, test-sms, and test-mail fail', async () => {
    const base = mocks.api.getMockImplementation()!;
    mocks.api.mockImplementation((url: string, init?: { method?: string }) => {
      if (url === '/admin/settings' && init?.method === 'PUT') return Promise.reject(new Error('save fail'));
      if (url === '/admin/settings/test-sms') return Promise.reject(new Error('sms fail'));
      if (url === '/admin/settings/test-mail') return Promise.reject(new Error('mail fail'));
      return base(url);
    });
    renderPanel();
    await waitFor(() => expect(screen.getByText('SMS gateway')).toBeTruthy());
    // Save fails.
    fireEvent.change(screen.getByLabelText(/SMS provider/), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(screen.getByText('save fail')).toBeTruthy());
    // Test SMS fails.
    fireEvent.click(screen.getByRole('button', { name: 'Test SMS gateway' }));
    await waitFor(() => expect(screen.getByText('sms fail')).toBeTruthy());
    // Test email fails.
    fireEvent.click(screen.getByRole('button', { name: 'Test email' }));
    await waitFor(() => expect(screen.getByText('mail fail')).toBeTruthy());
    // Reset fails.
    fireEvent.click(screen.getByRole('button', { name: 'Reset customised' }));
    await waitFor(() => expect(screen.getByText('save fail')).toBeTruthy());
  });

  it('shows email not dispatched when test-mail reports dispatched=false', async () => {
    mocks.api.mockImplementation((url: string) => {
      if (url === '/admin/settings') return Promise.resolve({ settings: [sms, smsSender, wa, reminderEnabled, smsKey, smtpHost] });
      if (url === '/admin/settings/test-mail') return Promise.resolve({ dispatched: false, note: 'SMTP unreachable' });
      return Promise.resolve(undefined);
    });
    renderPanel();
    await waitFor(() => expect(screen.getByText('SMS gateway')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Test email' }));
    await waitFor(() => expect(screen.getByText(/Not sent — SMTP unreachable/)).toBeTruthy());
    expect(screen.getByText('Test email not sent')).toBeTruthy();
  });

  it('skips reset when no custom settings exist', async () => {
    const envOnly = setting({ key: 'sms.provider', value: 'hubtel', source: 'env', configured: false });
    mocks.api.mockImplementation((url: string) => {
      if (url === '/admin/settings') return Promise.resolve({ settings: [envOnly] });
      return Promise.resolve(undefined);
    });
    renderPanel();
    await waitFor(() => expect(screen.getByText('SMS gateway')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Reset customised' }));
    await waitFor(() => expect(screen.getByText(/Nothing to reset/)).toBeTruthy());
    expect(mocks.api).not.toHaveBeenCalledWith('/admin/settings', expect.objectContaining({ method: 'PUT' }));
  });
});
