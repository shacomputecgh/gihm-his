import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { searchEncyclopedia, searchDrugsOnly, searchDiseasesOnly, getGhanaianTranslation, formatEncyclopediaResponse } from '../lib/healthEncyclopedia';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'action' | 'activity' | 'system';
}

interface Activity {
  id: string;
  type: 'login' | 'logout' | 'page_view' | 'action' | 'system' | 'error';
  description: string;
  timestamp: Date;
  details?: string;
  icon: string;
}



const QUICK_ACTIONS = [
  { label: 'Register Patient', path: '/app/register', icon: '➕' },
  { label: 'View Queue', path: '/app/queue', icon: '📋' },
  { label: 'Pharmacy', path: '/app/pharmacy', icon: '💊' },
  { label: 'Lab Orders', path: '/app/lab', icon: '🔬' },
  { label: 'Insurance', path: '/app/insurance', icon: '🏥' },
  { label: 'Reports', path: '/app/reports', icon: '📊' },
  { label: 'Drug Info', path: '/app/drugs', icon: '💊' },
  { label: 'Surveillance', path: '/app/surveillance', icon: '🔍' },
];

export default function ShaComputeAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'activity' | 'help'>('chat');
  const [minimized, setMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Initialize with welcome message
  useEffect(() => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I'm **ShaComputeC AI** 🤖\n\nI'm your intelligent assistant for GIHM-HIS. I can help you with anything in the system.\n\n**Quick tips:**\n• Ask me anything about the system\n• I track your activities to provide better help\n• Use quick actions below for common tasks\n• I work both offline and online\n\nHow can I help you today?`,
      timestamp: new Date(),
      type: 'text',
    }]);
  }, []);

  // Track page navigation
  useEffect(() => {
    if (user && location.pathname !== '/login') {
      addActivity({
        type: 'page_view',
        description: `Navigated to ${getPageName(location.pathname)}`,
        details: location.pathname,
        icon: '🧭',
      });
    }
  }, [location.pathname, user]);

  // Track login
  useEffect(() => {
    if (user) {
      addActivity({
        type: 'login',
        description: `Logged in as ${user.fullName}`,
        details: `Role: ${user.roleName}, Scope: ${user.scope}`,
        icon: '🔑',
      });
    }
  }, [user]);

  const addActivity = useCallback((activity: Omit<Activity, 'id' | 'timestamp'>) => {
    const newActivity: Activity = {
      ...activity,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setActivities(prev => [newActivity, ...prev].slice(0, 100)); // Keep last 100
  }, []);

  const getPageName = (path: string): string => {
    const names: Record<string, string> = {
      '/app': 'Dashboard',
      '/app/queue': 'Patient Queue',
      '/app/patients': 'Patient Registry',
      '/app/register': 'Patient Registration',
      '/app/appointments': 'Appointments',
      '/app/pharmacy': 'Pharmacy',
      '/app/lab': 'Laboratory',
      '/app/admissions': 'Admissions',
      '/app/billing': 'Billing',
      '/app/insurance': 'Insurance',
      '/app/stock': 'Stock & Inventory',
      '/app/surveillance': 'Surveillance',
      '/app/reports': 'Reports',
      '/app/admin': 'Administration',
      '/app/developer': 'Developer',
      '/app/developer-console': 'Developer Console',
      '/app/admin-hierarchy': 'Admin Hierarchy',
    };
    return names[path] || path.split('/').pop()?.replace(/-/g, ' ') || 'Unknown Page';
  };

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      type: 'text',
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Track user action
    addActivity({
      type: 'action',
      description: `Asked ShaComputeC AI: "${input.trim().slice(0, 50)}${input.trim().length > 50 ? '...' : ''}"`,
      icon: '💬',
    });

    // Generate response (local processing + optional AI API)
    const response = await generateResponse(input.trim(), activities, user);
    
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      type: 'text',
    };

    setMessages(prev => [...prev, assistantMessage]);
    setLoading(false);
  };

  const generateResponse = async (query: string, activityLog: Activity[], currentUser: typeof user): Promise<string> => {
    const q = query.toLowerCase();

    // System activity queries
    if (q.includes('activity') || q.includes('what did i do') || q.includes('history')) {
      const recentActivities = activityLog.slice(0, 5);
      if (recentActivities.length === 0) {
        return "I haven't tracked any activities yet. As you use the system, I'll keep a record of your actions here.";
      }
      return `Here are your recent activities:\n\n${recentActivities.map(a => `${a.icon} **${a.description}** — ${formatTime(a.timestamp)}`).join('\n')}\n\nI track all your activities including logins, page views, and actions to provide better assistance.`;
    }

    // Login/logout queries
    if (q.includes('login') || q.includes('logout') || q.includes('session')) {
      const loginActivities = activityLog.filter(a => a.type === 'login' || a.type === 'logout');
      if (loginActivities.length === 0) {
        return `You're currently logged in as **${currentUser?.fullName}** (${currentUser?.roleName}).\n\nI'll track your session activities automatically.`;
      }
      return `Your session info:\n\n• Current user: **${currentUser?.fullName}**\n• Role: ${currentUser?.roleName}\n• Scope: ${currentUser?.scope}\n\nRecent session activities:\n${loginActivities.slice(0, 3).map(a => `${a.icon} ${a.description} — ${formatTime(a.timestamp)}`).join('\n')}`;
    }

    // Navigation help
    if (q.includes('where') || q.includes('how to') || q.includes('navigate') || q.includes('find')) {
      if (q.includes('patient')) return "To manage patients, go to **Patients** (sidebar → Patients) or **Register** to add a new patient. You can also use the Queue for walk-in patients.";
      if (q.includes('pharmacy') || q.includes('drug') || q.includes('prescription')) return "The **Pharmacy** module has everything: prescriptions, inventory, procurement, and billing. Access it from the sidebar.";
      if (q.includes('insurance') || q.includes('claim')) return "Go to **Insurance** to manage NHIS claims, enroll patients, and track claim status. The **Billing** module handles payments.";
      if (q.includes('report')) return "Check **Reports** for analytics, or **Directorate** for regional data. The **Surveillance** module tracks disease cases.";
      if (q.includes('admin')) return "**Admin & Sync** handles facility settings and user management. For developer tools, check **Developer Console**.";
      return "I can help you navigate! Tell me what you're looking for and I'll guide you to the right place.";
    }

    // Language translation queries
    const langMatch = q.match(/translate\s+['"]?(\w+)['"]?\s+(?:to|in|as)\s*(twi|ga|ewe|hausa|dagbani)/i);
    if (langMatch && langMatch[1] && langMatch[2]) {
      const translation = getGhanaianTranslation(langMatch[1], langMatch[2].toLowerCase());
      if (translation) return `🌍 **Ghanaian Translation (${langMatch[2]}):**\n\n${translation}\n\n💡 I can translate health terms to Twi, Ga, Ewe, Hausa, or Dagbani.`;
      return `🔍 I don't have a translation for "${langMatch[1]}" in ${langMatch[2]}. Try common health terms like malaria, fever, pain, medicine, hospital.`;
    }

    // Drug queries — search encyclopedia first
    if (q.includes('drug') || q.includes('medicine') || q.includes('dose') || q.includes('tablet') || q.includes('prescription') || q.includes('paracetamol') || q.includes('amoxicillin')) {
      const drugResults = searchDrugsOnly(q);
      if (drugResults.length > 0) {
        let response = formatEncyclopediaResponse(drugResults[0]!);
        if (drugResults.length > 1) {
          response += '\n\n📚 **Related drugs:**\n' + drugResults.slice(1, 4).map(d => `• **${d.name}** (${d.category})`).join('\n');
        }
        return response;
      }
      return "I searched my drug database but couldn't find a match. Try searching for the drug by its generic or brand name. For the full drug database, visit the **Drug Database** module.";
    }

    // Disease queries — search encyclopedia first
    if (q.includes('disease') || q.includes('symptom') || q.includes('treatment') || q.includes('condition') || q.includes('infection') || q.includes('diagnosis') || q.includes('malaria') || q.includes('typhoid') || q.includes('tuberculosis') || q.includes('diabetes') || q.includes('hypertension') || q.includes('sickle') || q.includes('asthma')) {
      const diseaseResults = searchDiseasesOnly(q);
      if (diseaseResults.length > 0) {
        let response = formatEncyclopediaResponse(diseaseResults[0]!);
        if (diseaseResults.length > 1) {
          response += '\n\n📚 **Related topics:**\n' + diseaseResults.slice(1, 4).map(d => `• **${d.name}** (${d.category})`).join('\n');
        }
        return response;
      }
    }

    // General encyclopedia search (catches lab tests, guidelines, etc.)
    const allResults = searchEncyclopedia(q);
    if (allResults.length > 0) {
      let response = formatEncyclopediaResponse(allResults[0]!);
      if (allResults.length > 1) {
        response += '\n\n📚 **Related topics:**\n' + allResults.slice(1, 4).map(d => `• **${d.name}** (${d.category})`).join('\n');
      }
      return response;
    }

    // API Configuration assistance
    if (q.includes('api') || q.includes('paystack') || q.includes('sms') || q.includes('whatsapp') || q.includes('email') || q.includes('configure') || q.includes('config') || q.includes('setting')) {
      if (q.includes('paystack')) {
        return "**Paystack Configuration Guide:**\n\n1. Go to **Settings** → **API Configuration**\n2. Enter your **Public Key** (pk_live_...) in the Paystack field\n3. Enter your **Secret Key** (sk_live_...) in the Secret field\n4. Click **Save & Test Connection**\n\n⚠️ **Note:** Only the developer's Paystack keys are for purchasing the system. Admins can configure their own keys for hospital transactions.\n\nNeed help? I can guide you step-by-step!";
      }
      if (q.includes('sms') || q.includes('text message')) {
        return "**SMS Configuration Guide:**\n\n1. Go to **Settings** → **API Configuration**\n2. Enter your SMS provider credentials (Heliomessaging, Twilio, etc.)\n3. Set the **API Key**, **Sender ID**, and **Endpoint**\n4. Click **Test SMS** to verify\n\n💡 SMS is used for: appointment reminders, lab results, discharge notifications, and patient follow-ups.";
      }
      if (q.includes('whatsapp')) {
        return "**WhatsApp Configuration Guide:**\n\n1. Go to **Settings** → **API Configuration**\n2. Enter your **WhatsApp Business API** credentials\n3. Set the **Phone Number ID** and **Access Token**\n4. Click **Test WhatsApp** to verify\n\n💡 WhatsApp is used for: appointment reminders, prescription delivery, and patient communication.";
      }
      if (q.includes('email') || q.includes('mail')) {
        return "**Email Configuration Guide:**\n\n1. Go to **Settings** → **API Configuration**\n2. Enter your **SMTP Server** details\n3. Set **Port**, **Username**, **Password**, and **From Address**\n4. Click **Test Email** to verify\n\n💡 Email is used for: reports, invoices, staff notifications, and patient records.";
      }
      return "I can help you configure system settings! Here's what I can assist with:\n\n• **Paystack** — Online payment configuration\n• **SMS** — Text message service setup\n• **WhatsApp** — Messaging integration\n• **Email** — SMTP configuration\n\nJust tell me which service you want to configure, and I'll guide you through it!";
    }

    // System help
    if (q.includes('help') || q.includes('what can you do')) {
      return "I'm **ShaComputeC AI**, your system assistant. Here's what I can do:\n\n• **Navigation** — Guide you to any module\n• **Drug Info** — Quick drug lookups\n• **Disease Info** — Symptoms, treatments, prevention\n• **API Config** — Help configure system settings\n• **Activity Tracking** — See what you've done\n• **Language Translation** — Twi, Ga, Ewe, Hausa, Dagbani\n• **System Help** — Explain features\n• **Quick Actions** — Common tasks\n\nJust ask me anything! I'm always here to help.";
    }

    // Activity summary
    if (q.includes('summary') || q.includes('today') || q.includes('overview')) {
      const today = new Date().toDateString();
      const todayActivities = activityLog.filter(a => a.timestamp.toDateString() === today);
      return `Here's your activity summary:\n\n• **Total activities today:** ${todayActivities.length}\n• **Pages visited:** ${new Set(todayActivities.filter(a => a.type === 'page_view').map(a => a.details)).size}\n• **Actions performed:** ${todayActivities.filter(a => a.type === 'action').length}\n\nI track all your activities to help you stay organized.`;
    }

    // Default response — try encyclopedia as last resort
    const fallbackResults = searchEncyclopedia(q);
    if (fallbackResults.length > 0) return formatEncyclopediaResponse(fallbackResults[0]!);
    return `I understand you're asking about "${query}".\n\nI can help with:\n• 💊 **Drug information** — dosages, interactions, side effects\n• 🦠 **Disease reference** — symptoms, treatment, prevention\n• 🔬 **Lab test interpretation** — normal values, significance\n• 🌍 **Ghanaian language translations** — Twi, Ga, Ewe, Hausa, Dagbani\n• ⚙️ **API Configuration** — Paystack, SMS, WhatsApp, Email setup\n• 📋 **System navigation** — guide to any module\n• 📊 **Activity tracking** — see what you've done\n\nTry: "What is the dose of Metformin?" or "Configure Paystack" or "Translate 'fever' to Twi"`;
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const handleQuickAction = (path: string) => {
    addActivity({
      type: 'action',
      description: `Used quick action to navigate to ${getPageName(path)}`,
      icon: '🚀',
    });
    navigate(path);
    setIsOpen(false);
  };

  if (!user) return null; // Don't show for non-logged-in users

  return (
    <>
      {/* Floating AI Button */}
      {!isOpen && (
        <button
          onClick={() => { setIsOpen(true); setMinimized(false); }}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-g-green to-emerald-600 text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl"
          title="ShaComputeC AI Assistant"
        >
          <span className="text-2xl">🤖</span>
        </button>
      )}

      {/* AI Chat Panel */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 ${minimized ? 'h-14 w-80' : 'h-[600px] w-96'}`}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <img src="/shacomputec-logo.png" alt="ShaComputeC" className="h-8 w-8 rounded-lg object-contain" />
              <div>
                <h3 className="text-sm font-bold text-g-ink dark:text-white">ShaComputeC AI</h3>
                <p className="text-[10px] text-slate-400">by ShaComputeC · Always here to help</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setMinimized(!minimized)} className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                {minimized ? '🔼' : '🔽'}
              </button>
              <button onClick={() => setIsOpen(false)} className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                ✕
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-700">
                {(['chat', 'activity', 'help'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 text-xs font-medium transition-colors ${
                      activeTab === tab
                        ? 'border-b-2 border-g-green text-g-green'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                    }`}
                  >
                    {tab === 'chat' ? '💬 Chat' : tab === 'activity' ? '📊 Activity' : '❓ Help'}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'chat' && (
                  <div className="space-y-4">
                    {messages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                          msg.role === 'user'
                            ? 'bg-g-green text-white'
                            : 'bg-slate-100 text-g-ink dark:bg-slate-800 dark:text-white'
                        }`}>
                          <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                          <p className="mt-1 text-[10px] opacity-75">{formatTime(msg.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="flex justify-start">
                        <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800">
                          <span className="animate-pulse">Thinking...</span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}

                {activeTab === 'activity' && (
                  <div className="space-y-2">
                    {activities.length === 0 ? (
                      <p className="py-8 text-center text-sm text-slate-400">No activities tracked yet. Start using the system!</p>
                    ) : (
                      activities.map(act => (
                        <div key={act.id} className="flex items-start gap-2 rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
                          <span className="text-lg">{act.icon}</span>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-g-ink dark:text-white">{act.description}</p>
                            <p className="text-[10px] text-slate-400">{formatTime(act.timestamp)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'help' && (
                  <div className="space-y-4">
                    <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                      <h4 className="mb-2 text-xs font-bold text-blue-700 dark:text-blue-400">What I Can Do</h4>
                      <ul className="space-y-1 text-xs text-blue-600 dark:text-blue-300">
                        <li>• Navigate to any module</li>
                        <li>• Provide drug information</li>
                        <li>• Track your activities</li>
                        <li>• Answer system questions</li>
                        <li>• Guide through workflows</li>
                      </ul>
                    </div>
                    <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                      <h4 className="mb-2 text-xs font-bold text-green-700 dark:text-green-400">Quick Actions</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {QUICK_ACTIONS.map(action => (
                          <button
                            key={action.path}
                            onClick={() => handleQuickAction(action.path)}
                            className="rounded-lg bg-white p-2 text-left text-xs font-medium text-g-ink shadow-sm transition-colors hover:bg-green-50 dark:bg-slate-800 dark:hover:bg-green-900/20"
                          >
                            {action.icon} {action.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
                      <h4 className="mb-2 text-xs font-bold text-amber-700 dark:text-amber-400">Example Questions</h4>
                      <ul className="space-y-1 text-xs text-amber-600 dark:text-amber-300">
                        <li>• "What is the dose of Amoxicillin?"</li>
                        <li>• "How to treat Malaria?"</li>
                        <li>• "Translate 'headache' to Twi"</li>
                        <li>• "What does a high CRP mean?"</li>
                        <li>• "How do I register a patient?"</li>
                        <li>• "What is the WHO pain ladder?"</li>
                        <li>• "Tell me about Hypertension"</li>
                      </ul>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                      <h4 className="mb-2 text-xs font-bold text-slate-700 dark:text-slate-300">Developer</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        <strong>ShaComputeC</strong> · Hard Works Never Fail<br />
                        📧 shacomputec@gmail.com<br />
                        📞 +233 530 941 750
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions Bar */}
              <div className="border-t border-slate-200 px-3 py-2 dark:border-slate-700">
                <div className="mb-2 flex flex-wrap gap-1">
                  {QUICK_ACTIONS.slice(0, 4).map(action => (
                    <button
                      key={action.path}
                      onClick={() => handleQuickAction(action.path)}
                      className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {action.icon} {action.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div className="border-t border-slate-200 p-3 dark:border-slate-700">
                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage(); } }}
                    placeholder="Ask me anything..."
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    disabled={loading}
                  />
                  <button
                    onClick={() => void sendMessage()}
                    disabled={loading || !input.trim()}
                    className="rounded-lg bg-g-green px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600 disabled:opacity-50"
                  >
                    {loading ? '...' : '→'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

function formatMessage(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br />');
}
