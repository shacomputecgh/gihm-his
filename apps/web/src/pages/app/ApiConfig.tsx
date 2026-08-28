import { useCallback, useEffect, useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { api } from '../../lib/api';
import type { AdminApiConfig, SystemApiConfig } from '../../lib/apiConfig';
import { getEffectiveSmsConfig, getEffectiveWhatsAppConfig, getEffectivePaymentConfig } from '../../lib/apiConfig';
import { Badge, Button, Card, Field, Icon, Input, PageHeader, Segmented, Select, Spinner, useToast } from '../../components/ui';

type Tab = 'overview' | 'sms' | 'whatsapp' | 'email' | 'payment';

export default function ApiConfig() {
  const [tab, setTab] = useState<Tab>('overview');
  const [config, setConfig] = useState<SystemApiConfig | null>(null);
  const [adminConfig, setAdminConfig] = useState<Partial<AdminApiConfig>>({});
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      const res = await api<SystemApiConfig>('/system/api-config');
      setConfig(res);
      if (res.admin) setAdminConfig(res.admin);
    } catch {
      // Default to trial mode
      setConfig({
        developer: {
          hellio: { apiKey: import.meta.env.VITE_DEV_HELIO_KEY || 'DEV_KEY_NOT_SET', baseUrl: import.meta.env.VITE_DEV_HELIO_URL || 'https://cloud.helliomessaging.com/api', enabled: true },
          paystack: { secretKey: import.meta.env.VITE_DEV_PAYSTACK_SECRET || 'DEV_SECRET_NOT_SET', publicKey: import.meta.env.VITE_DEV_PAYSTACK_PUBLIC || 'DEV_PUBLIC_NOT_SET', enabled: true },
        },
        admin: null,
        purchased: false,
        trialMode: true,
        trialEndsAt: null,
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setSaving(true);
    try {
      await api('/system/api-config/admin', { method: 'PUT', body: adminConfig });
      toast('API configuration saved', 'success');
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (!config) return <Spinner label="Loading API configuration…" />;

  const sms = getEffectiveSmsConfig(config);
  const whatsapp = getEffectiveWhatsAppConfig(config);
  const payment = getEffectivePaymentConfig(config)
  const [editingItem, setEditingItem] = useState<Record<string, string> | null>(null);
  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">
          {showAdd ? "\u2715 Cancel" : "+ Add New"}
        </button>
      </div>
      {showAdd && (
        <AddNewForm
          title="Add New API Configuration"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader
        title="API Configuration"
        subtitle="Manage messaging, email, and payment API credentials for your facility."
        action={
          <div className="flex items-center gap-2">
            {config.trialMode && <Badge tone="gold">Trial Mode</Badge>}
            {config.purchased && <Badge tone="green">Licensed</Badge>}
          </div>
        }
      />

      {config.trialMode && (
        <Card className="mb-5 border-g-gold/30 bg-g-gold/10">
          <div className="flex items-start gap-3">
            <Icon name="info" className="mt-0.5 h-5 w-5 shrink-0 text-yellow-700" />
            <div>
              <p className="font-semibold text-yellow-800">Trial Mode Active</p>
              <p className="mt-1 text-sm text-yellow-700">
                You are using the developer's API credentials during the trial period.
                After purchasing the software, you can configure your own API credentials below.
                The developer's credentials are locked and cannot be modified by administrators.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="mb-5">
        <Segmented
          options={[
            { value: 'overview', label: 'Overview' },
            { value: 'sms', label: 'SMS' },
            { value: 'whatsapp', label: 'WhatsApp' },
            { value: 'email', label: 'Email' },
            { value: 'payment', label: 'Payment' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'overview' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500">SMS Gateway</p>
              <Badge tone={sms.enabled ? 'green' : 'gray'}>{sms.enabled ? 'Active' : 'Inactive'}</Badge>
            </div>
            <p className="mt-2 text-sm font-semibold text-g-ink">
              {sms.isDeveloper ? 'Developer (Hellio)' : 'Your Custom Gateway'}
            </p>
            <p className="mt-1 text-xs text-slate-400">Sender ID: {sms.senderId}</p>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500">WhatsApp</p>
              <Badge tone={whatsapp.enabled ? 'green' : 'gray'}>{whatsapp.enabled ? 'Active' : 'Inactive'}</Badge>
            </div>
            <p className="mt-2 text-sm font-semibold text-g-ink">
              {whatsapp.isDeveloper ? 'Developer (Hellio)' : 'Your Custom Gateway'}
            </p>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500">Email (SMTP)</p>
              <Badge tone={config.admin?.email.enabled ? 'green' : 'gray'}>
                {config.admin?.email.enabled ? 'Active' : 'Not Configured'}
              </Badge>
            </div>
            <p className="mt-2 text-sm font-semibold text-g-ink">
              {config.admin?.email.smtpHost || 'Not configured'}
            </p>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500">Payment Gateway</p>
              <Badge tone={payment.enabled ? 'green' : 'gray'}>{payment.enabled ? 'Active' : 'Inactive'}</Badge>
            </div>
            <p className="mt-2 text-sm font-semibold text-g-ink">
              {payment.isDeveloper ? 'Developer (Paystack)' : `Your ${payment.provider}`}
            </p>
          </Card>
        </div>
      )}

      {tab === 'sms' && (
        <Card title="SMS Gateway Configuration">
          <p className="mb-4 text-sm text-slate-500">
            Configure your facility's SMS gateway for sending appointment reminders, lab results, and emergency alerts.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Provider">
              <Select
                value={adminConfig.sms?.provider ?? 'hellio'}
                onChange={(e) => setAdminConfig({ ...adminConfig, sms: { ...adminConfig.sms!, provider: e.target.value as any } })}
              >
                <option value="hellio">Hellio Messaging (Ghana)</option>
                <option value="twilio">Twilio (International)</option>
                <option value="africastalking">Africa's Talking (Africa)</option>
                <option value="custom">Custom Provider</option>
              </Select>
            </Field>
            <Field label="API Key">
              <Input
                value={adminConfig.sms?.apiKey ?? ''}
                onChange={(e) => setAdminConfig({ ...adminConfig, sms: { ...adminConfig.sms!, apiKey: e.target.value } })}
                placeholder="Your SMS API key"
              />
            </Field>
            <Field label="API Secret">
              <Input
                type="password"
                value={adminConfig.sms?.apiSecret ?? ''}
                onChange={(e) => setAdminConfig({ ...adminConfig, sms: { ...adminConfig.sms!, apiSecret: e.target.value } })}
                placeholder="Your SMS API secret"
              />
            </Field>
            <Field label="Sender ID">
              <Input
                value={adminConfig.sms?.senderId ?? ''}
                onChange={(e) => setAdminConfig({ ...adminConfig, sms: { ...adminConfig.sms!, senderId: e.target.value } })}
                placeholder="GIHM"
              />
            </Field>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={adminConfig.sms?.enabled ?? false}
                onChange={(e) => setAdminConfig({ ...adminConfig, sms: { ...adminConfig.sms!, enabled: e.target.checked } })}
                className="h-4 w-4 accent-g-red"
              />
              <span className="text-sm font-semibold text-g-ink">Enable custom SMS gateway</span>
            </label>
            <Button loading={saving} onClick={() => void save()}>Save configuration</Button>
          </div>
        </Card>
      )}

      {tab === 'whatsapp' && (
        <Card title="WhatsApp Gateway Configuration">
          <p className="mb-4 text-sm text-slate-500">
            Configure WhatsApp messaging for patient outreach, reminders, and health campaigns.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Provider">
              <Select
                value={adminConfig.whatsapp?.provider ?? 'hellio'}
                onChange={(e) => setAdminConfig({ ...adminConfig, whatsapp: { ...adminConfig.whatsapp!, provider: e.target.value as any } })}
              >
                <option value="hellio">Hellio Messaging (Ghana)</option>
                <option value="twilio">Twilio (International)</option>
                <option value="meta">Meta Cloud API</option>
                <option value="custom">Custom Provider</option>
              </Select>
            </Field>
            <Field label="API Key">
              <Input
                value={adminConfig.whatsapp?.apiKey ?? ''}
                onChange={(e) => setAdminConfig({ ...adminConfig, whatsapp: { ...adminConfig.whatsapp!, apiKey: e.target.value } })}
                placeholder="Your WhatsApp API key"
              />
            </Field>
            <Field label="API Secret">
              <Input
                type="password"
                value={adminConfig.whatsapp?.apiSecret ?? ''}
                onChange={(e) => setAdminConfig({ ...adminConfig, whatsapp: { ...adminConfig.whatsapp!, apiSecret: e.target.value } })}
                placeholder="Your WhatsApp API secret"
              />
            </Field>
            <Field label="Phone Number ID">
              <Input
                value={adminConfig.whatsapp?.phoneNumberId ?? ''}
                onChange={(e) => setAdminConfig({ ...adminConfig, whatsapp: { ...adminConfig.whatsapp!, phoneNumberId: e.target.value } })}
                placeholder="WhatsApp phone number ID"
              />
            </Field>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={adminConfig.whatsapp?.enabled ?? false}
                onChange={(e) => setAdminConfig({ ...adminConfig, whatsapp: { ...adminConfig.whatsapp!, enabled: e.target.checked } })}
                className="h-4 w-4 accent-g-red"
              />
              <span className="text-sm font-semibold text-g-ink">Enable custom WhatsApp gateway</span>
            </label>
            <Button loading={saving} onClick={() => void save()}>Save configuration</Button>
          </div>
        </Card>
      )}

      {tab === 'email' && (
        <Card title="Email (SMTP) Configuration">
          <p className="mb-4 text-sm text-slate-500">
            Configure SMTP email for sending reports, alerts, and system notifications.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="SMTP Host">
              <Input
                value={adminConfig.email?.smtpHost ?? ''}
                onChange={(e) => setAdminConfig({ ...adminConfig, email: { ...adminConfig.email!, smtpHost: e.target.value } })}
                placeholder="smtp.gmail.com"
              />
            </Field>
            <Field label="SMTP Port">
              <Input
                type="number"
                value={adminConfig.email?.smtpPort ?? 587}
                onChange={(e) => setAdminConfig({ ...adminConfig, email: { ...adminConfig.email!, smtpPort: Number(e.target.value) } })}
                placeholder="587"
              />
            </Field>
            <Field label="SMTP Username">
              <Input
                value={adminConfig.email?.smtpUser ?? ''}
                onChange={(e) => setAdminConfig({ ...adminConfig, email: { ...adminConfig.email!, smtpUser: e.target.value } })}
                placeholder="your-email@gmail.com"
              />
            </Field>
            <Field label="SMTP Password">
              <Input
                type="password"
                value={adminConfig.email?.smtpPass ?? ''}
                onChange={(e) => setAdminConfig({ ...adminConfig, email: { ...adminConfig.email!, smtpPass: e.target.value } })}
                placeholder="Your SMTP password"
              />
            </Field>
            <Field label="From Email">
              <Input
                type="email"
                value={adminConfig.email?.fromEmail ?? ''}
                onChange={(e) => setAdminConfig({ ...adminConfig, email: { ...adminConfig.email!, fromEmail: e.target.value } })}
                placeholder="noreply@yourfacility.com"
              />
            </Field>
            <Field label="From Name">
              <Input
                value={adminConfig.email?.fromName ?? ''}
                onChange={(e) => setAdminConfig({ ...adminConfig, email: { ...adminConfig.email!, fromName: e.target.value } })}
                placeholder="Your Facility Name"
              />
            </Field>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={adminConfig.email?.enabled ?? false}
                onChange={(e) => setAdminConfig({ ...adminConfig, email: { ...adminConfig.email!, enabled: e.target.checked } })}
                className="h-4 w-4 accent-g-red"
              />
              <span className="text-sm font-semibold text-g-ink">Enable email notifications</span>
            </label>
            <Button loading={saving} onClick={() => void save()}>Save configuration</Button>
          </div>
        </Card>
      )}

      {tab === 'payment' && (
        <Card title="Payment Gateway Configuration">
          <p className="mb-4 text-sm text-slate-500">
            Configure payment processing for patient billing and insurance claims.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Provider">
              <Select
                value={adminConfig.payment?.provider ?? 'paystack'}
                onChange={(e) => setAdminConfig({ ...adminConfig, payment: { ...adminConfig.payment!, provider: e.target.value as any } })}
              >
                <option value="paystack">Paystack (Ghana/Nigeria)</option>
                <option value="flutterwave">Flutterwave (Africa)</option>
                <option value="custom">Custom Provider</option>
              </Select>
            </Field>
            <Field label="API Key (Public)">
              <Input
                value={adminConfig.payment?.apiKey ?? ''}
                onChange={(e) => setAdminConfig({ ...adminConfig, payment: { ...adminConfig.payment!, apiKey: e.target.value } })}
                placeholder="pk_live_..."
              />
            </Field>
            <Field label="API Secret (Private)">
              <Input
                type="password"
                value={adminConfig.payment?.apiSecret ?? ''}
                onChange={(e) => setAdminConfig({ ...adminConfig, payment: { ...adminConfig.payment!, apiSecret: e.target.value } })}
                placeholder="sk_live_..."
              />
            </Field>
            <Field label="Webhook Secret">
              <Input
                type="password"
                value={adminConfig.payment?.webhookSecret ?? ''}
                onChange={(e) => setAdminConfig({ ...adminConfig, payment: { ...adminConfig.payment!, webhookSecret: e.target.value } })}
                placeholder="whsec_..."
              />
            </Field>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={adminConfig.payment?.enabled ?? false}
                onChange={(e) => setAdminConfig({ ...adminConfig, payment: { ...adminConfig.payment!, enabled: e.target.checked } })}
                className="h-4 w-4 accent-g-red"
              />
              <span className="text-sm font-semibold text-g-ink">Enable payment processing</span>
            </label>
            <Button loading={saving} onClick={() => void save()}>Save configuration</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
