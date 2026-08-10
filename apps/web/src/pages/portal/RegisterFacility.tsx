import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { api } from '../../lib/api';
import type { District, Region } from '../../types';
import { Button, Card, DemoBanner, EmptyState, Field, Input, Select, Textarea } from '../../components/ui';
import { Icon } from '../../components/icons';
import { FACILITY_TYPE_LABELS } from '../../lib/format';

const OWNERSHIPS = [
  { value: 'GOVERNMENT', label: 'Government' },
  { value: 'GHS', label: 'Ghana Health Service' },
  { value: 'MOH', label: 'Ministry of Health' },
  { value: 'CHAG_MISSION', label: 'CHAG / Mission' },
  { value: 'PRIVATE', label: 'Private' },
  { value: 'QUASI_GOVT', label: 'Quasi-government' },
  { value: 'NGO', label: 'NGO' },
  { value: 'OTHER', label: 'Other' },
];

const SERVICE_OPTIONS = ['OPD', 'EMERGENCY', 'MATERNITY', 'PAEDIATRICS', 'SURGERY', 'LABORATORY', 'PHARMACY', 'IMAGING', 'BLOOD_BANK', 'AMBULANCE', 'IMMUNIZATION', 'COMMUNITY_HEALTH', 'DENTAL', 'PHYSIOTHERAPY', 'TELEMEDICINE'];

export default function RegisterFacility() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [regionId, setRegionId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: '',
    ownership: '',
    address: '',
    telephone: '',
    email: '',
    contactName: '',
    reason: '',
    services: [] as string[],
  });

  useEffect(() => {
    void api<{ regions: Region[] }>('/geography/regions', { public: true }).then((r) => setRegions(r.regions)).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!regionId) { setDistricts([]); setDistrictId(''); return; }
    void api<{ districts: District[] }>(`/geography/districts?regionId=${regionId}`, { public: true }).then((r) => setDistricts(r.districts)).catch(() => undefined);
  }, [regionId]);

  const typeOptions = useMemo(() => Object.entries(FACILITY_TYPE_LABELS).map(([value, label]) => ({ value, label })), []);

  function toggleService(s: string) {
    setForm((f) => ({ ...f, services: f.services.includes(s) ? f.services.filter((x) => x !== s) : [...f.services, s] }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await api<{ application: { id: string }; message: string }>('/facilities/apply', {
        method: 'POST',
        public: true,
        body: { ...form, regionId, districtId },
      });
      setSubmittedId(res.application.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setBusy(false);
    }
  }

  if (submittedId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <EmptyState
          icon="check"
          title="Application submitted"
          message="Your facility application has been received and is awaiting national registry review. You will be contacted once a decision is made."
          action={<Button variant="navy" onClick={() => { setSubmittedId(null); setForm({ name: '', type: '', ownership: '', address: '', telephone: '', email: '', contactName: '', reason: '', services: [] }); setRegionId(''); setDistrictId(''); }}>Submit another</Button>}
        />
        <p className="mt-4 text-center font-mono text-[11px] text-slate-300">application id: {submittedId}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-g-navy text-white shadow-lg">
          <Icon name="building" className="h-7 w-7" />
        </div>
        <h1 className="text-3xl font-bold text-g-ink">Register your facility</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
          Join the national health facility registry. Applications are reviewed by national/regional health administrators before the facility is listed publicly.
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Field label="Facility name" hint="Official name as it should appear in the registry">
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Madina Family Clinic" />
              </Field>
            </div>
            <Field label="Facility type">
              <Select required value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="">Select type…</option>
                {typeOptions.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </Field>
            <Field label="Ownership">
              <Select required value={form.ownership} onChange={(e) => setForm({ ...form, ownership: e.target.value })}>
                <option value="">Select ownership…</option>
                {OWNERSHIPS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </Field>
            <Field label="Region">
              <Select required value={regionId} onChange={(e) => setRegionId(e.target.value)}>
                <option value="">Select region…</option>
                {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </Select>
            </Field>
            <Field label="District">
              <Select required value={districtId} onChange={(e) => setDistrictId(e.target.value)} disabled={!regionId}>
                <option value="">{regionId ? 'Select district…' : 'Choose region first'}</option>
                {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </Field>
            <div className="md:col-span-2">
              <Field label="Address">
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, area, community" />
              </Field>
            </div>
            <Field label="Telephone">
              <Input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} placeholder="e.g. 030-0000000" />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="facility@example.gh" />
            </Field>
            <div className="md:col-span-2">
              <Field label="Contact person" hint="Name of the person responsible for this application">
                <Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} placeholder="e.g. Dr. Jane Doe" />
              </Field>
            </div>
          </div>

          <Field label="Services offered">
            <div className="flex flex-wrap gap-1.5">
              {SERVICE_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleService(s)}
                  className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition ${form.services.includes(s) ? 'border-g-red bg-g-red text-white' : 'border-slate-300 bg-white text-slate-600 hover:border-g-red/50'}`}
                >
                  {s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Why should this facility join the registry?">
            <Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Community served, services gap addressed, accreditation status…" />
          </Field>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-g-red/20 bg-g-red/5 px-3 py-2.5 text-sm text-g-red">
              <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <Button type="submit" loading={busy} size="lg" className="w-full">Submit application</Button>
          <p className="text-center text-[11px] text-slate-400">Submissions create a PENDING application — no facility is published until approved.</p>
        </form>
      </Card>
      <div className="mt-6"><DemoBanner /></div>
    </div>
  );
}
