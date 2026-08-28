import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Card, PageHeader } from '../../components/ui';

export default function ServiceCharter() {
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
          title="Add New Service Charter Item"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="Service Charter" subtitle="Patient rights, responsibilities, and our commitment to quality care" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-bold text-lg text-blue-700 mb-3">👤 Your Rights as a Patient</h3>
          <div className="space-y-3 text-sm text-slate-700">
            {[
              { title: 'Right to Respect', desc: 'You will be treated with dignity, respect, and without discrimination regardless of race, religion, gender, or financial status.' },
              { title: 'Right to Information', desc: 'You have the right to receive clear information about your diagnosis, treatment options, risks, and costs.' },
              { title: 'Right to Consent', desc: 'You must give informed consent before any procedure. You can refuse treatment at any time.' },
              { title: 'Right to Privacy', desc: 'Your medical records and personal information are confidential and will only be shared with your consent or as required by law.' },
              { title: 'Right to Complain', desc: 'You have the right to lodge complaints about the quality of care without fear of retaliation.' },
              { title: 'Right to Second Opinion', desc: 'You may seek a second medical opinion from another qualified provider.' },
              { title: 'Right to Access Records', desc: 'You can request copies of your medical records at any time.' },
              { title: 'Right to Emergency Care', desc: 'Emergency treatment will be provided regardless of ability to pay. Payment can be arranged afterwards.' },
            ].map((r, i) => (
              <div key={i} className="rounded-lg bg-blue-50 p-3">
                <h4 className="font-bold text-xs text-blue-700">✅ {r.title}</h4>
                <p className="text-xs text-blue-600 mt-1">{r.desc}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-bold text-lg text-green-700 mb-3">🤝 Your Responsibilities</h3>
          <div className="space-y-3 text-sm text-slate-700">
            {[
              { title: 'Provide Accurate Information', desc: 'Give truthful and complete information about your medical history, symptoms, and medications.' },
              { title: 'Follow Treatment Plan', desc: 'Adhere to prescribed medications, follow-up appointments, and lifestyle modifications.' },
              { title: 'Respect Staff', desc: 'Treat all healthcare workers with respect. Violence and abuse will not be tolerated.' },
              { title: 'Keep Appointments', desc: 'Arrive on time for appointments. If you must cancel, give at least 24 hours notice.' },
              { title: 'Ask Questions', desc: 'Ask questions if you don\'t understand your treatment or condition. Your understanding matters.' },
              { title: 'Maintain Hygiene', desc: 'Practice good personal hygiene. Use hand sanitizer and follow infection control measures.' },
              { title: 'Pay for Services', desc: 'Settle bills promptly. If you have NHIS or insurance, present your card at registration.' },
              { title: 'Provide Feedback', desc: 'Share your experience to help us improve. Complete satisfaction surveys and use suggestion boxes.' },
            ].map((r, i) => (
              <div key={i} className="rounded-lg bg-green-50 p-3">
                <h4 className="font-bold text-xs text-green-700">📋 {r.title}</h4>
                <p className="text-xs text-green-600 mt-1">{r.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-bold text-lg text-purple-700 mb-3">🏆 Our Service Standards</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            { standard: 'Emergency Response', target: 'Within 15 minutes', icon: '🚑' },
            { standard: 'OPD Wait Time', target: 'Under 30 minutes', icon: '⏱️' },
            { standard: 'Lab Results', target: 'Within 24 hours', icon: '🧪' },
            { standard: 'Pharmacy Dispensing', target: 'Under 15 minutes', icon: '💊' },
            { standard: 'Billing Accuracy', target: '99% accuracy', icon: '💰' },
            { standard: 'Patient Satisfaction', target: 'Above 80%', icon: '⭐' },
          ].map((s, i) => (
            <div key={i} className="rounded-lg border p-3 text-center">
              <span className="text-2xl">{s.icon}</span>
              <h4 className="font-bold text-xs text-slate-700 mt-1">{s.standard}</h4>
              <p className="text-xs text-purple-600 font-bold">{s.target}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 text-center">
        <h3 className="font-bold text-lg text-slate-800 mb-2">📞 Complaints & Feedback</h3>
        <p className="text-sm text-slate-500">If you have a complaint or feedback, please contact:</p>
        <div className="mt-3 space-y-1 text-sm text-slate-700">
          <p>📧 Email: complaints@hospital.gov.gh</p>
          <p>📞 Phone: 030-XXX-XXXX</p>
          <p>📍 Patient Relations Office, Ground Floor</p>
          <p>📝 Suggestion boxes at all reception areas</p>
        </div>
        <div className="mt-4 text-xs text-slate-400">© 2026 GIHM-HIS — Developed by ShaComputeC · Hard Works Never Fail</div>
      </Card>
    </div>
  );
}
