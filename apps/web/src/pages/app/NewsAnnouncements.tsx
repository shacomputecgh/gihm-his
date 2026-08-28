import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Button, Card, PageHeader } from '../../components/ui';

interface Announcement {
  id: string; title: string; content: string; category: 'important' | 'general' | 'clinical' | 'hr' | 'safety';
  author: string; date: string; priority: 'high' | 'medium' | 'low'; read: boolean;
}

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: 'A001', title: 'New Hand Hygiene Protocol — Effective Immediately', content: 'All staff must complete hand hygiene audit training by May 31. New WHO 5 Moments posters have been placed in all departments. Contact Infection Control for queries.', category: 'safety', author: 'Infection Control Unit', date: '2026-05-23', priority: 'high', read: false },
  { id: 'A002', title: 'Staff Meeting — May 30, 2026', content: 'Monthly staff meeting scheduled for May 30 at 10:00 AM in the conference hall. Agenda: Q1 performance review, new facility policies, and staff welfare updates.', category: 'general', author: 'Hospital Administration', date: '2026-05-22', priority: 'medium', read: false },
  { id: 'A003', title: 'New CT Scanner Installation Complete', content: 'The new Siemens CT scanner has been installed in Radiology Room 2. Training sessions for radiographers will be conducted this week. Contact Radiology for scheduling.', category: 'clinical', author: 'Radiology Department', date: '2026-05-21', priority: 'medium', read: true },
  { id: 'A004', title: 'NHIS Tariff Update — June 2026', content: 'New NHIS tariffs effective June 1, 2026. Updated price lists have been circulated to all departments. Please ensure billing system is updated.', category: 'clinical', author: 'Finance Department', date: '2026-05-20', priority: 'high', read: true },
  { id: 'A005', title: 'Annual Health Screening for Staff', content: 'Annual health screening for all staff will be conducted June 5-7. Please register with HR. Screening includes blood pressure, blood sugar, HIV test, and general check-up.', category: 'hr', author: 'Human Resources', date: '2026-05-19', priority: 'medium', read: false },
  { id: 'A006', title: 'Power Outage Notice — June 2', content: 'Planned power outage on June 2 from 6:00 AM to 12:00 PM for generator maintenance. Backup power will be available for critical areas only. Plan accordingly.', category: 'important', author: 'Facility Management', date: '2026-05-18', priority: 'high', read: false },
  { id: 'A007', title: 'Congratulations — Dr. Mensah Awarded Best Doctor', content: 'Dr. Akua Mensah has been awarded Best Doctor of the Year by the Ghana Medical Association. Congratulations on this outstanding achievement!', category: 'general', author: 'Hospital Administration', date: '2026-05-17', priority: 'low', read: true },
];

export default function NewsAnnouncements() {
  const [filter, setFilter] = useState<string>('all');
  const unread = MOCK_ANNOUNCEMENTS.filter(a => !a.read).length;
  const filtered = MOCK_ANNOUNCEMENTS.filter(a => filter === 'all' || a.category === filter);
  const priorityConfig: Record<string, { label: string; color: string }> = { high: { label: 'Urgent', color: 'bg-red-100 text-red-700' }, medium: { label: 'Important', color: 'bg-amber-100 text-amber-700' }, low: { label: 'Info', color: 'bg-slate-100 text-slate-600' } };
  const categoryConfig: Record<string, { label: string; color: string }> = { important: { label: 'Important', color: 'bg-red-100 text-red-700' }, general: { label: 'General', color: 'bg-blue-100 text-blue-700' }, clinical: { label: 'Clinical', color: 'bg-green-100 text-green-700' }, hr: { label: 'HR', color: 'bg-purple-100 text-purple-700' }, safety: { label: 'Safety', color: 'bg-orange-100 text-orange-700' } };

  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<Record<string, string> | null>(null);
  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">
          {showAdd ? "\u2715 Cancel" : "+ Add New"}
        </button>
      </div>
      {showAdd && (
        <AddNewForm
          title="Add New Appointment"
          fields={[{"name": "patientName", "label": "Patient Name", "type": "text", "placeholder": "Patient name", "required": true}, {"name": "doctor", "label": "Doctor", "type": "text", "placeholder": "Doctor name", "required": true}, {"name": "date", "label": "Date", "type": "date", "required": true}, {"name": "time", "label": "Time", "type": "text", "placeholder": "e.g. 09:00 AM", "required": true}, {"name": "type", "label": "Type", "type": "select", "options": ["Consultation", "Follow-up", "Emergency", "Surgery"]}, {"name": "notes", "label": "Notes", "type": "textarea", "placeholder": "Additional notes"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="News & Announcements" subtitle="Facility updates, policy changes, and important notices" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-blue-600">{MOCK_ANNOUNCEMENTS.length}</div><div className="text-xs text-slate-500">Total</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-red-600">{unread}</div><div className="text-xs text-slate-500">Unread</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-amber-600">{MOCK_ANNOUNCEMENTS.filter(a => a.priority === 'high').length}</div><div className="text-xs text-slate-500">Urgent</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-green-600">{MOCK_ANNOUNCEMENTS.filter(a => a.read).length}</div><div className="text-xs text-slate-500">Read</div></Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {['all', 'important', 'general', 'clinical', 'hr', 'safety'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${filter === f ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{f === 'all' ? '📋 All' : categoryConfig[f]?.label ?? f}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(a => {
          const priCfg = priorityConfig[a.priority]!;
          const catCfg = categoryConfig[a.category]!;
          return (
            <Card key={a.id} className={`p-4 transition-all ${!a.read ? 'border-l-4 border-blue-500 bg-blue-50/30' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {!a.read && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                    <h3 className="font-bold text-sm text-slate-800">{a.title}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${priCfg.color}`}>{priCfg.label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${catCfg.color}`}>{catCfg.label}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">{a.content}</p>
                  <div className="mt-2 text-[10px] text-slate-400">📅 {a.date} · 👤 {a.author}</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Button className="bg-blue-600 hover:bg-blue-700">📝 Post New Announcement</Button>
    </div>
  );
}
