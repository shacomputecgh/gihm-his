import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Card, PageHeader } from '../../components/ui';

type Tab = 'getting-started' | 'clinical' | 'operations' | 'pharmacy' | 'lab' | 'emergency' | 'billing' | 'settings' | 'api-setup' | 'videos';

interface Step {
  icon: string;
  title: string;
  description: string;
  details?: string[];
}

interface GuideSection {
  id: Tab;
  label: string;
  icon: string;
  color: string;
}

const TABS: GuideSection[] = [
  { id: 'getting-started', label: 'Getting Started', icon: '🚀', color: 'bg-blue-600' },
  { id: 'clinical', label: 'Clinical', icon: '🩺', color: 'bg-green-600' },
  { id: 'pharmacy', label: 'Pharmacy', icon: '💊', color: 'bg-purple-600' },
  { id: 'lab', label: 'Laboratory', icon: '🧪', color: 'bg-amber-600' },
  { id: 'emergency', label: 'Emergency', icon: '🚨', color: 'bg-red-600' },
  { id: 'billing', label: 'Billing', icon: '💰', color: 'bg-emerald-600' },
  { id: 'operations', label: 'Operations', icon: '⚙️', color: 'bg-slate-600' },
  { id: 'settings', label: 'Settings', icon: '🔧', color: 'bg-indigo-600' },
  { id: 'api-setup', label: 'API Setup', icon: '🔌', color: 'bg-cyan-600' },
  { id: 'videos', label: 'Video Tutorials', icon: '🎬', color: 'bg-rose-600' },
];

function StepCard({ step, index }: { step: Step; index: number }) {
  return (
    <div className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl">{step.icon}</div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">{index + 1}</span>
          <h4 className="font-bold text-slate-800">{step.title}</h4>
        </div>
        <p className="mt-1 text-sm text-slate-600">{step.description}</p>
        {step.details && (
          <ul className="mt-2 space-y-1">
            {step.details.map((d, i) => (
              <li key={i} className="flex gap-2 text-xs text-slate-500">
                <span className="text-green-500">✓</span>{d}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function VisualGuide({ title, emoji, steps }: { title: string; emoji: string; steps: Step[] }) {
  return (
    <div className="mb-6">
      <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-800">
        <span className="text-2xl">{emoji}</span> {title}
      </h3>
      <div className="space-y-3">
        {steps.map((step, i) => (
          <StepCard key={i} step={step} index={i} />
        ))}
      </div>
    </div>
  );
}

function VideoPlaceholder({ title, description, duration }: { title: string; description: string; duration: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50">
        <div className="text-center">
          <span className="text-5xl">🎬</span>
          <p className="mt-2 text-sm font-bold text-slate-600">{duration}</p>
        </div>
      </div>
      <div className="p-4">
        <h4 className="font-bold text-slate-800">{title}</h4>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
        <div className="mt-3 flex gap-2">
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Coming Soon</span>
        </div>
      </div>
    </div>
  );
}

export default function SystemGuide() {
  const [tab, setTab] = useState<Tab>('getting-started');

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Guide & Documentation"
        subtitle="Step-by-step instructions, visual guides, and video tutorials for every module in GIHM-HIS"
      />

      {/* Hero Card */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 p-8 text-white">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex-1">
            <h2 className="text-2xl font-extrabold">🏥 GIHM-HIS — Complete System Guide</h2>
            <p className="mt-2 text-sm text-blue-100">
              Everything you need to know about using Ghana's most comprehensive hospital management system.
              Developed by <strong>ShaComputeC</strong> · Hard Works Never Fail
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="gold">300+ Modules</Badge>
              <Badge tone="green">7 Languages</Badge>
              <Badge tone="navy">Offline-First</Badge>
              <Badge tone="blue">NHIS/Insurance</Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-white/10 p-4">
              <div className="text-3xl font-bold">300+</div>
              <div className="text-xs text-blue-200">Modules</div>
            </div>
            <div className="rounded-xl bg-white/10 p-4">
              <div className="text-3xl font-bold">7</div>
              <div className="text-xs text-blue-200">Languages</div>
            </div>
            <div className="rounded-xl bg-white/10 p-4">
              <div className="text-3xl font-bold">16</div>
              <div className="text-xs text-blue-200">Regions</div>
            </div>
            <div className="rounded-xl bg-white/10 p-4">
              <div className="text-3xl font-bold">24/7</div>
              <div className="text-xs text-blue-200">Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === t.id ? `${t.color} text-white shadow-md` : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">

        {/* === GETTING STARTED === */}
        {tab === 'getting-started' && (
          <div className="space-y-6">
            <VisualGuide title="First Time Setup" emoji="🚀" steps={[
              { icon: '1️⃣', title: 'Install the Desktop App (Windows)', description: 'Download the .exe installer from the purchase page or contact ShaComputeC.', details: ['Run GIHM-HIS-Setup.exe', 'Follow the installation wizard', 'Launch from Start Menu or Desktop shortcut'] },
              { icon: '2️⃣', title: 'OR Access via Web Browser', description: 'No installation needed — works on any device with a browser.', details: ['Open Chrome, Firefox, or Edge', 'Navigate to your hospital\'s GIHM-HIS URL', 'Add to home screen for PWA experience'] },
              { icon: '3️⃣', title: 'Login for the First Time', description: 'Use the demo credentials or your admin account.', details: ['Select Government or Private Hospital sector', 'Enter your email and password', 'Demo accounts: hospital@demo.gh / Demo@123', 'Click "Sign in"'] },
              { icon: '4️⃣', title: 'Activate Your License', description: 'After purchasing, enter your license key.', details: ['Go to Settings → License', 'Enter the license key sent to your email/SMS', 'Click "Activate" — instant activation', 'TRIAL badge shows 30 days remaining'] },
              { icon: '5️⃣', title: 'Configure Your Hospital', description: 'Set up your facility details and API connections.', details: ['Go to System Settings', 'Add your hospital name, logo, and address', 'Configure SMS, WhatsApp, and Email APIs', 'Set up Paystack for online payments'] },
              { icon: '6️⃣', title: 'Add Your Staff', description: 'Create accounts for doctors, nurses, pharmacists, and admins.', details: ['Go to Staff Management → Add Staff', 'Assign roles (Doctor, Nurse, Pharmacist, etc.)', 'Set departments and wards', 'Staff can login with their credentials'] },
            ]} />

            <VisualGuide title="Daily Workflow" emoji="📋" steps={[
              { icon: '🌅', title: 'Morning: Start the Day', description: 'Review overnight alerts and prepare for the day.', details: ['Check Dashboard for alerts and metrics', 'Review bed occupancy and ward status', 'Check pharmacy stock levels', 'Review today\'s appointments'] },
              { icon: '🏃', title: 'Patient Flow', description: 'Patients arrive and move through the system.', details: ['Register new patients or look up existing', 'Add to queue (OPD, Pharmacy, Lab)', 'Doctor examines and orders tests', 'Lab processes tests and returns results', 'Pharmacy dispenses medications', 'Bill is generated automatically'] },
              { icon: '🌙', title: 'End of Day', description: 'Close the day and prepare reports.', details: ['Review daily revenue and transactions', 'Check pending lab results', 'Review staff attendance', 'Run daily summary report', 'Verify backup completed'] },
            ]} />

            <Card title="💡 Essential Tips for Every User" className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  { icon: '🔍', text: 'Use Ctrl+K to open the search modal — find any module instantly' },
                  { icon: '🌐', text: 'Switch language from the top-right selector — Twi, Fante, Ga, Ewe available' },
                  { icon: '🌙', text: 'Enable dark mode for comfortable night shifts' },
                  { icon: '📤', text: 'Export any table to CSV or PDF using the export button' },
                  { icon: '🤖', text: 'Click the robot icon (bottom-right) to chat with Dr. August AI assistant' },
                  { icon: '📱', text: 'Works on phones — no app download needed, just open the browser' },
                ].map((tip, i) => (
                  <div key={i} className="flex gap-3 rounded-lg bg-white p-3 shadow-sm">
                    <span className="text-xl">{tip.icon}</span>
                    <span className="text-sm text-slate-700">{tip.text}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* === CLINICAL === */}
        {tab === 'clinical' && (
          <div className="space-y-6">
            <VisualGuide title="Patient Registration" emoji="👥" steps={[
              { icon: '📝', title: 'Register a New Patient', description: 'Every patient needs a unique Medical Record Number (MRN).', details: ['Click "Register Patient" in sidebar', 'Fill: Full Name, Date of Birth, Gender, Phone', 'Add Ghana Card number (if available)', 'Add NHIS number for insurance patients', 'Select Blood Group and Genotype', 'Add emergency contact information', 'System auto-generates MRN (e.g. MRN-0041)'] },
              { icon: '🔍', title: 'Search for Existing Patients', description: 'Find patients by name, MRN, Ghana Card, or phone number.', details: ['Go to Patients → Patient Registry', 'Type in the search bar', 'Results filter as you type', 'Click patient name to view full record', 'View: Demographics, Medical History, Visits'] },
              { icon: '📋', title: 'Patient Record Overview', description: 'The patient dashboard shows everything at a glance.', details: ['Demographics and contact info', 'Visit history with dates and doctors', 'Prescriptions (active and past)', 'Lab results with trends', 'Insurance and billing information', 'Documents and attachments'] },
            ]} />

            <VisualGuide title="Queue Management" emoji="📋" steps={[
              { icon: '🎫', title: 'Add Patient to Queue', description: 'Patients are added when they arrive at any department.', details: ['OPD: Auto-added on arrival', 'Laboratory: Added by doctor\'s order', 'Pharmacy: Added after prescription', 'Radiology: Added by imaging order', 'Emergency: Bypasses queue (direct triage)'] },
              { icon: '📊', title: 'Monitor Queue Status', description: 'Real-time queue dashboard shows waiting times.', details: ['View by department tab (OPD/Pharmacy/Lab/Imaging)', 'Color-coded priority (Red=Emergency, Yellow=Urgent)', 'Average wait time displayed', 'Refreshes every 15 seconds'] },
              { icon: '▶️', title: 'Call Next Patient', description: 'When a station is free, call the next patient.', details: ['Click "Start" on the next waiting patient', 'Status changes to "In Service"', 'Patient hears/see their ticket number', 'Click "Complete" when done'] },
            ]} />

            <VisualGuide title="Doctor's Workflow" emoji="🩺" steps={[
              { icon: '📅', title: 'View Appointments', description: 'See today\'s appointments and walk-in patients.', details: ['Go to Appointments module', 'Filter by date, doctor, or department', 'Click appointment to start consultation', 'View patient history before seeing them'] },
              { icon: '📝', title: 'Clinical Notes', description: 'Document the consultation and examination.', details: ['Go to Clinical Notes → Add Note', 'Enter history, examination findings', 'Select diagnosis (ICD-10 codes)', 'Add differential diagnoses'] },
              { icon: '💊', title: 'Write Prescriptions', description: 'Prescribe medications from the drug database.', details: ['Go to Pharmacy → Prescriptions', 'Click "New Prescription"', 'Search drug by name or category', 'Set dosage, frequency, duration', 'Add clinical notes for pharmacist', 'Prescription appears in pharmacy queue'] },
              { icon: '🧪', title: 'Order Lab Tests', description: 'Order laboratory tests electronically.', details: ['Go to Laboratory → Orders', 'Click "New Order"', 'Search test by name or category', 'Add clinical notes for lab', 'Select priority (Routine/Urgent/STAT)', 'Order appears in lab worklist'] },
            ]} />

            <VisualGuide title="Ward Management" emoji="🛏️" steps={[
              { icon: '📊', title: 'Bed Occupancy Dashboard', description: 'See all beds at a glance across all wards.', details: ['Go to Bed Management', 'Grid shows: 🟢 Available, 🔴 Occupied, 🟡 Reserved', 'Click ward tab to filter', 'Monitor occupancy percentage'] },
              { icon: '🏥', title: 'Admit Patient', description: 'Transfer a patient from OPD to inpatient ward.', details: ['Go to Admissions → New Admission', 'Select patient and ward', 'Assign bed number', 'Set admission type (Emergency/Elective/Referral)', 'Add admission diagnosis and notes'] },
              { icon: '🔄', title: 'Transfer Between Wards', description: 'Move patients between wards when needed.', details: ['Go to Ward Transfer', 'Select patient and target ward', 'Add transfer reason', 'System updates bed allocation automatically'] },
              { icon: '📤', title: 'Discharge Patient', description: 'Process patient discharge with summary.', details: ['Go to Discharge Summary', 'Complete discharge summary template', 'Add follow-up instructions', 'Print discharge letter for patient', 'Bed becomes available automatically'] },
            ]} />
          </div>
        )}

        {/* === PHARMACY === */}
        {tab === 'pharmacy' && (
          <div className="space-y-6">
            <VisualGuide title="Pharmacy Dispensing Workflow" emoji="💊" steps={[
              { icon: '📋', title: 'View Pending Prescriptions', description: 'Prescriptions from doctors appear in the pharmacy worklist.', details: ['Go to Pharmacy → Prescriptions tab', 'Filter: Active / All / Dispensed', 'Each prescription shows: Patient, Drug, Dosage, Qty', 'Priority badge shows urgency level'] },
              { icon: '🔍', title: 'Verify Prescription', description: 'Before dispensing, verify the prescription details.', details: ['Click on the prescription card', 'Review: Drug name, dosage, frequency', 'Check for allergies in patient record', 'Use Drug Interaction Checker if multiple drugs', 'Confirm with prescriber if any concerns'] },
              { icon: '📦', title: 'Dispense Medication', description: 'Issue medication to the patient.', details: ['Click "Dispense" button', 'Enter quantity dispensed', 'System checks: Is stock available? Expiry date?', 'FEFO enforced: Oldest batch dispensed first', 'Controlled drugs: Dual-witness required', 'Print prescription label with instructions'] },
              { icon: '📊', title: 'Track Inventory', description: 'Monitor drug stock levels and expiry dates.', details: ['Go to Pharmacy → Inventory tab', 'View: Total Drugs, Low Stock, Expiring Soon', 'Set minimum stock levels per drug', 'Automatic low-stock alerts', 'Batch tracking with expiry dates', 'Stock adjustment with reason codes'] },
            ]} />

            <VisualGuide title="Drug Database" emoji="📖" steps={[
              { icon: '🔎', title: 'Search the Drug Database', description: '194+ drugs with full information.', details: ['Go to Drug Database in Tools', 'Search by: Generic name, Brand name, Category', 'View: Indications, Dosage, Side effects', 'Check insurance coverage status', 'View NHIS pricing'] },
              { icon: '⚡', title: 'Drug Interaction Checker', description: 'Check for dangerous interactions before dispensing.', details: ['Go to Drug Interactions module', 'Select 2 or more drugs', 'System shows: Severe/Moderate/Mild interactions', 'Read clinical recommendations', 'Document in patient record'] },
              { icon: '📦', title: 'Procurement & Receiving', description: 'Manage drug purchases and stock receiving.', details: ['Go to Pharmacy → Procurement tab', 'Create purchase order to supplier', 'When delivery arrives: Create Goods Received Note', 'Verify: Quantity, Batch number, Expiry date', 'Stock updates automatically'] },
            ]} />
          </div>
        )}

        {/* === LABORATORY === */}
        {tab === 'lab' && (
          <div className="space-y-6">
            <VisualGuide title="Laboratory Workflow" emoji="🧪" steps={[
              { icon: '📋', title: 'View Pending Orders', description: 'Lab orders from doctors appear in the worklist.', details: ['Go to Laboratory module', 'Filter: Pending results / All orders', 'Each order shows: Test name, Patient, Ordered by', 'Priority badge: Routine / Urgent / STAT', 'Discipline badge: Haematology / Chemistry / etc.'] },
              { icon: '🩸', title: 'Sample Collection', description: 'Collect and label samples from patients.', details: ['Call patient to sample collection area', 'Verify patient identity (MRN + Name + Photo)', 'Collect sample (blood/urine/stool/etc.)', 'Label with barcode: Patient MRN + Test ID', 'Record collection time and phlebotomist'] },
              { icon: '🔬', title: 'Process Sample', description: 'Run tests on the analyzer or manual methods.', details: ['Log into analyzer interface', 'Load samples in correct sequence', 'Run test panel', 'Review results on analyzer screen', 'Enter results into GIHM-HIS'] },
              { icon: '✅', title: 'Verify & Release Results', description: 'Senior scientist verifies results before release.', details: ['Open the order in GIHM-HIS', 'Enter result value and reference range', 'Flag abnormal results (Low/High/Critical)', 'Check critical value alerts', 'Click "Verify & Release" to send to doctor', 'Results appear in patient record instantly'] },
            ]} />

            <VisualGuide title="Special Lab Sections" emoji="🔬" steps={[
              { icon: '🩸', title: 'Blood Bank', description: 'Manage blood products and transfusions.', details: ['Track: Whole Blood, Packed Cells, Plasma, Platelets', 'Blood grouping and crossmatching', 'Donor records and screening', 'Transfusion reactions reporting'] },
              { icon: '🧬', title: 'Microbiology', description: 'Culture, sensitivity, and organism identification.', details: ['Specimen processing and inoculation', 'Culture incubation tracking', 'Antibiotic sensitivity testing', 'Organism identification and reporting'] },
              { icon: '📊', title: 'Quality Control', description: 'Ensure lab accuracy with QC programs.', details: ['Daily QC sample testing', 'Levey-Jennings charts', 'Westgard rules violation alerts', 'QC documentation for audits'] },
            ]} />
          </div>
        )}

        {/* === EMERGENCY === */}
        {tab === 'emergency' && (
          <div className="space-y-6">
            <VisualGuide title="Emergency Department Workflow" emoji="🚨" steps={[
              { icon: '🚑', title: 'Patient Arrival & Triage', description: 'All emergency patients are triaged using ESI levels.', details: ['Patient arrives at Emergency', 'Triage nurse assigns ESI level (1-5)', 'ESI 1: Resuscitation (immediate)', 'ESI 2: Emergency (10 min)', 'ESI 3: Urgent (30 min)', 'ESI 4: Semi-Urgent (60 min)', 'ESI 5: Non-Urgent (120 min)'] },
              { icon: '🏥', title: 'Treatment & Monitoring', description: 'Monitor patients during treatment.', details: ['Assign bed (Resus/Treatment/Observation)', 'Record vital signs (BP, HR, Temp, SpO2, Pain)', 'Order tests and medications', 'Track wait time and status', 'Doctor reviews and treats'] },
              { icon: '📢', title: 'Emergency Alerts', description: 'Trigger Code alerts when needed.', details: ['Code Blue: Cardiac/Respiratory Arrest', 'Code Red: Fire Emergency', 'Code Black: Bomb Threat', 'Code Orange: Hazmat Incident', 'All staff receive instant notification', 'Alert is audit-logged'] },
              { icon: '📤', title: 'Disposition', description: 'Transfer, admit, or discharge from ED.', details: ['Discharge with follow-up instructions', 'Admit to ward (if bed available)', 'Transfer to another facility', 'AMA (Against Medical Advice) if patient leaves', 'Complete ED summary note'] },
            ]} />
          </div>
        )}

        {/* === BILLING === */}
        {tab === 'billing' && (
          <div className="space-y-6">
            <VisualGuide title="Billing & Payment Workflow" emoji="💰" steps={[
              { icon: '🧾', title: 'Generate Invoice', description: 'Bills are auto-generated from clinical modules.', details: ['Services auto-added from: OPD, Lab, Pharmacy, Theatre', 'Review itemized bill with patient', 'Apply discounts if approved', 'Add insurance coverage if applicable'] },
              { icon: '💳', title: 'Process Payment', description: 'Accept multiple payment methods.', details: ['Cash: Record amount and give receipt', 'NHIS: Process insurance claim automatically', 'Private Insurance: Submit claim', 'Mobile Money: Send MoMo request', 'Paystack: Online card payment', 'Credit: Set up payment plan'] },
              { icon: '📄', title: 'Issue Receipt', description: 'Generate and print PDF receipts.', details: ['Auto-generated receipt with hospital logo', 'Includes: Invoice #, Items, Total, Payment method', 'Faint watermark for security', 'Download as PDF or print directly', 'Copy sent to patient email/SMS'] },
              { icon: '📊', title: 'Financial Reports', description: 'Track revenue and financial performance.', details: ['Daily revenue summary', 'Payment method breakdown', 'Insurance vs cash ratio', 'Outstanding balances report', 'Department-wise revenue'] },
            ]} />

            <Card title="Paystack Online Payment Setup" className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <div className="space-y-3 text-sm">
                <p className="font-bold text-green-800">Accept card payments online from patients!</p>
                <ol className="space-y-2">
                  {['Go to System Settings → Payment → Paystack', 'Enter your Paystack Public Key (pk_live_...)', 'Enter your Secret Key (sk_live_...)', 'Test with the "Test Payment" button', 'Patients can pay via the Purchase page', 'Payments are auto-verified and receipts issued'].map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-[10px] font-bold text-green-600">{i + 1}</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </Card>
          </div>
        )}

        {/* === OPERATIONS === */}
        {tab === 'operations' && (
          <div className="space-y-6">
            <VisualGuide title="Inventory Management" emoji="📦" steps={[
              { icon: '📊', title: 'View Stock Levels', description: 'Monitor all hospital inventory in real-time.', details: ['Go to Stock & Inventory', 'View by category: Drugs, Consumables, Equipment', 'Color codes: Green=OK, Yellow=Low, Red=Critical', 'Sort by: Name, Quantity, Value, Expiry'] },
              { icon: '📥', title: 'Receive New Stock', description: 'Record incoming deliveries from suppliers.', details: ['Create Goods Received Note (GRN)', 'Verify: Quantity matches PO, Quality OK', 'Enter: Batch number, Expiry date, Location', 'System updates stock automatically', 'Print shelf labels'] },
              { icon: '📤', title: 'Issue to Departments', description: 'Dispense stock to hospital departments.', details: ['Create stock transfer note', 'Select source and destination', 'Enter quantity for each item', 'FEFO enforced for drug stock', 'Both departments confirm receipt'] },
            ]} />

            <VisualGuide title="Staff Time Book" emoji="⏰" steps={[
              { icon: '🕐', title: 'Clock In (Morning)', description: 'Staff record their arrival time.', details: ['Go to Staff Time Book', 'Click "Clock In" button', 'Biometric scan (if available) OR manual entry', 'System records exact time', 'Late arrivals are flagged'] },
              { icon: '🕑', title: 'Clock Out (Evening)', description: 'Staff record their departure time.', details: ['Click "Clock Out" button', 'System calculates hours worked', 'Overtime automatically calculated', 'Daily attendance report generated'] },
              { icon: '📊', title: 'View Attendance', description: 'Track staff attendance and punctuality.', details: ['Dashboard shows: On Duty, Clocked Out, Absent', 'Biometric scan count', 'Average clock-in time', 'Monthly attendance summary'] },
            ]} />
          </div>
        )}

        {/* === SETTINGS === */}
        {tab === 'settings' && (
          <div className="space-y-6">
            <VisualGuide title="System Settings Overview" emoji="⚙️" steps={[
              { icon: '🏥', title: 'Hospital Profile', description: 'Set up your hospital information.', details: ['Hospital name, address, phone, email', 'Upload hospital logo (shown on receipts and ID cards)', 'Set GPS coordinates for facility map', 'Choose sector: Government / Private / Mission'] },
              { icon: '🔐', title: 'User Management', description: 'Manage staff accounts and permissions.', details: ['Go to Staff Management', 'Add new staff with role assignment', 'Roles: Doctor, Nurse, Pharmacist, Lab, Admin, etc.', 'Each role has different permissions', 'Deactivate accounts for departing staff'] },
              { icon: '🔔', title: 'Notification Settings', description: 'Configure how the system sends alerts.', details: ['SMS: For appointment reminders, lab results', 'WhatsApp: For patient communications', 'Email: For reports and admin notifications', 'In-app: For staff alerts and system notifications'] },
            ]} />

            <Card title="🔐 Security Best Practices" className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
              <div className="space-y-2 text-sm">
                {[
                  '🔐 Change default passwords immediately after setup',
                  '🔑 Use strong passwords: 12+ characters with symbols',
                  '👥 Assign minimum necessary permissions per role',
                  '📝 Review audit trail weekly for suspicious activity',
                  '💾 Enable daily automatic backups',
                  '🔒 Lock workstation when stepping away',
                  '🚫 Never share login credentials between staff',
                ].map((tip, i) => (
                  <div key={i} className="flex gap-2 text-slate-700">{tip}</div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* === API SETUP === */}
        {tab === 'api-setup' && (
          <div className="space-y-6">
            <VisualGuide title="SMS API Setup (Hellio Messaging)" emoji="📱" steps={[
              { icon: '1️⃣', title: 'Create Hellio Account', description: 'Sign up at cloud.helliomessaging.com', details: ['Go to https://cloud.helliomessaging.com/dashboard', 'Create account with your email', 'Verify email and complete setup'] },
              { icon: '2️⃣', title: 'Get API Key', description: 'Copy your API key from the dashboard.', details: ['Navigate to API Settings', 'Copy the API key', 'Keep it secret — never share publicly'] },
              { icon: '3️⃣', title: 'Configure in GIHM-HIS', description: 'Enter the API key in system settings.', details: ['Go to System Settings → SMS', 'Select "Hellio Messaging" as provider', 'Paste your API key', 'Enter sender ID (if registered)', 'Click "Test SMS" to verify'] },
              { icon: '4️⃣', title: 'Test & Activate', description: 'Send a test SMS to verify it works.', details: ['Click "Send Test SMS"', 'Enter your phone number', 'Check your phone for the test message', 'If received: Configuration successful!', 'If not: Check API key and sender ID'] },
            ]} />

            <VisualGuide title="WhatsApp API Setup" emoji="💬" steps={[
              { icon: '1️⃣', title: 'Get WhatsApp Business API', description: 'Set up WhatsApp Business account.', details: ['Use WhatsApp Cloud API or a gateway provider', 'Verify your business with Meta', 'Get a permanent access token'] },
              { icon: '2️⃣', title: 'Configure in GIHM-HIS', description: 'Enter credentials in system settings.', details: ['Go to System Settings → WhatsApp', 'Enter Access Token', 'Enter Phone Number ID', 'Set webhook URL if needed', 'Click "Test WhatsApp"'] },
              { icon: '3️⃣', title: 'Enable Patient Messaging', description: 'Send lab results, appointments, and reminders via WhatsApp.', details: ['Enable in Notification Settings', 'Lab results auto-sent when verified', 'Appointment reminders sent 24h before', 'Prescription pickup notifications'] },
            ]} />

            <VisualGuide title="Email API Setup (SMTP)" emoji="📧" steps={[
              { icon: '1️⃣', title: 'Choose Email Provider', description: 'Use Gmail, Outlook, or custom SMTP.', details: ['Gmail: Use App Password (not regular password)', 'Outlook: Use OAuth2 or App Password', 'Custom: Enter SMTP host, port, credentials'] },
              { icon: '2️⃣', title: 'Configure SMTP Settings', description: 'Enter email configuration in GIHM-HIS.', details: ['Go to System Settings → Email', 'SMTP Host: smtp.gmail.com (for Gmail)', 'Port: 587 (TLS) or 465 (SSL)', 'Username: your email address', 'Password: App Password (16-character code)', 'From Name: Your Hospital Name'] },
              { icon: '3️⃣', title: 'Test Email Sending', description: 'Verify email configuration works.', details: ['Click "Send Test Email"', 'Enter your email address', 'Check inbox for test message', 'Check spam folder if not in inbox'] },
            ]} />

            <VisualGuide title="Paystack Payment Setup" emoji="💳" steps={[
              { icon: '1️⃣', title: 'Create Paystack Account', description: 'Sign up at paystack.com', details: ['Go to https://dashboard.paystack.com', 'Create business account', 'Complete KYC verification', 'Activate your account'] },
              { icon: '2️⃣', title: 'Get API Keys', description: 'Copy your live API keys.', details: ['Go to Settings → API Keys & Webhooks', 'Copy Public Key (pk_live_...)', 'Copy Secret Key (sk_live_...)', '⚠️ Never expose secret key publicly'] },
              { icon: '3️⃣', title: 'Configure in GIHM-HIS', description: 'Enter keys in system settings.', details: ['Go to System Settings → Payment', 'Select "Paystack"', 'Paste Public Key', 'Paste Secret Key', 'Click "Test Payment" to verify', 'Enable for patient payments'] },
            ]} />
          </div>
        )}

        {/* === VIDEOS === */}
        {tab === 'videos' && (
          <div className="space-y-6">
            <Card title="🎬 Video Tutorial Library" className="bg-gradient-to-r from-rose-50 to-pink-50 border-rose-200">
              <p className="text-sm text-slate-600">
                Step-by-step video tutorials for every module. Watch and learn at your own pace.
                Videos are being produced — check our YouTube channel for the latest.
              </p>
              <div className="mt-3 flex gap-3">
                <a href="https://www.youtube.com/@shacomputecgh" target="_blank" rel="noopener noreferrer"
                   className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 transition">
                  ▶️ YouTube Channel
                </a>
                <a href="https://whatsapp.com/channel/shacomputec" target="_blank" rel="noopener noreferrer"
                   className="rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700 transition">
                  💬 WhatsApp Channel
                </a>
              </div>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <VideoPlaceholder title="Getting Started" description="Complete setup guide — install, login, configure your hospital" duration="10 min" />
              <VideoPlaceholder title="Patient Registration" description="How to register patients, search records, manage MRN" duration="5 min" />
              <VideoPlaceholder title="Pharmacy Dispensing" description="Prescriptions, dispensing, inventory, drug database" duration="8 min" />
              <VideoPlaceholder title="Laboratory Workflow" description="Test orders, sample collection, results, verification" duration="8 min" />
              <VideoPlaceholder title="Emergency Triage" description="ESI levels, triage process, emergency alerts" duration="6 min" />
              <VideoPlaceholder title="Billing & Payments" description="Invoices, payments, NHIS claims, receipts" duration="7 min" />
              <VideoPlaceholder title="API Configuration" description="SMS, WhatsApp, Email, Paystack setup guides" duration="12 min" />
              <VideoPlaceholder title="System Settings" description="Hospital profile, user management, security" duration="5 min" />
              <VideoPlaceholder title="Reports & Analytics" description="Dashboard, reports, surveillance, DHIMS2" duration="6 min" />
            </div>

            <Card title="📱 Social Media Tutorials">
              <div className="grid gap-3 md:grid-cols-3">
                <a href="https://web.facebook.com/shacomputecgh" target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 transition hover:bg-blue-100">
                  <span className="text-3xl">📘</span>
                  <div>
                    <p className="font-bold text-blue-800">Facebook</p>
                    <p className="text-xs text-blue-600">@shacomputecgh</p>
                  </div>
                </a>
                <a href="https://www.youtube.com/@shacomputecgh" target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 transition hover:bg-red-100">
                  <span className="text-3xl">📺</span>
                  <div>
                    <p className="font-bold text-red-800">YouTube</p>
                    <p className="text-xs text-red-600">Tutorials & Demos</p>
                  </div>
                </a>
                <a href="https://whatsapp.com/channel/shacomputec" target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 transition hover:bg-green-100">
                  <span className="text-3xl">💬</span>
                  <div>
                    <p className="font-bold text-green-800">WhatsApp</p>
                    <p className="text-xs text-green-600">Updates & Tips</p>
                  </div>
                </a>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Quick Navigation */}
      <Card title="🔗 Quick Navigation" className="mt-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { to: '/app', icon: '🏠', label: 'Dashboard' },
            { to: '/app/pharmacy', icon: '💊', label: 'Pharmacy' },
            { to: '/app/lab', icon: '🧪', label: 'Laboratory' },
            { to: '/app/emergency-alerts', icon: '🚨', label: 'Emergency' },
            { to: '/app/billing', icon: '💰', label: 'Billing' },
            { to: '/app/system-settings', icon: '⚙️', label: 'Settings' },
            { to: '/app/drug-interactions', icon: '⚡', label: 'Drug Checker' },
            { to: '/app/dr-august', icon: '🤖', label: 'AI Assistant' },
          ].map((link) => (
            <Link key={link.to} to={link.to}
              className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-blue-300 hover:bg-blue-50">
              <span className="text-xl">{link.icon}</span>
              <span className="text-sm font-bold text-slate-800">{link.label}</span>
            </Link>
          ))}
        </div>
      </Card>

      {/* Footer */}
      <div className="mt-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-center text-white">
        <h3 className="text-lg font-bold">Developed by ShaComputeC</h3>
        <p className="text-sm text-blue-100">Hard Works Never Fail</p>
        <p className="mt-2 text-xs text-blue-200">📧 shacomputec@gmail.com · 📞 +233 530 941 750</p>
        <div className="mt-3 flex justify-center gap-4">
          <a href="https://web.facebook.com/shacomputecgh" target="_blank" className="text-blue-200 hover:text-white">Facebook</a>
          <a href="https://www.youtube.com/@shacomputecgh" target="_blank" className="text-blue-200 hover:text-white">YouTube</a>
          <a href="https://whatsapp.com/channel/shacomputec" target="_blank" className="text-blue-200 hover:text-white">WhatsApp</a>
        </div>
        <p className="mt-2 text-xs text-blue-300">© {new Date().getFullYear()} ShaComputeC · All rights reserved</p>
      </div>
    </div>
  );
}
