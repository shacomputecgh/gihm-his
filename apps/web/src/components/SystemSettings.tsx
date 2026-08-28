import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import type { SystemSetting } from '../types';
import { Badge, Button, Card, Field, Input, Select, Spinner, useToast } from './ui';
import { getOutbreakThreshold, setOutbreakThreshold } from '../lib/constants';

const GROUP_META: { key: string; title: string; subtitle: string }[] = [
  { key: 'sms', title: 'SMS gateway', subtitle: 'Reminder recalls (spec §22). Empty values fall back to the .env defaults — edits apply immediately, no restart.' },
  { key: 'whatsapp', title: 'WhatsApp', subtitle: 'channel=WHATSAPP reminders. Verify endpoints with your provider.' },
  { key: 'reminder', title: 'Auto reminder sweep', subtitle: 'Scheduled recalls for children due/overdue within the window — changes apply on the next run.' },
  { key: 'mail', title: 'Email (SMTP)', subtitle: 'Security alert emails (lockouts, license events, the daily digest) when a recipient is set. Edits apply immediately, no restart.' },
];

const SELECT_OPTIONS: Record<string, { value: string; label: string }[]> = {
  'sms.provider': [
    { value: '', label: 'Auto (infer from credentials)' },
    { value: 'off', label: 'Off (no SMS dispatch)' },
    { value: 'smsonlinegh', label: 'SMSOnlineGH' },
    { value: 'hubtel', label: 'Hubtel' },
    { value: 'twilio', label: 'Twilio' },
  ],
  'wa.provider': [
    { value: '', label: 'Disabled' },
    { value: 'hubtel', label: 'Hubtel' },
    { value: 'smsonlinegh', label: 'SMSOnlineGH' },
  ],
  'reminder.autoChannel': [
    { value: 'SMS', label: 'SMS' },
    { value: 'WHATSAPP', label: 'WhatsApp' },
    { value: 'BOTH', label: 'Both (SMS + WhatsApp)' },
  ],
  'reminder.enabled': [
    { value: 'true', label: 'Enabled' },
    { value: 'false', label: 'Disabled' },
  ],
};

export default function SystemSettings() {
  const toast = useToast();
  const [settings, setSettings] = useState<SystemSetting[] | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testingMail, setTestingMail] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await api<{ settings: SystemSetting[] }>('/admin/settings');
    setSettings(res.settings);
    setDraft({});
    setTestResult(null);
  }, []);

  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  const byKey = useMemo(() => new Map((settings ?? []).map((s) => [s.key, s])), [settings]);

  function setValue(key: string, v: string) {
    setDraft((d) => ({ ...d, [key]: v }));
  }

  function draftValue(key: string): string {
    const s = byKey.get(key);
    if (draft[key] !== undefined) return draft[key]!;
    return s?.secret ? '' : (s?.value ?? '');
  }

  async function save() {
    if (!settings) return;
    setSaving(true);
    try {
      const updates: { key: string; value: string }[] = [];
      for (const s of settings) {
        if (s.secret) {
          // Secrets are only sent when the admin types a replacement — an empty
          // field keeps the existing value.
          const v = draft[s.key] ?? '';
          if (v !== '') updates.push({ key: s.key, value: v });
        } else {
          // Untouched fields keep their current value; a typed (even empty)
          // value is a deliberate change that reverts to the env default.
          const v = draft[s.key] !== undefined ? draft[s.key]! : s.value;
          if (v !== s.value) updates.push({ key: s.key, value: v });
        }
      }
      if (updates.length === 0) {
        toast('No changes to save', 'info');
        return;
      }
      await api('/admin/settings', { method: 'PUT', body: { updates } });
      toast('Settings saved — active immediately', 'success');
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function resetCustom() {
    if (!settings) return;
    const custom = settings.filter((s) => s.source === 'custom');
    if (custom.length === 0) {
      toast('Nothing to reset — all settings use env defaults', 'info');
      return;
    }
    if (!window.confirm(`Reset ${custom.length} setting(s) to their .env defaults? Custom values will be cleared.`)) return;
    setSaving(true);
    try {
      await api('/admin/settings', { method: 'PUT', body: { updates: custom.map((s) => ({ key: s.key, value: '' })) } });
      toast('Custom settings cleared — env defaults restored', 'success');
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Reset failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function revertKey(key: string) {
    setSaving(true);
    try {
      await api('/admin/settings', { method: 'PUT', body: { updates: [{ key, value: '' }] } });
      toast('Reverted to the .env default', 'success');
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Revert failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function testSms() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api<{ provider: string; balance?: string; note: string }>('/admin/settings/test-sms', { method: 'POST', body: {} });
      setTestResult(res.balance !== undefined ? `${res.note} (${res.provider}, balance ${res.balance})` : `${res.note} (${res.provider})`);
      toast('Gateway test complete', 'success');
    } catch (err) {
      setTestResult(err instanceof Error ? err.message : 'Test failed');
    } finally {
      setTesting(false);
    }
  }

  async function testMail() {
    setTestingMail(true);
    setTestResult(null);
    try {
      const res = await api<{ dispatched: boolean; note: string }>('/admin/settings/test-mail', { method: 'POST', body: {} });
      setTestResult(res.dispatched ? `Email sent — ${res.note}` : `Not sent — ${res.note}`);
      toast(res.dispatched ? 'Test email dispatched' : 'Test email not sent', res.dispatched ? 'success' : 'info');
    } catch (err) {
      setTestResult(err instanceof Error ? err.message : 'Test failed');
    } finally {
      setTestingMail(false);
    }
  }

  if (!settings) {
    return (
      <div className="py-16">
        <Spinner label="Loading settings…" />
      </div>
    );
  }

  const renderField = (s: SystemSetting) => {
    const opts = SELECT_OPTIONS[s.key];
    const common = {
      id: `set-${s.key}`,
      value: opts ? (draft[s.key] ?? s.value) : draftValue(s.key),
      onChange: (e: { target: { value: string } }) => setValue(s.key, e.target.value),
    };
    return (
      <Field key={s.key} label={s.label} hint={s.description}>
        {opts ? (
          <Select {...common}>
            {opts.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        ) : s.secret ? (
          <div className="flex items-center gap-2">
            <Input {...common} type="password" placeholder={s.configured ? '••••••••  (keep existing)' : 'Not set'} autoComplete="new-password" />
            {s.configured && <Badge tone="navy">set</Badge>}
            {s.source === 'custom' && (
              <button
                type="button"
                onClick={() => void revertKey(s.key)}
                className="cursor-pointer text-xs font-bold text-g-red hover:underline"
                title="Delete the stored value — the .env default resumes"
              >
                revert
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Input {...common} placeholder={s.configured ? 'Enter value' : `Empty — uses $${s.env}`} />
            {s.source === 'custom' && <Badge tone="green">custom</Badge>}
            {s.source === 'env' && <Badge tone="gray">env</Badge>}
          </div>
        )}
      </Field>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-slate-500">
          System configuration lives in the database and overrides the .env defaults — API keys and gateway settings can be
          changed here at runtime. Secrets are masked and every change is audit-logged (never the values).
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => void resetCustom()}>Reset customised</Button>
          <Button size="sm" variant="navy" onClick={() => void testSms()} loading={testing}>Test SMS gateway</Button>
          <Button size="sm" variant="outline" onClick={() => void testMail()} loading={testingMail}>Test email</Button>
          <Button size="sm" variant="green" onClick={() => void save()} loading={saving}>Save changes</Button>
        </div>
      </div>

      {testResult && (
        <div className="rounded-lg border border-g-navy/20 bg-g-mist/60 px-4 py-2.5 font-mono text-xs text-g-ink">{testResult}</div>
      )}

      {GROUP_META.map((g) => {
        const items = settings.filter((s) => s.group === g.key);
        if (items.length === 0) return null;
        return (
          <Card key={g.key} title={g.title} subtitle={g.subtitle}>
            <div className="grid gap-4 md:grid-cols-2">{items.map(renderField)}</div>
          </Card>
        );
      })}

      {/* Client-side surveillance settings */}
      <Card title="Surveillance" subtitle="Outbreak alert threshold — minimum open cases of a single disease to trigger an outbreak warning across the app.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Outbreak threshold" hint="Number of open cases (1–100). Default is 3.">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={100}
                value={String(getOutbreakThreshold())}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isFinite(n) && n >= 1 && n <= 100) setOutbreakThreshold(n);
                }}
              />
              <Badge tone="navy">saved locally</Badge>
            </div>
          </Field>
        </div>
      </Card>

      <p className="text-xs text-slate-400">
        Reminder-job changes apply on the next scheduled run. Port, web origin and the JWT secret are not exposed here —
        they require a restart and are set via environment.
      </p>
    </div>
  );
}
