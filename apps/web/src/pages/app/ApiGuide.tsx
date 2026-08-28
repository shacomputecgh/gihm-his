import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Card, Icon, PageHeader } from '../../components/ui';

interface GuideSection {
  id: string;
  title: string;
  icon: string;
  provider: string;
  category: 'sms' | 'payment' | 'email' | 'whatsapp' | 'other';
  steps: string[];
  tips: string[];
  envVars: { key: string; description: string; required: boolean }[];
}

const GUIDES: GuideSection[] = [
  {
    id: 'paystack',
    title: 'Paystack (Online Payments)',
    icon: '💳',
    provider: 'Paystack',
    category: 'payment',
    steps: [
      'Go to https://paystack.com and create an account or log in.',
      'Navigate to Settings → API Keys & Webhooks.',
      'Copy your Test Key (starts with pk_test_) and Secret Key (starts with sk_test_).',
      'For live payments, switch to Live mode and copy your Live keys (pk_live_, sk_live_).',
      'In GIHM-HIS, go to Settings → API Config → Payments.',
      'Select "Paystack" as the payment provider.',
      'Paste your Public Key (pk_) and Secret Key (sk_).',
      'Set the environment to "Test" or "Live".',
      'Configure the webhook URL: https://your-domain.com/api/v1/payments/paystack/webhook.',
      'Click "Test Connection" to verify the integration.',
      'For GoCardless integration, follow the same steps at gocardless.com.',
    ],
    tips: [
      'Always test with test keys first before going live.',
      'Webhook URL must be publicly accessible for live mode.',
      'Paystack charges 1.5% + GH₵0.70 per transaction in Ghana.',
      'Keep your secret key secure — never expose it in client-side code.',
    ],
    envVars: [
      { key: 'PAYMENT_PAYSTACK_PUBLIC_KEY', description: 'Paystack public key (pk_live_...)', required: true },
      { key: 'PAYMENT_PAYSTACK_SECRET_KEY', description: 'Paystack secret key (sk_live_...)', required: true },
      { key: 'PAYMENT_PAYSTACK_WEBHOOK_SECRET', description: 'Webhook signing secret for verifying callbacks', required: false },
    ],
  },
  {
    id: 'momo',
    title: 'Mobile Money (MoMo)',
    icon: '📱',
    provider: 'MTN MoMo / Hubtel',
    category: 'payment',
    steps: [
      'Register for MTN Mobile Money API at https://momodeveloper.mtn.com.',
      'Create a sandbox or production account.',
      'Get your API User ID, API Key, and Subscription Key.',
      'Alternatively, use Hubtel (https://smsc.hubtel.com) for aggregated MoMo.',
      'In GIHM-HIS, go to Settings → API Config → Payments.',
      'Select "Mobile Money" as the payment method.',
      'Enter the provider (MTN, Vodafone, AirtelTigo).',
      'Paste your API credentials.',
      'Set the callback URL for payment confirmations.',
      'Test with a small amount (GH₵1) before going live.',
      'Configure the collection and disbursement endpoints.',
    ],
    tips: [
      'MTN MoMo charges per transaction — check current rates.',
      'Sandbox mode is free for testing.',
      'Always verify payment status via API, not just callback.',
      'Keep transaction IDs for reconciliation.',
    ],
    envVars: [
      { key: 'MOMO_API_USER', description: 'MTN MoMo API User ID', required: true },
      { key: 'MOMO_API_KEY', description: 'MTN MoMo API Key', required: true },
      { key: 'MOMO_SUBSCRIPTION_KEY', description: 'MTN MoMo Subscription Key', required: true },
      { key: 'MOMO_ENVIRONMENT', description: 'sandbox or production', required: true },
    ],
  },
  {
    id: 'sms-online',
    title: 'SMS (SMSOnlineGH)',
    icon: '💬',
    provider: 'SMSOnlineGH',
    category: 'sms',
    steps: [
      'Go to https://smsonlinegh.com and create an account.',
      'Navigate to API Settings in your dashboard.',
      'Copy your API Key.',
      'Register a sender ID (e.g., "GIHM-HIS") — this is what appears as the sender.',
      'In GIHM-HIS, go to Settings → SMS.',
      'Select "SMSOnlineGH" as the SMS provider.',
      'Paste your API Key.',
      'Enter your registered Sender ID.',
      'Set the endpoint to v5: https://api.smsonlinegh.com/v5/message/sms/send.',
      'Click "Test SMS" to send a test message.',
      'Monitor delivery reports in the API dashboard.',
    ],
    tips: [
      'SMSOnlineGH charges per SMS — buy credits first.',
      'Sender ID registration takes 1-2 business days.',
      'Keep messages under 160 characters for single SMS.',
      'Use for appointment reminders, lab results, and alerts.',
    ],
    envVars: [
      { key: 'SMS_PROVIDER', description: 'smsonlinegh', required: true },
      { key: 'SMSONLINEGH_API_KEY', description: 'SMSOnlineGH API key', required: true },
      { key: 'SMSONLINEGH_SENDER_ID', description: 'Registered sender ID', required: true },
      { key: 'SMSONLINEGH_URL', description: 'API endpoint (default v5)', required: false },
    ],
  },
  {
    id: 'sms-hubtel',
    title: 'SMS (Hubtel)',
    icon: '💬',
    provider: 'Hubtel',
    category: 'sms',
    steps: [
      'Go to https://smsc.hubtel.com and create an account.',
      'Navigate to My Account → API Keys.',
      'Copy your Client ID and Client Secret.',
      'Register a sender name in the SMS section.',
      'In GIHM-HIS, go to Settings → SMS.',
      'Select "Hubtel" as the SMS provider.',
      'Paste your Client ID and Client Secret.',
      'Enter your registered sender name.',
      'Click "Test SMS" to verify.',
    ],
    tips: [
      'Hubtel supports Ghana and international SMS.',
      'Pricing varies by destination.',
      'Client Secret is confidential — never share it.',
    ],
    envVars: [
      { key: 'HUBTEL_CLIENT_ID', description: 'Hubtel API Client ID', required: true },
      { key: 'HUBTEL_CLIENT_SECRET', description: 'Hubtel API Client Secret', required: true },
      { key: 'HUBTEL_SENDER_ID', description: 'Registered sender name', required: true },
    ],
  },
  {
    id: 'sms-twilio',
    title: 'SMS (Twilio)',
    icon: '💬',
    provider: 'Twilio',
    category: 'sms',
    steps: [
      'Go to https://www.twilio.com and create an account.',
      'Navigate to Console → Account Info.',
      'Copy your Account SID and Auth Token.',
      'Buy a phone number or use the trial number.',
      'In GIHM-HIS, go to Settings → SMS.',
      'Select "Twilio" as the SMS provider.',
      'Paste your Account SID and Auth Token.',
      'Enter the Twilio phone number (E.164 format: +1234567890).',
      'Click "Test SMS" to verify.',
    ],
    tips: [
      'Twilio trial accounts can only send to verified numbers.',
      'International SMS rates vary by country.',
      'Use Twilio for reliable global delivery.',
    ],
    envVars: [
      { key: 'TWILIO_ACCOUNT_SID', description: 'Twilio Account SID', required: true },
      { key: 'TWILIO_AUTH_TOKEN', description: 'Twilio Auth Token', required: true },
      { key: 'TWILIO_PHONE_NUMBER', description: 'Twilio sending number (E.164)', required: true },
    ],
  },
  {
    id: 'whatsapp-hubtel',
    title: 'WhatsApp (Hubtel)',
    icon: '📱',
    provider: 'Hubtel WhatsApp',
    category: 'whatsapp',
    steps: [
      'Go to https://smsc.hubtel.com and log in.',
      'Navigate to WhatsApp in the left sidebar.',
      'Set up your WhatsApp Business account.',
      'Get your WhatsApp API credentials from Hubtel.',
      'In GIHM-HIS, go to Settings → WhatsApp.',
      'Select "Hubtel" as the WhatsApp provider.',
      'Paste your Client ID and Client Secret.',
      'Enter the WhatsApp sender number.',
      'Configure the message templates for reminders.',
      'Test by sending a WhatsApp message.',
    ],
    tips: [
      'WhatsApp Business API requires Meta approval.',
      'Template messages must be pre-approved.',
      'Great for appointment reminders and follow-ups.',
    ],
    envVars: [
      { key: 'WHATSAPP_PROVIDER', description: 'hubtel', required: true },
      { key: 'HUBTEL_WHATSAPP_CLIENT_ID', description: 'Hubtel WhatsApp Client ID', required: true },
      { key: 'HUBTEL_WHATSAPP_CLIENT_SECRET', description: 'Hubtel WhatsApp Client Secret', required: true },
      { key: 'HUBTEL_WHATSAPP_SENDER', description: 'WhatsApp sender number', required: true },
    ],
  },
  {
    id: 'email-smtp',
    title: 'Email (SMTP)',
    icon: '✉️',
    provider: 'SMTP / Gmail / Outlook',
    category: 'email',
    steps: [
      'Choose an email provider (Gmail, Outlook, or custom SMTP).',
      'For Gmail: Enable 2FA and create an App Password at https://myaccount.google.com/apppasswords.',
      'For Outlook: Use your Microsoft 365 credentials or create an app password.',
      'In GIHM-HIS, go to Settings → Email.',
      'Enter the SMTP host (e.g., smtp.gmail.com for Gmail).',
      'Enter the port (587 for STARTTLS, 465 for TLS).',
      'Enter your email address as the username.',
      'Enter your app password (NOT your regular password).',
      'Set the "From" address for outgoing emails.',
      'Click "Test Email" to send a test message.',
      'Check your inbox (and spam folder) for the test email.',
    ],
    tips: [
      'Never use your regular email password — always use app passwords.',
      'Gmail limits: 500 emails/day for free accounts.',
      'Outlook limits: 10,000 recipients/day for Microsoft 365.',
      'Use email for reports, invoices, and formal communications.',
    ],
    envVars: [
      { key: 'MAIL_HOST', description: 'SMTP server host', required: true },
      { key: 'MAIL_PORT', description: 'SMTP port (587 or 465)', required: true },
      { key: 'MAIL_SECURE', description: 'Use TLS (true for 465, false for 587)', required: false },
      { key: 'MAIL_USER', description: 'SMTP username / email', required: true },
      { key: 'MAIL_PASS', description: 'SMTP password / app password', required: true },
      { key: 'MAIL_FROM', description: 'Sender email address', required: true },
    ],
  },
  {
    id: 'hellio-messaging',
    title: 'Hellio Messaging (Developer)',
    icon: '⚡',
    provider: 'Hellio Messaging',
    category: 'sms',
    steps: [
      'This is the developer-level messaging gateway.',
      'API Key: 6SKXQNB6ESYQZFYBAW4UG2AROUJC547S',
      'Dashboard: https://cloud.helliomessaging.com/dashboard',
      'This key is pre-configured in the Developer Console.',
      'Admin users cannot modify developer credentials.',
      'Used for: Security alerts, system notifications, developer communications.',
      'Admins should set up their own SMS/WhatsApp gateway in Settings.',
    ],
    tips: [
      'Developer credentials are locked and cannot be changed by admins.',
      'Contact ShaComputeC for developer-level integrations.',
      'Email: shacomputec@gmail.com | Phone: +233 530 941 750',
    ],
    envVars: [
      { key: 'HELLIO_API_KEY', description: 'Hellio Messaging API key (developer only)', required: true },
    ],
  },
];

const CATEGORY_COLORS = {
  sms: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  payment: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  email: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  whatsapp: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  other: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
};

export default function ApiGuide() {
  const [activeGuide, setActiveGuide] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const filtered = filter === 'all' ? GUIDES : GUIDES.filter((g) => g.category === filter);

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
          title="Add New API Guide Entry"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader
        title="API Configuration Guide"
        subtitle="Step-by-step instructions for setting up SMS, WhatsApp, Email, Payments and other integrations"

      />

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {['all', 'sms', 'whatsapp', 'payment', 'email'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
              filter === cat
                ? 'bg-g-red text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {cat === 'all' ? '🌐 All' : cat === 'sms' ? '💬 SMS' : cat === 'whatsapp' ? '📱 WhatsApp' : cat === 'payment' ? '💳 Payments' : '✉️ Email'}
          </button>
        ))}
      </div>

      {/* Developer Note */}
      <Card className="border-l-4 border-g-gold p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">👨‍💻</span>
          <div>
            <h3 className="text-sm font-bold text-g-ink dark:text-white">Developer vs Admin Credentials</h3>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              <strong>Developer credentials</strong> (Hellio Messaging, Paystack) are pre-configured and locked. These are for platform-level operations only.
              <strong> Admin credentials</strong> can be configured by the hospital admin after purchase — for their own SMS, WhatsApp, Email, and payment gateways.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Developer: ShaComputeC · shacomputec@gmail.com · +233 530 941 750
            </p>
          </div>
        </div>
      </Card>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((guide) => (
          <div
            key={guide.id}
            onClick={() => setActiveGuide(activeGuide === guide.id ? null : guide.id)}
          >
          <Card
            className={`cursor-pointer p-4 transition-all hover:shadow-lg ${
              activeGuide === guide.id ? 'ring-2 ring-g-red' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{guide.icon}</span>
                <div>
                  <h3 className="text-sm font-bold text-g-ink dark:text-white">{guide.title}</h3>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${CATEGORY_COLORS[guide.category]}`}>
                    {guide.category}
                  </span>
                </div>
              </div>
              <Icon name={activeGuide === guide.id ? 'chevDown' : 'arrowRight'} className="h-5 w-5 text-slate-400" />
            </div>

            {/* Expanded content */}
            {activeGuide === guide.id && (
              <div className="mt-4 space-y-4 border-t border-slate-200 pt-4 dark:border-slate-700">
                {/* Steps */}
                <div>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Setup Steps</h4>
                  <ol className="space-y-2">
                    {guide.steps.map((step, i) => (
                      <li key={i} className="flex gap-3 text-xs text-slate-700 dark:text-slate-300">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-g-red text-[10px] font-bold text-white">
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Tips */}
                <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
                  <h4 className="mb-2 text-xs font-bold text-amber-700 dark:text-amber-400">💡 Tips</h4>
                  <ul className="space-y-1">
                    {guide.tips.map((tip, i) => (
                      <li key={i} className="text-xs text-amber-600 dark:text-amber-300">• {tip}</li>
                    ))}
                  </ul>
                </div>

                {/* Environment Variables */}
                <div>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Environment Variables</h4>
                  <div className="space-y-1 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                    {guide.envVars.map((env) => (
                      <div key={env.key} className="flex items-center gap-2 text-xs">
                        <code className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[10px] text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                          {env.key}
                        </code>
                        {env.required && <span className="text-[10px] font-bold text-red-500">REQUIRED</span>}
                        <span className="text-slate-500">{env.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
