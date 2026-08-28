import { useState } from 'react';
import { Badge, Button, Card, useToast } from '../../components/ui';
import { printPDF, section, field, today, type PDFDocument } from '../../lib/pdfGenerator';

interface SurgicalChecklist {
  id: string; patientName: string; mrn: string; procedure: string;
  surgeon: string; anaesthetist: string; nurse: string;
  date: string; theatre: string;
  signIn: { done: boolean; time: string; by: string; items: Record<string, boolean> };
  timeOut: { done: boolean; time: string; by: string; items: Record<string, boolean> };
  signOut: { done: boolean; time: string; by: string; items: Record<string, boolean> };
  status: 'Not Started' | 'Sign-In Done' | 'Time-Out Done' | 'Completed';
}

const SIGN_IN_ITEMS = ['Patient identity confirmed', 'Site marked', 'Consent obtained', 'Anaesthesia safety check completed', 'Pulse oximeter on', 'Known allergies?', 'Airway risk assessed', 'Risk of blood loss > 500ml assessed'];
const TIME_OUT_ITEMS = ['Introduce team members', 'Patient name, procedure, incision site confirmed', 'Antibiotic prophylaxis given within 60 min', 'Anticipated critical events reviewed', 'Essential imaging displayed', 'Sterility confirmed', 'Equipment issues addressed'];
const SIGN_OUT_ITEMS = ['Procedure name confirmed', 'Instrument, swab, needle counts correct', 'Specimen labelled', 'Equipment problems noted', 'Key recovery concerns identified'];

const INITIAL: SurgicalChecklist[] = [
  { id: 'SC-001', patientName: 'Kwame Boateng', mrn: 'MRN-2026-040', procedure: 'Appendectomy (Lap)', surgeon: 'Dr. Boateng', anaesthetist: 'Dr. Frimpong', nurse: 'Nurse Ama', date: '2026-08-25', theatre: 'Theatre 1',
    signIn: { done: true, time: '07:55', by: 'Dr. Frimpong', items: { 'Patient identity confirmed': true, 'Site marked': true, 'Consent obtained': true, 'Anaesthesia safety check completed': true, 'Pulse oximeter on': true, 'Known allergies?': true, 'Airway risk assessed': true, 'Risk of blood loss > 500ml assessed': false } },
    timeOut: { done: true, time: '08:02', by: 'Dr. Boateng', items: { 'Introduce team members': true, 'Patient name, procedure, incision site confirmed': true, 'Antibiotic prophylaxis given within 60 min': true, 'Anticipated critical events reviewed': true, 'Essential imaging displayed': true, 'Sterility confirmed': true, 'Equipment issues addressed': true } },
    signOut: { done: false, time: '', by: '', items: {} },
    status: 'Time-Out Done' },
  { id: 'SC-002', patientName: 'Ama Darko', mrn: 'MRN-2026-041', procedure: 'Caesarean Section', surgeon: 'Dr. Afriyie', anaesthetist: 'Dr. Mensah', nurse: 'Nurse Efua', date: '2026-08-25', theatre: 'Theatre 2',
    signIn: { done: false, time: '', by: '', items: {} },
    timeOut: { done: false, time: '', by: '', items: {} },
    signOut: { done: false, time: '', by: '', items: {} },
    status: 'Not Started' },
];

const PHASES = [
  { key: 'signIn', label: 'Sign-In (Before Anaesthesia)', items: SIGN_IN_ITEMS },
  { key: 'timeOut', label: 'Time-Out (Before Incision)', items: TIME_OUT_ITEMS },
  { key: 'signOut', label: 'Sign-Out (Before Patient Leaves)', items: SIGN_OUT_ITEMS },
] as const;

export default function SurgicalSafetyChecklist() {
  const [checklists, setChecklists] = useState<SurgicalChecklist[]>(INITIAL);
  const [expanded, setExpanded] = useState<string | null>('SC-001');
  const toast = useToast();

  const toggleItem = (checkId: string, phase: string, item: string) => {
    setChecklists(checklists.map((cl) => {
      if (cl.id !== checkId) return cl;
      const p = (cl as any)[phase];
      return { ...cl, [phase]: { ...p, items: { ...p.items, [item]: !p.items[item] } } };
    }));
  };

  const completePhase = (checkId: string, phase: string) => {
    setChecklists(checklists.map((cl) => {
      if (cl.id !== checkId) return cl;
      const p = (cl as any)[phase];
      const updated = { ...cl, [phase]: { ...p, done: true, time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), by: 'Current User' } };
      if (phase === 'signIn') return { ...updated, status: 'Sign-In Done' as const };
      if (phase === 'timeOut') return { ...updated, status: 'Time-Out Done' as const };
      if (phase === 'signOut') return { ...updated, status: 'Completed' as const };
      return updated;
    }));
    toast(`${phase === 'signIn' ? 'Sign-In' : phase === 'timeOut' ? 'Time-Out' : 'Sign-Out'} completed`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">WHO Surgical Safety Checklist</h1><p className="text-gray-500">Sign-In → Time-Out → Sign-Out — Standardised surgical safety protocol</p></div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center"><div className="text-xl font-bold text-blue-600">{checklists.filter((c) => c.signIn.done).length}</div><div className="text-xs text-gray-500">Sign-Ins Done</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-yellow-600">{checklists.filter((c) => c.timeOut.done).length}</div><div className="text-xs text-gray-500">Time-Outs Done</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-green-600">{checklists.filter((c) => c.signOut.done).length}</div><div className="text-xs text-gray-500">Sign-Outs Done</div></Card>
      </div>
      <div className="space-y-4">
        {checklists.map((cl) => (
          <Card key={cl.id} className="p-4">
            <div className="flex items-start justify-between mb-3 cursor-pointer" onClick={() => setExpanded(expanded === cl.id ? null : cl.id)}>
              <div>
                <h3 className="font-semibold">{cl.patientName} — {cl.procedure}</h3>
                <p className="text-sm text-gray-500">{cl.theatre} · Surgeon: {cl.surgeon} · Anaesthesia: {cl.anaesthetist}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={cl.status === 'Completed' ? 'green' : cl.status === 'Time-Out Done' ? 'gold' : cl.status === 'Sign-In Done' ? 'blue' : 'gray'}>{cl.status}</Badge>
                <Button variant="outline" onClick={(e) => {
                  e.stopPropagation();
                  const doc: PDFDocument = {
                    title: 'WHO SURGICAL SAFETY CHECKLIST',
                    subtitle: `${cl.patientName} · ${cl.procedure} · ${cl.theatre} · ${cl.date}`,
                    content: 
                      section('Patient Information', field('Patient', `${cl.patientName} (${cl.mrn})`) + field('Procedure', cl.procedure) + field('Surgeon', cl.surgeon) + field('Anaesthetist', cl.anaesthetist) + field('Scrub Nurse', cl.nurse)) +
                      section('Sign-In (Before Anaesthesia)', SIGN_IN_ITEMS.map((item) => `<div>☐ ${item}</div>`).join('') + field('Time', cl.signIn.time || 'Pending') + field('By', cl.signIn.by || '')) +
                      section('Time-Out (Before Incision)', TIME_OUT_ITEMS.map((item) => `<div>☐ ${item}</div>`).join('') + field('Time', cl.timeOut.time || 'Pending') + field('By', cl.timeOut.by || '')) +
                      section('Sign-Out (Before Patient Leaves)', SIGN_OUT_ITEMS.map((item) => `<div>☐ ${item}</div>`).join('') + field('Time', cl.signOut.time || 'Pending') + field('By', cl.signOut.by || '')),
                    footer: `Generated on ${today()} · WHO Surgical Safety Checklist · Confidential`
                  };
                  printPDF(doc);
                }}>🖨</Button>
                <span className="text-lg">{expanded === cl.id ? '▼' : '▶'}</span>
              </div>
            </div>
            {expanded === cl.id && (
              <div className="space-y-4">
                {PHASES.map(({ key, label, items }) => {
                  const phase = cl[key];
                  const completedItems = Object.values(phase.items).filter(Boolean).length;
                  const progress = Math.round((completedItems / items.length) * 100);
                  return (
                    <div key={key} className={`border rounded-lg p-3 ${phase.done ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium flex items-center gap-2">
                          {phase.done ? '✅' : '⬜'} {label}
                          {phase.done && <span className="text-xs text-gray-400">— {phase.time} by {phase.by}</span>}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{completedItems}/{items.length}</span>
                          <div className="w-20 bg-gray-200 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${phase.done ? 'bg-green-500' : progress > 0 ? 'bg-blue-500' : 'bg-gray-300'}`} style={{ width: `${progress}%` }} /></div>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-1">
                        {items.map((item) => (
                          <label key={item} className="flex items-center gap-2 p-1.5 rounded cursor-pointer hover:bg-white text-sm">
                            <input type="checkbox" checked={Boolean(phase.items[item])} onChange={() => toggleItem(cl.id, key, item)} className="rounded" disabled={phase.done} />
                            <span className={phase.items[item] ? 'text-green-700' : 'text-gray-600'}>{item}</span>
                          </label>
                        ))}
                      </div>
                      {!phase.done && (
                        <div className="mt-2 text-right">
                          <Button onClick={() => completePhase(cl.id, key)} disabled={progress < items.length}>
                            Complete {key === 'signIn' ? 'Sign-In' : key === 'timeOut' ? 'Time-Out' : 'Sign-Out'}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
