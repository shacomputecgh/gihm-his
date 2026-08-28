import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { AdminApiConfig, SystemApiConfig } from '../../lib/apiConfig';
import { DEVELOPER_CREDENTIALS } from '../../lib/apiConfig';
import { Badge, Button, Card, Field, Icon, Input, PageHeader, Segmented, Select, Spinner, useToast } from '../../components/ui';

type Tab = 'overview' | 'sms' | 'whatsapp' | 'email' | 'payment' | 'custom';

interface SmsProvider {
  id: string;
  name: string;
  baseUrl: string;
  docs: string;
  fields: { key: string; label: string; placeholder: string; required: boolean; type?: string }[];
}

const SMS_PROVIDERS: SmsProvider[] = [
  {
    id: 'hellio',
    name: 'Hellio Messaging',
    baseUrl: 'https://cloud.helliomessaging.com/api',
    docs: 'https://cloud.helliomessaging.com/dashboard',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'Enter your Hellio API key', required: true },
      { key: 'senderId', label: 'Sender ID', placeholder: 'GIHM', required: true },
    ],
  },
  {
    id: 'twilio',
    name: 'Twilio',
    baseUrl: 'https://api.twilio.com',
    docs: 'https://console.twilio.com',
    fields: [
      { key: 'apiKey', label: 'Account SID', placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', required: true },
      { key: 'apiSecret', label: 'Auth Token', placeholder: 'Your auth token', required: true },
      { key: 'senderId', label: 'Twilio Phone Number', placeholder: '+1234567890', required: true },
    ],
  },
  {
    id: 'africastalking',
    name: "Africa's Talking",
    baseUrl: 'https://api.africastalking.com',
    docs: 'https://code.africastalking.com',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'Your Africa\'s Talking API key', required: true },
      { key: 'senderId', label: 'Sender ID', placeholder: 'GIHM', required: true },
    ],
  },
  {
    id: 'custom',
    name: 'Custom SMS Gateway',
    baseUrl: '',
    docs: '',
    fields: [
      { key: 'apiKey', label: 'API Key / Token', placeholder: 'Enter API key', required: true },
      { key: 'apiSecret', label: 'API Secret (optional)', placeholder: 'Enter API secret', required: false },
      { key: 'senderId', label: 'Sender ID', placeholder: 'GIHM', required: true },
    ],
  },
];

const WHATSAPP_PROVIDERS = [
  { id: 'hellio', name: 'Hellio Messaging', docs: 'https://cloud.helliomessaging.com/dashboard' },
  { id: 'twilio', name: 'Twilio WhatsApp', docs: 'https://console.twilio.com' },
  { id: 'meta', name: 'Meta (WhatsApp Business)', docs: 'https://business.facebook.com' },
  { id: 'custom', name: 'Custom WhatsApp Gateway', docs: '' },
];

function StepGuide({ steps }: { steps: string[] }) {
  return (
    <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-blue-600">📋 Setup Steps</p>
      <ol className="space-y-2">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3 text-sm text-blue-800">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function TestButton({ label, onTest, testing }: { label: string; onTest: () => void; testing: boolean }) {
  return (
    <Button variant="outline" loading={testing} onClick={onTest} className="text-xs">
      🧪 {label}
    </Button>
  );
}

export default function SystemSettings() {
  const [tab, setTab] = useState<Tab>('overview');
  const [config, setConfig] = useState<SystemApiConfig | null>(null);
  const [adminConfig, setAdminConfig] = useState<Partial<AdminApiConfig>>({
    sms: { provider: 'hellio', apiKey: '', apiSecret: '', senderId: '', enabled: false },
    whatsapp: { provider: 'hellio', apiKey: '', apiSecret: '', phoneNumberId: '', enabled: false },
    email: { smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '', fromEmail: '', fromName: '', enabled: false },
    payment: { provider: 'paystack', apiKey: '', apiSecret: '', webhookSecret: '', enabled: false },
  });
  const [customIntegrations, setCustomIntegrations] = useState<{ name: string; url: string; token: string; enabled: boolean }[]>([]);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customToken, setCustomToken] = useState('');
  const toast = useToast();
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api<SystemApiConfig>('/system/api-config');
      setConfig(res);
      if (res.admin) setAdminConfig(res.admin);
    } catch {
      setConfig({
        developer: DEVELOPER_CREDENTIALS,
        admin: null,
        purchased: false,
        trialMode: true,
        trialEndsAt: null,
      });
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function save() {
    setSaving(true);
    try {
      await api('/system/api-config/admin', { method: 'PUT', body: adminConfig });
      toast('Settings saved successfully', 'success');
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function testSms() {
    setTesting('sms');
    try {
      const phone = prompt('Enter a phone number to send a test SMS to (+233...):');
      if (!phone) { setTesting(null); return; }
      const res = await api<{ sent: boolean; message: string }>('/system/api-config/test-sms', { method: 'POST', body: { phone } });
      toast(res.message, res.sent ? 'success' : 'error');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Test failed', 'error');
    } finally {
      setTesting(null);
    }
  }

  async function testWhatsApp() {
    setTesting('whatsapp');
    try {
      const phone = prompt('Enter a phone number to send a test WhatsApp to (+233...):');
      if (!phone) { setTesting(null); return; }
      const res = await api<{ sent: boolean; message: string }>('/system/api-config/test-whatsapp', { method: 'POST', body: { phone } });
      toast(res.message, res.sent ? 'success' : 'error');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Test failed', 'error');
    } finally {
      setTesting(null);
    }
  }

  async function testEmail() {
    setTesting('email');
    try {
      const email = prompt('Enter an email address to send a test email to:');
      if (!email) { setTesting(null); return; }
      const res = await api<{ sent: boolean; message: string }>('/system/api-config/test-email', { method: 'POST', body: { email } });
      toast(res.message, res.sent ? 'success' : 'error');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Test failed', 'error');
    } finally {
      setTesting(null);
    }
  }

  async function testPayment() {
    setTesting('payment');
    try {
      const res = await api<{ verified: boolean; message: string }>('/system/api-config/test-payment', { method: 'POST' });
      toast(res.message, res.verified ? 'success' : 'error');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Test failed', 'error');
    } finally {
      setTesting(null);
    }
  }

  function addCustomIntegration() {
    if (!customName || !customUrl) {
      toast('Name and URL are required', 'error');
      return;
    }
    setCustomIntegrations([...customIntegrations, { name: customName, url: customUrl, token: customToken, enabled: true }]);
    setCustomName('');
    setCustomUrl('');
    setCustomToken('');
    toast('Custom integration added', 'success');
  }

  if (!config) return <Spinner label="Loading settings..." />;

  const isConfigured = (svc: 'sms' | 'whatsapp' | 'email' | 'payment') => {
    if (svc === 'email') return Boolean(config.admin?.email?.enabled && config.admin?.email?.smtpHost);
    if (svc === 'payment') return Boolean(config.admin?.payment?.enabled && config.admin?.payment?.apiKey);
    if (svc === 'sms') return Boolean(config.admin?.sms?.enabled && config.admin?.sms?.apiKey);
    if (svc === 'whatsapp') return Boolean(config.admin?.whatsapp?.enabled && config.admin?.whatsapp?.apiKey);
    return false;
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">
          {showAdd ? "\u2715 Cancel" : "+ Add New"}
        </button>
      </div>
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { setShowAdd(false);  }} className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm font-bold">✕</button>
            <h2 className="text-lg font-bold mb-4">Add New Setting</h2>
            <div className="text-sm text-gray-500">Use the tabs above to configure SMS, WhatsApp, Email, and Payment settings for your facility.</div>
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => { setShowAdd(false);  }}>Close</Button>
            </div>
          </div>
        </div>
      )}
      <PageHeader
        title="System Settings"
        subtitle="Configure API gateways, messaging, email, payments, and custom integrations for your facility."
        action={
          <Button variant="green" loading={saving} onClick={() => void save()}>
            💾 Save All Settings
          </Button>
        }
      />

      {config.trialMode && (
        <Card className="mb-5 border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3">
            <Icon name="info" className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-800">Trial Mode Active</p>
              <p className="mt-1 text-sm text-amber-700">
                You are using the developer.s pre-configured credentials (locked). After purchasing a license, configure your own SMS, WhatsApp, Email, and Payment credentials in the tabs below. Developer credentials are used only for platform operations.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="mb-5">
        <Segmented
          options={[
            { value: 'overview', label: 'Overview' },
            { value: 'sms', label: '📱 SMS' },
            { value: 'whatsapp', label: '💬 WhatsApp' },
            { value: 'email', label: '📧 Email' },
            { value: 'payment', label: '💳 Payment' },
            { value: 'custom', label: '🔧 Custom' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      {/* ============ OVERVIEW ============ */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { name: 'SMS Gateway', configured: isConfigured('sms'), dev: config.admin?.sms?.provider || 'hellio', icon: '📱' },
              { name: 'WhatsApp', configured: isConfigured('whatsapp'), dev: config.admin?.whatsapp?.provider || 'hellio', icon: '💬' },
              { name: 'Email (SMTP)', configured: isConfigured('email'), dev: config.admin?.email?.smtpHost || 'Not set', icon: '📧' },
              { name: 'Payment Gateway', configured: isConfigured('payment'), dev: config.admin?.payment?.provider || 'paystack', icon: '💳' },
            ].map((svc) => (
              <Card key={svc.name}>
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{svc.icon}</span>
                  <Badge tone={svc.configured ? 'green' : 'gold'}>{svc.configured ? 'Configured' : 'Needs Setup'}</Badge>
                </div>
                <p className="mt-3 text-sm font-bold text-slate-800">{svc.name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {svc.configured ? `Active: ${svc.dev}` : 'Configure your own credentials'}
                </p>
              </Card>
            ))}
          </div>

          {/* Notice: Configure your own credentials */}
          <Card className="border-blue-200 bg-blue-50">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">💡</span>
              <h3 className="text-sm font-bold text-blue-700">Configure Your Facility Credentials</h3>
            </div>
            <p className="text-sm text-blue-600">Use the tabs above to configure your own SMS, WhatsApp, Email, and Payment API credentials. Each service can be configured independently.</p>
            <p className="text-xs text-blue-500 mt-2">For developer-level access and platform credentials, use the Developer Console.</p>
          </Card>

          <Card title="Quick Start Guide">
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg border border-slate-100 p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">1</span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Purchase a License</p>
                  <p className="text-xs text-slate-500">Buy the software to unlock your own API configuration</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-slate-100 p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">2</span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Configure Your APIs</p>
                  <p className="text-xs text-slate-500">Set up SMS, WhatsApp, Email, and Payment gateways with your own credentials</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-slate-100 p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">3</span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Test Each Service</p>
                  <p className="text-xs text-slate-500">Use the test buttons to verify each API works correctly</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-slate-100 p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-600">4</span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Go Live!</p>
                  <p className="text-xs text-slate-500">Your facility can now send real notifications and process payments</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ============ SMS ============ */}
      {tab === 'sms' && (
        <div className="space-y-4">
          <StepGuide steps={[
            'Choose your SMS provider from the dropdown below',
            'Create an account at the provider\'s website (links provided)',
            'Get your API key from the provider\'s dashboard',
            'Enter the credentials in the fields below',
            'Click "Save All Settings" to save',
            'Click "Test SMS" to send a test message and verify it works',
          ]} />

          <Card title="SMS Gateway Configuration" subtitle="Configure how your facility sends appointment reminders, lab results, and alerts via SMS.">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Provider">
                  <Select
                    value={adminConfig.sms?.provider ?? 'hellio'}
                    onChange={(e) => setAdminConfig({
                      ...adminConfig,
                      sms: { ...adminConfig.sms!, provider: e.target.value as any },
                    })}
                  >
                    {SMS_PROVIDERS.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Sender ID">
                  <Input
                    value={adminConfig.sms?.senderId ?? ''}
                    onChange={(e) => setAdminConfig({
                      ...adminConfig,
                      sms: { ...adminConfig.sms!, senderId: e.target.value },
                    })}
                    placeholder="GIHM"
                  />
                </Field>
              </div>

              <Field label="API Key">
                <Input
                  type="password"
                  value={adminConfig.sms?.apiKey ?? ''}
                  onChange={(e) => setAdminConfig({
                    ...adminConfig,
                    sms: { ...adminConfig.sms!, apiKey: e.target.value },
                  })}
                  placeholder="Enter your API key"
                />
              </Field>

              <Field label="API Secret (optional)">
                <Input
                  type="password"
                  value={adminConfig.sms?.apiSecret ?? ''}
                  onChange={(e) => setAdminConfig({
                    ...adminConfig,
                    sms: { ...adminConfig.sms!, apiSecret: e.target.value },
                  })}
                  placeholder="Enter API secret if required"
                />
              </Field>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={adminConfig.sms?.enabled ?? false}
                    onChange={(e) => setAdminConfig({
                      ...adminConfig,
                      sms: { ...adminConfig.sms!, enabled: e.target.checked },
                    })}
                    className="h-4 w-4 accent-green-600"
                  />
                  <span className="text-sm font-semibold text-slate-700">Enable SMS Gateway</span>
                </label>
              </div>

              <div className="flex justify-end gap-2">
                <TestButton label="Test SMS" onTest={() => void testSms()} testing={testing === 'sms'} />
                <Button variant="green" loading={saving} onClick={() => void save()}>Save Settings</Button>
              </div>
            </div>
          </Card>

          {/* Provider-specific info */}
          {adminConfig.sms?.provider === 'hellio' && (
            <Card className="border-blue-100 bg-blue-50">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-blue-600">Hellio Messaging Setup</p>
              <ol className="list-inside list-decimal space-y-1 text-sm text-blue-800">
                <li>Go to <a href="https://cloud.helliomessaging.com/dashboard" target="_blank" rel="noopener noreferrer" className="font-semibold underline">cloud.helliomessaging.com/dashboard</a></li>
                <li>Create an account or log in</li>
                <li>Navigate to API Keys section</li>
                <li>Copy your API key and paste it above</li>
                <li>Set a Sender ID (e.g., GIHM, YourHospital)</li>
                <li>Save and test!</li>
              </ol>
            </Card>
          )}
          {adminConfig.sms?.provider === 'twilio' && (
            <Card className="border-blue-100 bg-blue-50">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-blue-600">Twilio Setup</p>
              <ol className="list-inside list-decimal space-y-1 text-sm text-blue-800">
                <li>Go to <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="font-semibold underline">console.twilio.com</a></li>
                <li>Create an account or log in</li>
                <li>Find your Account SID and Auth Token on the dashboard</li>
                <li>Buy a Ghana phone number from Phone Numbers</li>
                <li>Enter your Account SID as API Key, Auth Token as API Secret</li>
                <li>Enter your Twilio phone number as Sender ID</li>
                <li>Save and test!</li>
              </ol>
            </Card>
          )}
          {adminConfig.sms?.provider === 'africastalking' && (
            <Card className="border-blue-100 bg-blue-50">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-blue-600">Africa's Talking Setup</p>
              <ol className="list-inside list-decimal space-y-1 text-sm text-blue-800">
                <li>Go to <a href="https://code.africastalking.com" target="_blank" rel="noopener noreferrer" className="font-semibold underline">code.africastalking.com</a></li>
                <li>Create an account or log in</li>
                <li>Navigate to Settings → API Keys</li>
                <li>Copy your sandbox or production API key</li>
                <li>Set a registered Sender ID</li>
                <li>Save and test!</li>
              </ol>
            </Card>
          )}
        </div>
      )}

      {/* ============ WHATSAPP ============ */}
      {tab === 'whatsapp' && (
        <div className="space-y-4">
          <StepGuide steps={[
            'Choose your WhatsApp provider',
            'Set up a WhatsApp Business account at the provider',
            'Get your API credentials from the dashboard',
            'Enter the credentials below',
            'Save and test!',
          ]} />

          <Card title="WhatsApp Configuration" subtitle="Configure WhatsApp messaging for patient notifications and alerts.">
            <div className="space-y-4">
              <Field label="Provider">
                <Select
                  value={adminConfig.whatsapp?.provider ?? 'hellio'}
                  onChange={(e) => setAdminConfig({
                    ...adminConfig,
                    whatsapp: { ...adminConfig.whatsapp!, provider: e.target.value as any },
                  })}
                >
                  {WHATSAPP_PROVIDERS.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
              </Field>

              <Field label="API Key / Token">
                <Input
                  type="password"
                  value={adminConfig.whatsapp?.apiKey ?? ''}
                  onChange={(e) => setAdminConfig({
                    ...adminConfig,
                    whatsapp: { ...adminConfig.whatsapp!, apiKey: e.target.value },
                  })}
                  placeholder="Enter your API key"
                />
              </Field>

              <Field label="Phone Number ID (for Meta)">
                <Input
                  value={adminConfig.whatsapp?.phoneNumberId ?? ''}
                  onChange={(e) => setAdminConfig({
                    ...adminConfig,
                    whatsapp: { ...adminConfig.whatsapp!, phoneNumberId: e.target.value },
                  })}
                  placeholder="Optional — required for Meta/WhatsApp Business"
                />
              </Field>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={adminConfig.whatsapp?.enabled ?? false}
                    onChange={(e) => setAdminConfig({
                      ...adminConfig,
                      whatsapp: { ...adminConfig.whatsapp!, enabled: e.target.checked },
                    })}
                    className="h-4 w-4 accent-green-600"
                  />
                  <span className="text-sm font-semibold text-slate-700">Enable WhatsApp Gateway</span>
                </label>
              </div>

              <div className="flex justify-end gap-2">
                <TestButton label="Test WhatsApp" onTest={() => void testWhatsApp()} testing={testing === 'whatsapp'} />
                <Button variant="green" loading={saving} onClick={() => void save()}>Save Settings</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ============ EMAIL ============ */}
      {tab === 'email' && (
        <div className="space-y-4">
          <StepGuide steps={[
            'Choose an SMTP provider (Gmail, Outlook, or custom SMTP server)',
            'For Gmail: Enable 2-Factor Authentication, then create an App Password',
            'For Outlook: Create an App Password in Security settings',
            'Enter your SMTP credentials below',
            'Set the "From" name and email that recipients will see',
            'Save and send a test email!',
          ]} />

          <Card title="Email (SMTP) Configuration" subtitle="Configure email for appointment confirmations, invoices, and notifications.">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="SMTP Host">
                  <Select
                    value={adminConfig.email?.smtpHost ?? ''}
                    onChange={(e) => {
                      const presets: Record<string, { host: string; port: number }> = {
                        gmail: { host: 'smtp.gmail.com', port: 587 },
                        outlook: { host: 'smtp.office365.com', port: 587 },
                        yahoo: { host: 'smtp.mail.yahoo.com', port: 587 },
                      };
                      const preset = presets[e.target.value];
                      setAdminConfig({
                        ...adminConfig,
                        email: {
                          ...adminConfig.email!,
                          smtpHost: preset?.host ?? e.target.value,
                          smtpPort: preset?.port ?? adminConfig.email?.smtpPort ?? 587,
                        },
                      });
                    }}
                  >
                    <option value="">Custom SMTP...</option>
                    <option value="gmail">Gmail (smtp.gmail.com)</option>
                    <option value="outlook">Outlook (smtp.office365.com)</option>
                    <option value="yahoo">Yahoo (smtp.mail.yahoo.com)</option>
                  </Select>
                </Field>
                <Field label="SMTP Port">
                  <Input
                    type="number"
                    value={adminConfig.email?.smtpPort ?? 587}
                    onChange={(e) => setAdminConfig({
                      ...adminConfig,
                      email: { ...adminConfig.email!, smtpPort: Number(e.target.value) },
                    })}
                  />
                </Field>
              </div>

              {(!adminConfig.email?.smtpHost || !['smtp.gmail.com', 'smtp.office365.com', 'smtp.mail.yahoo.com'].includes(adminConfig.email?.smtpHost ?? '')) && (
                <Field label="SMTP Host (custom)">
                  <Input
                    value={adminConfig.email?.smtpHost ?? ''}
                    onChange={(e) => setAdminConfig({
                      ...adminConfig,
                      email: { ...adminConfig.email!, smtpHost: e.target.value },
                    })}
                    placeholder="smtp.yourserver.com"
                  />
                </Field>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Email Address">
                  <Input
                    type="email"
                    value={adminConfig.email?.smtpUser ?? ''}
                    onChange={(e) => setAdminConfig({
                      ...adminConfig,
                      email: { ...adminConfig.email!, smtpUser: e.target.value },
                    })}
                    placeholder="you@gmail.com"
                  />
                </Field>
                <Field label="Password / App Password">
                  <Input
                    type="password"
                    value={adminConfig.email?.smtpPass ?? ''}
                    onChange={(e) => setAdminConfig({
                      ...adminConfig,
                      email: { ...adminConfig.email!, smtpPass: e.target.value },
                    })}
                    placeholder="Your app password"
                  />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="From Name">
                  <Input
                    value={adminConfig.email?.fromName ?? ''}
                    onChange={(e) => setAdminConfig({
                      ...adminConfig,
                      email: { ...adminConfig.email!, fromName: e.target.value },
                    })}
                    placeholder="Korle-Bu Hospital"
                  />
                </Field>
                <Field label="From Email">
                  <Input
                    type="email"
                    value={adminConfig.email?.fromEmail ?? ''}
                    onChange={(e) => setAdminConfig({
                      ...adminConfig,
                      email: { ...adminConfig.email!, fromEmail: e.target.value },
                    })}
                    placeholder="noreply@hospital.gov.gh"
                  />
                </Field>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={adminConfig.email?.enabled ?? false}
                    onChange={(e) => setAdminConfig({
                      ...adminConfig,
                      email: { ...adminConfig.email!, enabled: e.target.checked },
                    })}
                    className="h-4 w-4 accent-green-600"
                  />
                  <span className="text-sm font-semibold text-slate-700">Enable Email Gateway</span>
                </label>
              </div>

              <div className="flex justify-end gap-2">
                <TestButton label="Test Email" onTest={() => void testEmail()} testing={testing === 'email'} />
                <Button variant="green" loading={saving} onClick={() => void save()}>Save Settings</Button>
              </div>
            </div>
          </Card>

          <Card className="border-amber-100 bg-amber-50">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-600">🔑 Gmail Setup Tip</p>
            <ol className="list-inside list-decimal space-y-1 text-sm text-amber-800">
              <li>Enable 2-Factor Authentication on your Google account</li>
              <li>Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="font-semibold underline">myaccount.google.com/apppasswords</a></li>
              <li>Create a new App Password (select "Mail" and "Other")</li>
              <li>Copy the 16-character password and paste it as the Password above</li>
              <li>Never use your regular Gmail password — use the App Password</li>
            </ol>
          </Card>
        </div>
      )}

      {/* ============ PAYMENT ============ */}
      {tab === 'payment' && (
        <div className="space-y-4">
          <StepGuide steps={[
            'Go to paystack.com and create an account or log in',
            'Navigate to Settings → API Keys & Webhooks',
            'Copy your Test/Live API keys',
            'For webhooks: Set the URL to https://yourdomain.com/api/v1/payments/paystack/webhook',
            'Copy the webhook signing secret',
            'Enter your credentials below',
            'Save and verify your connection!',
          ]} />

          <Card title="Payment Gateway Configuration" subtitle="Configure how your facility receives payments from patients and insurance.">
            <div className="space-y-4">
              <Field label="Payment Provider">
                <Select
                  value={adminConfig.payment?.provider ?? 'paystack'}
                  onChange={(e) => setAdminConfig({
                    ...adminConfig,
                    payment: { ...adminConfig.payment!, provider: e.target.value as any },
                  })}
                >
                  <option value="paystack">Paystack (Ghana / Nigeria)</option>
                  <option value="flutterwave">Flutterwave (Africa-wide)</option>
                  <option value="custom">Custom Payment Gateway</option>
                </Select>
              </Field>

              <Field label="Public / Publishable Key">
                <Input
                  type="password"
                  value={adminConfig.payment?.apiKey ?? ''}
                  onChange={(e) => setAdminConfig({
                    ...adminConfig,
                    payment: { ...adminConfig.payment!, apiKey: e.target.value },
                  })}
                  placeholder="pk_live_xxxxx or pk_test_xxxxx"
                />
              </Field>

              <Field label="Secret Key">
                <Input
                  type="password"
                  value={adminConfig.payment?.apiSecret ?? ''}
                  onChange={(e) => setAdminConfig({
                    ...adminConfig,
                    payment: { ...adminConfig.payment!, apiSecret: e.target.value },
                  })}
                  placeholder="sk_live_xxxxx or sk_test_xxxxx"
                />
              </Field>

              <Field label="Webhook Signing Secret (optional)">
                <Input
                  type="password"
                  value={adminConfig.payment?.webhookSecret ?? ''}
                  onChange={(e) => setAdminConfig({
                    ...adminConfig,
                    payment: { ...adminConfig.payment!, webhookSecret: e.target.value },
                  })}
                  placeholder="whsec_xxxxx"
                />
              </Field>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={adminConfig.payment?.enabled ?? false}
                    onChange={(e) => setAdminConfig({
                      ...adminConfig,
                      payment: { ...adminConfig.payment!, enabled: e.target.checked },
                    })}
                    className="h-4 w-4 accent-green-600"
                  />
                  <span className="text-sm font-semibold text-slate-700">Enable Payment Gateway</span>
                </label>
              </div>

              <div className="flex justify-end gap-2">
                <TestButton label="Verify Connection" onTest={() => void testPayment()} testing={testing === 'payment'} />
                <Button variant="green" loading={saving} onClick={() => void save()}>Save Settings</Button>
              </div>
            </div>
          </Card>

          <Card className="border-blue-100 bg-blue-50">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-blue-600">Paystack Ghana Setup</p>
            <ol className="list-inside list-decimal space-y-1 text-sm text-blue-800">
              <li>Go to <a href="https://paystack.com" target="_blank" rel="noopener noreferrer" className="font-semibold underline">paystack.com</a> and create a business account</li>
              <li>Complete KYC verification (Ghana card, business registration)</li>
              <li>Go to Settings → API Keys & Webhooks</li>
              <li>Copy your Test keys first, then switch to Live keys</li>
              <li>Set the webhook URL: <code className="rounded bg-white px-1 text-xs">https://yourdomain.com/api/v1/payments/paystack/webhook</code></li>
              <li>Copy the Webhook Secret and paste it above</li>
              <li>Paystack charges 1.5% + GH₵0.70 per transaction in Ghana</li>
            </ol>
          </Card>
        </div>
      )}

      {/* ============ CUSTOM ============ */}
      {tab === 'custom' && (
        <div className="space-y-4">
          <Card title="Custom Integrations" subtitle="Add external APIs, webhooks, or custom services your facility uses.">
            <p className="mb-4 text-sm text-slate-500">
              Add any external API or webhook endpoint your facility needs. These can be used for custom reporting, data sync, or third-party services.
            </p>

            <div className="mb-6 space-y-3">
              <Field label="Integration Name">
                <Input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="e.g. District Health API" />
              </Field>
              <Field label="API URL / Endpoint">
                <Input value={customUrl} onChange={(e) => setCustomUrl(e.target.value)} placeholder="https://api.example.com/v1/..." />
              </Field>
              <Field label="API Token / Key (optional)">
                <Input type="password" value={customToken} onChange={(e) => setCustomToken(e.target.value)} placeholder="Bearer token or API key" />
              </Field>
              <Button variant="navy" onClick={() => void addCustomIntegration()}>+ Add Integration</Button>
            </div>

            {customIntegrations.length > 0 && (
              <div className="space-y-2">
                {customIntegrations.map((intg, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{intg.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{intg.url}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={intg.enabled ? 'green' : 'gray'}>{intg.enabled ? 'Active' : 'Disabled'}</Badge>
                      <button
                        onClick={() => setCustomIntegrations(customIntegrations.filter((_, j) => j !== i))}
                        className="text-xs font-bold text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Additional Facility Settings" subtitle="Configure other system behavior for your facility.">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Facility Timezone">
                <Select defaultValue="Africa/Accra">
                  <option value="Africa/Accra">Africa/Accra (GMT+0)</option>
                  <option value="Africa/Lagos">Africa/Lagos (GMT+1)</option>
                  <option value="Africa/Nairobi">Africa/Nairobi (GMT+3)</option>
                </Select>
              </Field>
              <Field label="Currency">
                <Select defaultValue="GHS">
                  <option value="GHS">Ghana Cedis (GH₵)</option>
                  <option value="NGN">Nigerian Naira (₦)</option>
                  <option value="KES">Kenyan Shilling (KSh)</option>
                  <option value="USD">US Dollar ($)</option>
                </Select>
              </Field>
              <Field label="Date Format">
                <Select defaultValue="DD/MM/YYYY">
                  <option value="DD/MM/YYYY">DD/MM/YYYY (Ghana standard)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                </Select>
              </Field>
              <Field label="Time Format">
                <Select defaultValue="24h">
                  <option value="24h">24-hour (14:30)</option>
                  <option value="12h">12-hour (2:30 PM)</option>
                </Select>
              </Field>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
