import { useState } from 'react';
import { Badge, Button, Card, Input, useToast } from '../../components/ui';
import { printPDF, section, field, table, today, type PDFDocument } from '../../lib/pdfGenerator';

interface InfectionAudit {
  id: string; department: string; date: string; auditor: string;
  handHygieneCompliance: number; deviceInfections: { type: string; count: number; rate: number }[];
  haiCases: { type: string; count: number }[];
  antimicrobialUsage: { antibiotic: number; days: number; ddd: number }[];
  waterQuality: boolean; wasteSegregation: boolean;
  overallRating: string; actionItems: string[];
}

const INITIAL: InfectionAudit[] = [
  { id: 'ICA-001', department: 'ICU', date: '2026-08-25', auditor: 'Dr. Asante',
    handHygieneCompliance: 93, deviceInfections: [{ type: 'CAUTI', count: 2, rate: 8.5 }, { type: 'CLABSI', count: 1, rate: 3.2 }],
    haiCases: [{ type: 'VAP', count: 3 }, { type: 'SSI', count: 2 }],
    antimicrobialUsage: [{ antibiotic: 450, days: 320, ddd: 58.2 }],
    waterQuality: true, wasteSegregation: true, overallRating: 'Good',
    actionItems: ['Continue hand hygiene programme', 'Review ventilator bundle compliance'] },
  { id: 'ICA-002', department: 'Medical Ward', date: '2026-08-24', auditor: 'Nurse Esi',
    handHygieneCompliance: 78, deviceInfections: [{ type: 'CAUTI', count: 1, rate: 3.0 }],
    haiCases: [{ type: 'CDI', count: 2 }],
    antimicrobialUsage: [{ antibiotic: 380, days: 250, ddd: 42.1 }],
    waterQuality: false, wasteSegregation: true, overallRating: 'Needs Improvement',
    actionItems: ['Improve hand hygiene from 78% to 90%', 'Fix water quality issue', 'Implement antibiotic stewardship rounds'] },
];

const DEPARTMENTS = ['ICU', 'Medical Ward', 'Surgical Ward', 'Maternity', 'Emergency', 'Paediatric', 'Oncology'];
const RATINGS = ['Excellent', 'Good', 'Acceptable', 'Needs Improvement', 'Poor'];

export default function InfectionControlAudit() {
  const [audits] = useState<InfectionAudit[]>(INITIAL);
  const [showForm, setShowForm] = useState(false);
  const toast = useToast();
  const avgCompliance = Math.round(audits.reduce((s, a) => s + a.handHygieneCompliance, 0) / audits.length);
  const waterIssues = audits.filter((a) => !a.waterQuality).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Infection Control Audit</h1><p className="text-gray-500">HAI surveillance, device infection rates, antimicrobial usage, and compliance monitoring</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            const doc: PDFDocument = { title: 'INFECTION CONTROL AUDIT REPORT', subtitle: `Generated ${today()}`,
              content: audits.map((a) => section(`${a.department} — ${a.date}`,
                field('Hand Hygiene', `${a.handHygieneCompliance}%`) + field('Overall Rating', a.overallRating) +
                table(['HAI Type', 'Count'], a.haiCases.map((h) => [h.type, String(h.count)])) +
                field('Water Quality', a.waterQuality ? 'Pass' : 'FAIL') + field('Waste Segregation', a.wasteSegregation ? 'Pass' : 'FAIL')
              )).join(''),
              footer: `Generated on ${today()} · Greater Accra Regional Hospital`
            }; printPDF(doc);
          }}>🖨 Print Report</Button>
          <Button onClick={() => setShowForm(true)}>+ New Audit</Button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 text-center"><div className="text-xl font-bold text-blue-600">{audits.length}</div><div className="text-xs text-gray-500">Total Audits</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-green-600">{avgCompliance}%</div><div className="text-xs text-gray-500">Avg Hand Hygiene</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-red-600">{audits.reduce((s, a) => s + a.haiCases.reduce((ss, h) => ss + h.count, 0), 0)}</div><div className="text-xs text-gray-500">Total HAI Cases</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-orange-600">{waterIssues}</div><div className="text-xs text-gray-500">Water Quality Failures</div></Card>
      </div>
      <div className="space-y-4">
        {audits.map((a) => (
          <Card key={a.id} className={`p-4 ${!a.waterQuality ? 'border-orange-300' : ''}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">{a.department}</span>
                  <span className="text-sm text-gray-400">{a.date} · {a.auditor}</span>
                  <Badge tone={a.overallRating === 'Good' || a.overallRating === 'Excellent' ? 'green' : 'gold'}>{a.overallRating}</Badge>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 text-sm bg-gray-50 rounded-lg p-3 mb-3">
              <div><span className="text-gray-500 text-xs">Hand Hygiene</span><div className={`font-bold ${a.handHygieneCompliance >= 90 ? 'text-green-600' : 'text-orange-600'}`}>{a.handHygieneCompliance}%</div></div>
              <div><span className="text-gray-500 text-xs">Water Quality</span><div className="font-medium">{a.waterQuality ? '✅ Pass' : '❌ Fail'}</div></div>
              <div><span className="text-gray-500 text-xs">Waste Segregation</span><div className="font-medium">{a.wasteSegregation ? '✅ Pass' : '❌ Fail'}</div></div>
              <div><span className="text-gray-500 text-xs">HAI Cases</span><div className="font-medium">{a.haiCases.reduce((s, h) => s + h.count, 0)}</div></div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-red-50 rounded p-2 text-xs"><strong>Device Infections:</strong> {a.deviceInfections.map((d) => `${d.type}: ${d.count} (${d.rate}/1000 device-days)`).join(', ')}</div>
              <div className="bg-blue-50 rounded p-2 text-xs"><strong>Action Items:</strong> {a.actionItems.join('; ')}</div>
            </div>
          </Card>
        ))}
      </div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowForm(false)} className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm font-bold">✕</button>
            <h2 className="text-lg font-bold mb-4">New Infection Control Audit</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm mb-1">Department *</label><select className="w-full border rounded-lg p-2 text-sm">{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</select></div>
                <div><label className="block text-sm mb-1">Auditor *</label><Input placeholder="Your name" /></div>
                <div><label className="block text-sm mb-1">Hand Hygiene % *</label><Input type="number" min="0" max="100" /></div>
                <div><label className="block text-sm mb-1">Overall Rating *</label><select className="w-full border rounded-lg p-2 text-sm">{RATINGS.map((r) => <option key={r}>{r}</option>)}</select></div>
              </div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={() => { setShowForm(false); toast('Audit saved'); }}>Save Audit</Button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
