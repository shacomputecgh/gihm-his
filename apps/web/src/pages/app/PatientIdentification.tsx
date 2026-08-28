import { useState } from 'react';
import { Card, Badge } from '../../components/ui';

interface PatientID {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  altPhone: string;
  ghanaCard: string;
  nhisNumber: string;
  biometricEnrolled: boolean;
  fingerprintCount: number;
  facialScan: boolean;
  mrn: string;
  bloodGroup: string;
  allergies: string[];
  emergencyContact: string;
  emergencyPhone: string;
  address: string;
  region: string;
  district: string;
  facility: string;
  photoOnFile: boolean;
  verificationStatus: 'Verified' | 'Pending' | 'Expired' | 'Not Registered';
  lastVerification: string;
}

const SAMPLE: PatientID[] = [
  { id: 'PID-001', fullName: 'Kwame Mensah', dateOfBirth: '1975-03-12', gender: 'Male', phone: '+233201234567', altPhone: '+233245678901', ghanaCard: 'GHA-123456789-0', nhisNumber: 'NHIS-98765', biometricEnrolled: true, fingerprintCount: 10, facialScan: true, mrn: 'MRN-12345', bloodGroup: 'O+', allergies: ['Penicillin', 'Shellfish'], emergencyContact: 'Ama Mensah', emergencyPhone: '+233201234568', address: '123 Independence Ave', region: 'Greater Accra', district: 'Accra Metro', facility: 'Lister Private Hospital', photoOnFile: true, verificationStatus: 'Verified', lastVerification: '2026-08-20' },
  { id: 'PID-002', fullName: 'Ama Osei', dateOfBirth: '1990-07-22', gender: 'Female', phone: '+233245678901', altPhone: '', ghanaCard: 'GHA-876543210-1', nhisNumber: '', biometricEnrolled: true, fingerprintCount: 10, facialScan: true, mrn: 'MRN-12350', bloodGroup: 'A+', allergies: [], emergencyContact: 'Kofi Osei', emergencyPhone: '+233245678902', address: '45 Osu Oxford St', region: 'Greater Accra', district: 'Accra Metro', facility: 'Lister Private Hospital', photoOnFile: true, verificationStatus: 'Verified', lastVerification: '2026-08-22' },
  { id: 'PID-003', fullName: 'Kofi Asante', dateOfBirth: '1965-11-05', gender: 'Male', phone: '+233267890123', altPhone: '+233501234567', ghanaCard: 'GHA-112233445-2', nhisNumber: 'NHIS-54321', biometricEnrolled: false, fingerprintCount: 0, facialScan: false, mrn: 'MRN-12360', bloodGroup: 'B-', allergies: ['Aspirin', 'Iodine'], emergencyContact: 'Akua Asante', emergencyPhone: '+233267890124', address: '78 Kumasi High St', region: 'Ashanti', district: 'Kumasi Metro', facility: 'Komfo Anokye Teaching Hospital', photoOnFile: false, verificationStatus: 'Pending', lastVerification: '' },
  { id: 'PID-004', fullName: 'Akua Boateng', dateOfBirth: '2001-01-15', gender: 'Female', phone: '+233501234567', altPhone: '', ghanaCard: '', nhisNumber: '', biometricEnrolled: false, fingerprintCount: 0, facialScan: false, mrn: 'MRN-12370', bloodGroup: 'AB+', allergies: [], emergencyContact: 'Yaw Boateng', emergencyPhone: '+233501234568', address: '12 Cape Coast Rd', region: 'Central', district: 'Cape Coast Metro', facility: 'Lister Private Hospital', photoOnFile: false, verificationStatus: 'Not Registered', lastVerification: '' },
  { id: 'PID-005', fullName: 'Yaw Darko', dateOfBirth: '1958-09-30', gender: 'Male', phone: '+233278901234', altPhone: '', ghanaCard: 'GHA-998877665-3', nhisNumber: 'NHIS-13579', biometricEnrolled: true, fingerprintCount: 8, facialScan: true, mrn: 'MRN-12380', bloodGroup: 'O-', allergies: ['Sulfa drugs'], emergencyContact: 'Esi Darko', emergencyPhone: '+233278901235', address: '56 Tema Comm 7', region: 'Greater Accra', district: 'Tema Metro', facility: 'Lister Private Hospital', photoOnFile: true, verificationStatus: 'Verified', lastVerification: '2026-07-15' },
];

const STATUS_COLORS: Record<string, string> = { Verified: 'bg-green-100 text-green-800', Pending: 'bg-yellow-100 text-yellow-800', Expired: 'bg-red-100 text-red-800', 'Not Registered': 'bg-gray-100 text-gray-800' };

export default function PatientIdentification() {
  const [tab, setTab] = useState<'overview' | 'registry' | 'biometric' | 'nhis'>('overview');
  const [search, setSearch] = useState('');

  const filtered = search ? SAMPLE.filter(p => p.fullName.toLowerCase().includes(search.toLowerCase()) || p.ghanaCard.includes(search) || p.mrn.includes(search) || p.phone.includes(search)) : SAMPLE;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🪪 Patient Identification</h1>
          <p className="text-gray-600 mt-1">Ghana Card · Biometric verification · MRN management · NHIS</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Patients', value: SAMPLE.length, icon: '👥', color: 'text-blue-600' },
          { label: 'Verified', value: SAMPLE.filter(p => p.verificationStatus === 'Verified').length, icon: '✅', color: 'text-green-600' },
          { label: 'Biometric Enrolled', value: SAMPLE.filter(p => p.biometricEnrolled).length, icon: '🔐', color: 'text-purple-600' },
          { label: 'Not Registered', value: SAMPLE.filter(p => p.verificationStatus === 'Not Registered').length, icon: '⚠️', color: 'text-yellow-600' },
        ].map((s, i) => (
          <Card key={i} className="p-4"><div className="text-sm text-gray-500">{s.icon} {s.label}</div><div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div></Card>
        ))}
      </div>

      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {(['overview', 'registry', 'biometric', 'nhis'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${tab === t ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t === 'overview' ? '📊 Overview' : t === 'registry' ? '📋 Registry' : t === 'biometric' ? '🔐 Biometric' : '🏥 NHIS'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Verification Status</h3>
            <div className="space-y-3">
              {['Verified', 'Pending', 'Expired', 'Not Registered'].map(status => {
                const count = SAMPLE.filter(p => p.verificationStatus === status).length;
                const pct = SAMPLE.length > 0 ? (count / SAMPLE.length * 100) : 0;
                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1"><Badge className={STATUS_COLORS[status]}>{status}</Badge><span className="font-bold">{count} ({pct.toFixed(0)}%)</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${status === 'Verified' ? 'bg-green-500' : status === 'Pending' ? 'bg-yellow-500' : status === 'Expired' ? 'bg-red-500' : 'bg-gray-400'}`} style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Identification Methods</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg text-center"><div className="text-2xl font-bold text-blue-600">{SAMPLE.filter(p => p.ghanaCard).length}</div><div className="text-sm text-blue-800">Ghana Card</div></div>
                <div className="p-4 bg-purple-50 rounded-lg text-center"><div className="text-2xl font-bold text-purple-600">{SAMPLE.filter(p => p.biometricEnrolled).length}</div><div className="text-sm text-purple-800">Biometric</div></div>
                <div className="p-4 bg-green-50 rounded-lg text-center"><div className="text-2xl font-bold text-green-600">{SAMPLE.filter(p => p.nhisNumber).length}</div><div className="text-sm text-green-800">NHIS</div></div>
                <div className="p-4 bg-orange-50 rounded-lg text-center"><div className="text-2xl font-bold text-orange-600">{SAMPLE.filter(p => p.photoOnFile).length}</div><div className="text-sm text-orange-800">Photo on File</div></div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === 'registry' && (
        <div className="space-y-4">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, Ghana Card, MRN, or phone..." className="w-full border rounded-lg px-4 py-2" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(p => (
              <Card key={p.id} className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-gray-900">{p.fullName}</div>
                    <div className="text-sm text-gray-500">{p.gender} · {p.dateOfBirth}</div>
                  </div>
                  <Badge className={STATUS_COLORS[p.verificationStatus]}>{p.verificationStatus}</Badge>
                </div>
                <div className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">MRN:</span><span className="font-mono font-bold">{p.mrn}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Ghana Card:</span><span className="font-mono">{p.ghanaCard || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">NHIS:</span><span className="font-mono">{p.nhisNumber || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Blood:</span><span className="font-bold">{p.bloodGroup}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Phone:</span><span>{p.phone}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Region:</span><span>{p.region}</span></div>
                </div>
                {p.allergies.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">{p.allergies.map((a, i) => <span key={i} className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">⚠️ {a}</span>)}</div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === 'biometric' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Biometric Enrollment Status</h3>
            <div className="space-y-2">
              {SAMPLE.map(p => (
                <div key={p.id} className={`flex justify-between items-center p-3 rounded-lg ${p.biometricEnrolled ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <div><div className="font-medium">{p.fullName}</div><div className="text-xs text-gray-500">{p.mrn}</div></div>
                  <div className="text-right">
                    {p.biometricEnrolled ? (
                      <div className="text-sm text-green-700">🔐 {p.fingerprintCount} prints {p.facialScan ? '✓ Face' : ''}</div>
                    ) : (
                      <button onClick={() => {}} className="px-3 py-1 bg-blue-600 text-white rounded text-xs">Enroll</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Biometric Verification Methods</h3>
            <div className="space-y-3">
              {[
                { method: 'Fingerprint Scanner', icon: '👆', desc: '10-print enrollment with cross-matching', enrolled: SAMPLE.filter(p => p.fingerprintCount > 0).length },
                { method: 'Facial Recognition', icon: '📷', desc: 'Photo-based identity verification', enrolled: SAMPLE.filter(p => p.facialScan).length },
                { method: 'Ghana Card QR Scan', icon: '📱', desc: 'Scan QR code on Ghana Card for instant verification', enrolled: SAMPLE.filter(p => p.ghanaCard).length },
                { method: 'Voice Recognition', icon: '🎙️', desc: 'Voice print for phone-based verification', enrolled: 0 },
              ].map(m => (
                <div key={m.method} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div><div className="font-medium">{m.icon} {m.method}</div><div className="text-xs text-gray-500">{m.desc}</div></div>
                    <span className="font-bold text-blue-600">{m.enrolled}/{SAMPLE.length}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'nhis' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">NHIS Coverage</h3>
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-green-600">{SAMPLE.filter(p => p.nhisNumber).length}/{SAMPLE.length}</div>
              <div className="text-sm text-gray-500">Patients with NHIS coverage ({((SAMPLE.filter(p => p.nhisNumber).length / SAMPLE.length) * 100).toFixed(0)}%)</div>
            </div>
            <div className="space-y-2">
              {SAMPLE.map(p => (
                <div key={p.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">{p.fullName}</span>
                  {p.nhisNumber ? <Badge className="bg-green-100 text-green-800">{p.nhisNumber}</Badge> : <Badge className="bg-red-100 text-red-800">Not Enrolled</Badge>}
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Emergency Contacts</h3>
            <div className="space-y-2">
              {SAMPLE.map(p => (
                <div key={p.id} className="p-2 bg-gray-50 rounded">
                  <div className="text-sm font-medium">{p.fullName}</div>
                  <div className="text-xs text-gray-500">{p.emergencyContact} — {p.emergencyPhone}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
