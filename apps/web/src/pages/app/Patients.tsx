import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import type { Patient, Page } from '../../types';
import { Badge, Card, EmptyState, Icon, Input, PageHeader, Spinner } from '../../components/ui';
import { ageFromDob, fmtDate } from '../../lib/format';

export default function Patients() {
  const [q, setQ] = useState('');
  const [data, setData] = useState<Page<Patient> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void api<Page<Patient>>('/patients', { query: { q, pageSize: '25' } })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [q]);

  function search(e: FormEvent) {
    e.preventDefault();
  }

  return (
    <div>
      <PageHeader
        title="Patient Registry"
        subtitle="Search the Master Patient Index by name, MRN, Ghana Card, NHIS or phone."
        action={
          <Link to="/app/register" className="inline-flex h-10 items-center gap-2 rounded-lg bg-g-red px-4 text-sm font-semibold text-white transition hover:bg-g-red-dark">
            <Icon name="plus" className="h-4 w-4" /> Register patient
          </Link>
        }
      />
      <form onSubmit={search} className="mb-5">
        <div className="relative">
          <Icon name="search" className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
          <Input className="pl-10" placeholder="Search name, GH-000001, Ghana Card, NHIS, phone…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </form>

      {loading ? (
        <Spinner label="Searching patient records…" />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon="users" title="No patients found" message="Try a different search, or register a new patient." action={<Link to="/app/register" className="text-sm font-semibold text-g-red hover:underline">Register patient →</Link>} />
      ) : (
        <Card pad={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-semibold">Patient</th>
                  <th className="px-5 py-3 font-semibold">MRN</th>
                  <th className="hidden px-5 py-3 font-semibold md:table-cell">Sex / Age</th>
                  <th className="hidden px-5 py-3 font-semibold lg:table-cell">Identifiers</th>
                  <th className="hidden px-5 py-3 font-semibold lg:table-cell">District</th>
                  <th className="hidden px-5 py-3 font-semibold xl:table-cell">Registered</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.items.map((p) => (
                  <tr key={p.id} className="transition hover:bg-g-mist/50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-g-navy/10 text-xs font-bold text-g-navy">
                          {p.fullName.split(' ').slice(0, 2).map((s) => s[0]).join('')}
                        </span>
                        <div>
                          <Link to={`/app/patients/${p.id}`} className="font-semibold text-g-ink hover:text-g-red hover:underline">{p.fullName}</Link>
                          <p className="text-xs text-slate-400">{p.phone ?? 'no phone'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-600">{p.mrn}</td>
                    <td className="hidden px-5 py-3.5 md:table-cell">{p.sex ?? '—'} · {ageFromDob(p.dateOfBirth)}</td>
                    <td className="hidden px-5 py-3.5 lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {p.ghanaCard && <Badge tone="navy">Ghana Card</Badge>}
                        {p.nhisNumber && <Badge tone="green">NHIS</Badge>}
                        {p.allergies.length > 0 && <Badge tone="red">Allergy</Badge>}
                        {!p.ghanaCard && !p.nhisNumber && p.allergies.length === 0 && <span className="text-xs text-slate-300">—</span>}
                      </div>
                    </td>
                    <td className="hidden px-5 py-3.5 lg:table-cell text-slate-500">{p.district?.name ?? '—'}</td>
                    <td className="hidden px-5 py-3.5 xl:table-cell text-slate-400">{fmtDate(p.createdAt)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <Link to={`/app/patients/${p.id}`} className="inline-flex items-center gap-1 text-xs font-bold text-g-red hover:underline">
                        Open <Icon name="arrowRight" className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
