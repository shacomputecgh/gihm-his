import { useState, useRef, useEffect, type FormEvent } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { api } from '../../lib/api';
import { Badge, Button, Input } from '../../components/ui';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  provider?: string;
}

interface LLMStatus {
  configured: boolean;
  provider: string;
  model: string;
  message: string;
}

const DISCLAIMER = 'Dr. August AI (shacomputec AI) is a clinical decision support tool. All information is for reference only. Professional clinical judgment is required for patient care decisions.';

export default function DrAugustAI() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Welcome to **Dr. August AI** (shacomputec AI) 🩺\n\nI'm your clinical decision support assistant. I can help you with:\n\n• **Drug information** — dosages, side effects, contraindications, interactions\n• **Disease information** — symptoms, diagnosis, prevention, treatment protocols\n• **Treatment guidance** — first-line and second-line therapies\n• **Clinical questions** — powered by AI when configured\n\n**How to use:**\n1. Ask about a disease: "Tell me about Malaria"\n2. Ask about a drug: "What is Amoxicillin used for?"\n3. Check interactions: "Can I give Paracetamol with Ibuprofen?"\n4. Use the quick actions below\n\n⚠️ ${DISCLAIMER}`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [llmStatus, setLlmStatus] = useState<LLMStatus | null>(null);
  const [chatMode, setChatMode] = useState<'local' | 'llm'>('local');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check LLM status on mount
  useEffect(() => {
    api<LLMStatus>('/clinical/llm-status', { public: true })
      .then((status) => {
        setLlmStatus(status);
        if (status.configured) setChatMode('llm');
      })
      .catch(() => {
        setLlmStatus({ configured: false, provider: 'none', model: '', message: 'LLM not available' });
      });
  }, []);

  function addMessage(role: 'user' | 'assistant', content: string, provider?: string): Message {
    const msg: Message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      role,
      content,
      timestamp: new Date(),
      provider,
    };
    setMessages((prev) => [...prev, msg]);
    return msg;
  }

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const question = input.trim();
    setInput('');
    addMessage('user', question);
    setLoading(true);

    try {
      if (chatMode === 'llm' && llmStatus?.configured) {
        // Use LLM-powered chat
        const conversationHistory = messages.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await api<{
          response: string;
          provider: string;
          drugsFound: number;
          diseasesFound: number;
        }>('/clinical/llm-chat', {
          method: 'POST',
          body: { message: question, conversationHistory },
        });

        let answer = res.response;
        if (res.drugsFound || res.diseasesFound) {
          answer += `\n\n📊 Context: ${res.drugsFound} drug(s), ${res.diseasesFound} disease(s) from database`;
        }
        addMessage('assistant', answer, res.provider);
      } else {
        // Use local database search
        const res = await api<{ answer: string; diseasesFound?: number; drugsFound?: number }>(
          '/clinical/assistant',
          { method: 'POST', body: { question } },
        );
        let answer = res.answer;
        if (res.diseasesFound || res.drugsFound) {
          answer += `\n\n📊 Found: ${res.diseasesFound ?? 0} disease(s), ${res.drugsFound ?? 0} drug(s)`;
        }
        addMessage('assistant', answer, 'local-database');
      }
    } catch (err) {
      addMessage('assistant', `❌ Error: ${err instanceof Error ? err.message : 'Failed to get response'}`);
    } finally {
      setLoading(false);
    }
  }

  async function searchDisease(name: string) {
    addMessage('user', `Show me information about ${name}`);
    setLoading(true);
    try {
      if (chatMode === 'llm' && llmStatus?.configured) {
        const res = await api<{ response: string; provider: string }>('/clinical/llm-chat', {
          method: 'POST',
          body: { message: `Tell me about ${name} — symptoms, treatment, prevention`, conversationHistory: [] },
        });
        addMessage('assistant', res.response, res.provider);
      } else {
        const res = await api<{ answer: string }>(
          '/clinical/assistant',
          { method: 'POST', body: { diseaseName: name } },
        );
        addMessage('assistant', res.answer, 'local-database');
      }
    } catch (err) {
      addMessage('assistant', `❌ Error: ${err instanceof Error ? err.message : 'Disease not found'}`);
    } finally {
      setLoading(false);
    }
  }

  async function searchDrug(name: string) {
    addMessage('user', `Show me information about ${name}`);
    setLoading(true);
    try {
      if (chatMode === 'llm' && llmStatus?.configured) {
        const res = await api<{ response: string; provider: string }>('/clinical/llm-chat', {
          method: 'POST',
          body: { message: `Tell me about ${name} — dosing, side effects, interactions`, conversationHistory: [] },
        });
        addMessage('assistant', res.response, res.provider);
      } else {
        const res = await api<{ answer: string }>(
          '/clinical/assistant',
          { method: 'POST', body: { drugName: name } },
        );
        addMessage('assistant', res.answer, 'local-database');
      }
    } catch (err) {
      addMessage('assistant', `❌ Error: ${err instanceof Error ? err.message : 'Drug not found'}`);
    } finally {
      setLoading(false);
    }
  }

  const quickActions = [
    { label: '🦟 Malaria treatment', action: () => { setInput('What is the treatment for Malaria?'); } },
    { label: '❤️ Hypertension drugs', action: () => { setInput('What drugs treat hypertension?'); } },
    { label: '💊 HIV/AIDS regimen', action: () => { setInput('What is the first-line ART for HIV/AIDS?'); } },
    { label: '🩸 Diabetes management', action: () => { setInput('How to manage type 2 diabetes?'); } },
    { label: '🦠 Antibiotic guide', action: () => { setInput('What antibiotics for respiratory infections?'); } },
    { label: '🤰 Pregnancy safe drugs', action: () => { setInput('Which drugs are safe in pregnancy?'); } },
    { label: '👶 Childhood fever', action: () => { setInput('How to manage fever in children?') } },
    { label: '💉 Pain management', action: () => { setInput('WHO pain ladder?') } },
  ];

  const searchActions = [
    { label: '🦠 Search disease', action: searchDisease },
    { label: '💊 Search drug', action: searchDrug },
  ];

  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<Record<string, string> | null>(null);
  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-5xl flex-col">
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">
          {showAdd ? "\u2715 Cancel" : "+ Add New"}
        </button>
      </div>
      {showAdd && (
        <AddNewForm
          title="Add New DrAugustAI"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-bold text-g-ink">
            <span className="text-2xl">🩺</span> Dr. August AI
            <Badge tone="green">shacomputec AI</Badge>
          </h1>
          <p className="text-xs text-slate-400">Clinical Decision Support — Drug & Disease Reference</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Mode toggle */}
          <div className="flex rounded-lg border border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => setChatMode('local')}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                chatMode === 'local' ? 'bg-g-red text-white' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              📋 Database
            </button>
            <button
              type="button"
              onClick={() => setChatMode('llm')}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                chatMode === 'llm' ? 'bg-g-red text-white' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              🤖 AI Chat
            </button>
          </div>
          {llmStatus && (
            <Badge tone={llmStatus.configured ? 'green' : 'gold'}>
              {llmStatus.configured ? `${llmStatus.provider} (${llmStatus.model})` : 'Local only'}
            </Badge>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-g-red text-white'
                    : 'border border-slate-200 bg-white text-g-ink shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <div className={`mt-1 flex items-center gap-2 text-[10px] ${msg.role === 'user' ? 'text-white/60' : 'text-slate-400'}`}>
                  <span>{msg.timestamp.toLocaleTimeString()}</span>
                  {msg.provider && msg.role === 'assistant' && (
                    <Badge tone={msg.provider === 'local-database' ? 'blue' : 'green'}>
                      {msg.provider === 'local-database' ? '📋 DB' : `🤖 ${msg.provider}`}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-400 shadow-sm">
                <span className="animate-pulse">Dr. August is thinking…</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <div className="border-t border-slate-200 bg-white px-4 py-3">
          <p className="mb-2 text-[10px] font-bold uppercase text-slate-400">Quick actions</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((qa) => (
              <button
                key={qa.label}
                onClick={qa.action}
                className="cursor-pointer rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-g-ink transition hover:border-g-red/30 hover:bg-g-red/5"
              >
                {qa.label}
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            {searchActions.map((sa) => (
              <button
                key={sa.label}
                onClick={() => {
                  const name = prompt(`Enter ${sa.label.includes('disease') ? 'disease' : 'drug'} name:`);
                  if (name?.trim()) sa.action(name.trim());
                }}
                className="cursor-pointer rounded-full border border-g-red/30 bg-g-red/5 px-3 py-1.5 text-xs font-medium text-g-red transition hover:bg-g-red/10"
              >
                {sa.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-slate-200 bg-white p-4">
        <form onSubmit={(e) => void sendMessage(e)} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={chatMode === 'llm' ? 'Ask Dr. August AI anything clinical…' : 'Search drugs and diseases…'}
            className="flex-1"
          />
          <Button variant="green" type="submit" loading={loading}>
            {chatMode === 'llm' ? 'Ask AI' : 'Search'}
          </Button>
        </form>
        <p className="mt-2 text-[10px] text-slate-400">
          ⚠️ {DISCLAIMER}
        </p>
      </div>
    </div>
  );
}
