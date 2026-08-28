import { useState } from 'react';
import { Card, Badge } from '../../components/ui';

interface Consent {
  id: string;
  patientName: string;
  mrn: string;
  consentType: 'Surgical' | 'Anaesthesia' | 'Blood Transfusion' | 'Research' | 'Imaging' | 'DNR' | 'Discharge' | 'General';
  description: string;
  date: string;
  signedBy: string;
  witnessBy: string;
  status: 'Pending' | 'Signed' | 'Refused' | 'Withdrawn';
  language: string;
  validUntil: string;
  notes: string;
}

const SAMPLE: Consent[] = [
  { id: 'CON-001', patientName: 'Kwame Mensah', mrn: 'MRN-12345', consentType: 'Surgical', description: 'Informed consent for Laparoscopic Cholecystectomy', date: '2026-08-25', signedBy: 'Kwame Mensah', witnessBy: 'Dr. Appiah', status: 'Signed', language: 'English', validUntil: '2026-09-25', notes: '' },
  { id: 'CON-002', patientName: 'Ama Osei', mrn: 'MRN-12350', consentType: 'Blood Transfusion', description: 'Consent for packed red blood cell transfusion (2 units)', date: '2026-08-25', signedBy: 'Ama Osei', witnessBy: 'Nurse Kumah', status: 'Signed', language: 'Twi', validUntil: '2026-08-26', notes: 'Patient understands risks including transfusion reaction' },
  { id: 'CON-003', patientName: 'Kofi Asante', mrn: 'MRN-12360', consentType: 'Anaesthesia', description: 'General anaesthesia consent for cardiac catheterisation', date: '2026-08-25', signedBy: '', witnessBy: '', status: 'Pending', language: 'English', validUntil: '', notes: '' },
  { id: 'CON-004', patientName: 'Akua Boateng', mrn: 'MRN-12370', consentType: 'Imaging', description: 'Consent for MRI scan with gadolinium contrast', date: '2026-08-24', signedBy: 'Akua Boateng', witnessBy: 'Dr. Kumah', status: 'Signed', language: 'English', validUntil: '2026-09-24', notes: 'Patient has no contraindications' },
  { id: 'CON-005', patientName: 'Yaw Darko', mrn: 'MRN-12380', consentType: 'DNR', description: 'Do Not Resuscitate order — patient decision', date: '2026-08-20', signedBy: 'Yaw Darko', witnessBy: 'Dr. Asantewaa', status: 'Signed', language: 'English', validUntil: '2027-08-20', notes: 'Patient of sound mind, decision documented' },
  { id: 'CON-006', patientName: 'Esi Kumah', mrn: 'MRN-12390', consentType: 'Research', description: 'Consent for clinical research study - Antimalarial Efficacy Trial', date: '2026-08-23', signedBy: '', witnessBy: '', status: 'Pending', language: 'Ewe', validUntil: '', notes: 'Requires interpreter for Ewe consent form' },
];

const TYPE_COLORS: Record<string, string> = { Surgical: 'bg-red-100 text-red-800', Anaesthesia: 'bg-purple-100 text-purple-800', 'Blood Transfusion': 'bg-orange-100 text-orange-800', Research: 'bg-blue-100 text-blue-800', Imaging: 'bg-teal-100 text-teal-800', DNR: 'bg-gray-800 text-white', Discharge: 'bg-green-100 text-green-800', General: 'bg-gray-100 text-gray-800' };
const STATUS_COLORS: Record<string, string> = { Pending: 'bg-yellow-100 text-yellow-800', Signed: 'bg-green-100 text-green-800', Refused: 'bg-red-100 text-red-800', Withdrawn: 'bg-gray-100 text-gray-800' };

export default function PatientConsent() {
  const [tab, setTab] = useState<'overview' | 'list' | 'templates'>('overview');
  const [showForm, setShowForm] = useState(false);
  const [signing, setSigning] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📝 Patient Consent</h1>
          <p className="text-gray-600 mt-1">Informed consent · E-signatures · Multi-language · DNR orders</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ New Consent</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Consent', value: SAMPLE.length, icon: '📝', color: 'text-blue-600' },
          { label: 'Signed', value: SAMPLE.filter(c => c.status === 'Signed').length, icon: '✅', color: 'text-green-600' },
          { label: 'Pending', value: SAMPLE.filter(c => c.status === 'Pending').length, icon: '⏳', color: 'text-yellow-600' },
          { label: 'DNR Orders', value: SAMPLE.filter(c => c.consentType === 'DNR').length, icon: '🚫', color: 'text-red-600' },
        ].map((s, i) => (
          <Card key={i} className="p-4"><div className="text-sm text-gray-500">{s.icon} {s.label}</div><div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div></Card>
        ))}
      </div>

      <div className="flex gap-2 border-b pb-2">
        {(['overview', 'list', 'templates'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t === 'overview' ? '📊 Overview' : t === 'list' ? '📋 All Consent' : '📄 Templates'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Consent by Type</h3>
            <div className="space-y-2">
              {Object.entries(SAMPLE.reduce<Record<string, number>>((a, c) => { a[c.consentType] = (a[c.consentType] || 0) + 1; return a; }, {})).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <Badge className={TYPE_COLORS[type]}>{type}</Badge><span className="font-bold">{count}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Pending Action Required</h3>
            <div className="space-y-2">
              {SAMPLE.filter(c => c.status === 'Pending').map(c => (
                <div key={c.id} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="font-medium text-yellow-800">{c.patientName} — {c.consentType}</div>
                  <div className="text-sm text-yellow-600 mt-1">{c.description}</div>
                  <div className="text-xs text-gray-500 mt-1">Language: {c.language}</div>
                  <button onClick={() => setSigning(c.id)} className="mt-2 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">✍️ Get E-Signature</button>
                </div>
              ))}
              {SAMPLE.filter(c => c.status === 'Pending').length === 0 && <div className="text-center py-4 text-gray-500">No pending consents</div>}
            </div>
          </Card>
        </div>
      )}

      {tab === 'list' && (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Patient</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">Language</th>
                <th className="px-4 py-3 text-left">Signed By</th>
                <th className="px-4 py-3 text-left">Witness</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE.map(c => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{c.id}</td>
                  <td className="px-4 py-3"><div className="font-medium">{c.patientName}</div><div className="text-xs text-gray-500">{c.mrn}</div></td>
                  <td className="px-4 py-3"><Badge className={TYPE_COLORS[c.consentType]}>{c.consentType}</Badge></td>
                  <td className="px-4 py-3 text-sm max-w-[200px] truncate">{c.description}</td>
                  <td className="px-4 py-3">{c.language}</td>
                  <td className="px-4 py-3">{c.signedBy || '—'}</td>
                  <td className="px-4 py-3">{c.witnessBy || '—'}</td>
                  <td className="px-4 py-3"><Badge className={STATUS_COLORS[c.status]}>{c.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <Card key={type} className="p-5">
              <Badge className={color}>{type}</Badge>
              <h4 className="font-bold text-gray-900 mt-3">{type} Consent</h4>
              <p className="text-sm text-gray-600 mt-1">Standard {type.toLowerCase()} consent form with risk disclosure, patient rights, and witness section.</p>
              <div className="mt-3 space-y-1 text-xs text-gray-500">
                <div>✅ Multi-language support</div>
                <div>✍️ E-signature capture</div>
                <div>👁️ Witness verification</div>
                <div>📄 PDF export</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* E-Signature Modal */}
      {(signing || showForm) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{signing ? '✍️ E-Signature Capture' : '📝 New Consent Form'}</h3>
              <button onClick={() => { setSigning(null); setShowForm(false); }} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
            </div>
            {signing ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="font-medium">{SAMPLE.find(c => c.id === signing)?.description}</div>
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <div className="text-gray-400 mb-2">✍️</div>
                  <div className="text-sm text-gray-500">Sign here with finger or mouse</div>
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <input type="text" placeholder="Patient Full Name" className="w-full border rounded-lg px-3 py-2 mb-2" />
                    <input type="date" className="w-full border rounded-lg px-3 py-2" />
                  </div>
                </div>
                <button onClick={() => { setSigning(null); }} className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold">Confirm & Sign</button>
              </div>
            ) : (
              <div className="space-y-4">
                <div><label className="block text-sm font-medium mb-1">Patient Name</label><input type="text" className="w-full border rounded-lg px-3 py-2" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1">Consent Type</label><select className="w-full border rounded-lg px-3 py-2"><option>Surgical</option><option>Anaesthesia</option><option>Blood Transfusion</option><option>Research</option><option>Imaging</option><option>DNR</option><option>Discharge</option><option>General</option></select></div>
                  <div><label className="block text-sm font-medium mb-1">Language</label><select className="w-full border rounded-lg px-3 py-2"><option>English</option><option>Twi</option><option>Ewe</option><option>Ga</option><option>Fante</option><option>Hausa</option><option>Dagbani</option></select></div>
                </div>
                <div><label className="block text-sm font-medium mb-1">Description</label><textarea className="w-full border rounded-lg px-3 py-2" rows={3} /></div>
                <button onClick={() => setShowForm(false)} className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create Consent</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
