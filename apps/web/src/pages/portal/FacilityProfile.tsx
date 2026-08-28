import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import type { Facility } from '../../types';
import { Badge, Card, Icon, Spinner, Button } from '../../components/ui';
import { FACILITY_TYPE_LABELS, SERVICE_LABELS, titleCase } from '../../lib/format';

export default function FacilityProfile() {
  const { id } = useParams();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setFacility(null);
    setError(false);
    void api<Facility>(`/facilities/${id}`, { public: true }).then(setFacility).catch(() => setError(true));
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-lg font-bold text-g-ink">Facility not found</p>
        <Link to="/find-healthcare" className="mt-3 inline-block text-sm font-semibold text-g-red">← Back to directory</Link>
      </div>
    );
  }
  if (!facility) return <Spinner label="Loading facility profile…" />;

  const hours = Object.entries(facility.openingHours ?? {});
  const osmLink = facility.gpsLat && facility.gpsLng
    ? `https://www.openstreetmap.org/?mlat=${facility.gpsLat}&mlon=${facility.gpsLng}#map=15/${facility.gpsLat}/${facility.gpsLng}`
    : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link to="/find-healthcare" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-g-red">
        <Icon name="arrowRight" className="h-4 w-4 rotate-180" /> Back to directory
      </Link>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-g-navy px-6 py-8 text-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10">
                <Icon name="building" className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{facility.name.replace(' (DEMO)', '')}</h1>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-300">
                  <span>{FACILITY_TYPE_LABELS[facility.type] ?? titleCase(facility.type)}</span>
                  <span>·</span>
                  <span>{facility.district?.name}, {facility.region?.name}</span>
                  <Badge tone={facility.ownership === 'PRIVATE' || facility.ownership === 'NGO' ? 'gold' : 'navy'} className="border-white/20 bg-white/10">
                    {facility.ownership === 'PRIVATE' || facility.ownership === 'NGO' ? '💼 Private' : '🏛 Government'}
                  </Badge>
                  {facility.isSynthetic && <Badge tone="gold" className="border-white/20 bg-white/10 text-g-gold">DEMO</Badge>}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to="/login"><Button size="sm" className="bg-g-gold text-g-navy hover:bg-yellow-300">Book appointment</Button></Link>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card title="Services">
              <div className="flex flex-wrap gap-2">
                {facility.services.map((s) => (
                  <span key={s} className="rounded-lg bg-g-mist px-3 py-1.5 text-xs font-semibold text-g-ink">{SERVICE_LABELS[s] ?? titleCase(s)}</span>
                ))}
              </div>
            </Card>
            <Card title="Departments">
              <div className="flex flex-wrap gap-2">
                {(facility.departments ?? []).map((d) => (
                  <span key={d.id} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600">{d.name}</span>
                ))}
              </div>
            </Card>
            <Card title="Opening hours">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                {hours.map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs text-slate-400">{titleCase(k)}</dt>
                    <dd className="font-semibold text-g-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Contact">
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2.5"><Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-g-red" /><span className="text-slate-600">{facility.address ?? 'Address not available'}</span></li>
                <li className="flex items-center gap-2.5"><Icon name="phone" className="h-4 w-4 shrink-0 text-g-red" /><span className="text-slate-600">{facility.telephone ?? '—'}</span></li>
                {facility.email && <li className="flex items-center gap-2.5"><Icon name="mail" className="h-4 w-4 shrink-0 text-g-red" /><a href={`mailto:${facility.email}`} className="text-slate-600 hover:underline">{facility.email}</a></li>}
                {facility.website && <li className="flex items-center gap-2.5"><Icon name="globe" className="h-4 w-4 shrink-0 text-g-red" /><a href={facility.website} target="_blank" rel="noreferrer" className="text-g-red hover:underline">{facility.website}</a></li>}
              </ul>
            </Card>
            <Card title="Facility details">
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between"><dt className="text-slate-400">Level</dt><dd className="font-semibold">{facility.level ?? '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-400">Ownership</dt><dd className="font-semibold">{titleCase(facility.ownership)}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-400">Bed capacity</dt><dd className="font-semibold">{facility.bedCapacity ?? '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-400">Status</dt><dd><Badge tone={facility.operationalStatus === 'OPERATIONAL' ? 'green' : 'red'}>{titleCase(facility.operationalStatus)}</Badge></dd></div>
                <div className="flex justify-between"><dt className="text-slate-400">Accreditation</dt><dd className="font-semibold">{facility.accreditation ? titleCase(facility.accreditation) : '—'}</dd></div>
              </dl>
            </Card>
            {osmLink && (
              <a href={osmLink} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-g-navy transition hover:border-g-navy">
                <Icon name="pin" className="h-4 w-4" /> View on map (OpenStreetMap)
              </a>
            )}
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        Demo profile — facility data is synthetic and marked as such. Real availability is only shown when the facility provides current data.
      </p>
    </div>
  );
}
