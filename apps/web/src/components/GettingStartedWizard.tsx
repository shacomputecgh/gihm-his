import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useToast } from './ui';

interface Step {
  id: string;
  title: string;
  description: string;
  icon: string;
  action?: string;
  path?: string;
  color: string;
}

const WIZARD_STEPS: Step[] = [
  {
    id: 'welcome',
    title: 'Welcome to GIHM-HIS!',
    description: 'This quick tour will help you get started with the Ghana Integrated Health Management System. Let\'s walk through the key features.',
    icon: '👋',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'dashboard',
    title: 'Your Dashboard',
    description: 'The dashboard shows real-time facility metrics — patients today, revenue, bed occupancy, queue waiting, and alerts. It refreshes every 30 seconds.',
    icon: '🏠',
    path: '/app',
    action: 'Go to Dashboard',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'patients',
    title: 'Patient Management',
    description: 'Register new patients, search existing records, view medical history, and manage demographics. Start here for any patient interaction.',
    icon: '👥',
    path: '/app/patients',
    action: 'Go to Patients',
    color: 'from-purple-500 to-violet-600',
  },
  {
    id: 'queue',
    title: 'Patient Queue',
    description: 'Manage the patient flow — check in arrivals, triage by priority, and route to departments. Keep the queue moving for better patient satisfaction.',
    icon: '📋',
    path: '/app/queue',
    action: 'Go to Queue',
    color: 'from-orange-500 to-red-500',
  },
  {
    id: 'pharmacy',
    title: 'Pharmacy Module',
    description: 'Dispense medications, check drug interactions, manage inventory with batch/expiry tracking, and process prescriptions from doctors.',
    icon: '💊',
    path: '/app/pharmacy',
    action: 'Go to Pharmacy',
    color: 'from-pink-500 to-rose-600',
  },
  {
    id: 'laboratory',
    title: 'Laboratory',
    description: 'Manage lab orders, record results with reference ranges, flag abnormal values, and release reports to patient files.',
    icon: '🧪',
    path: '/app/laboratory',
    action: 'Go to Laboratory',
    color: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'billing',
    title: 'Billing & Payments',
    description: 'Generate bills, process payments (cash, card, mobile money), handle insurance claims, and issue receipts.',
    icon: '💰',
    path: '/app/billing',
    action: 'Go to Billing',
    color: 'from-yellow-500 to-amber-600',
  },
  {
    id: 'settings',
    title: 'System Settings',
    description: 'Configure your SMS, WhatsApp, Email, and Payment integrations. Each admin can set up their own API credentials.',
    icon: '⚙️',
    path: '/app/system-settings',
    action: 'Go to Settings',
    color: 'from-slate-500 to-gray-600',
  },
  {
    id: 'guide',
    title: 'System Guide',
    description: 'Need help? The System Guide has step-by-step instructions for every module. You can also print it as a PDF for your staff.',
    icon: '📖',
    path: '/app/system-guide',
    action: 'Go to Guide',
    color: 'from-indigo-500 to-blue-600',
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🎉',
    description: 'You now know the basics. Explore each module at your own pace. ShaComputeC AI is always available in the bottom-right corner if you need help.',
    icon: '🚀',
    color: 'from-emerald-500 to-green-600',
  },
];

export default function GettingStartedWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('gihmhs-getting-started-done') === 'true';
  });
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  if (isDismissed) return null;

  const step = WIZARD_STEPS[currentStep]!;
  const isLast = currentStep === WIZARD_STEPS.length - 1;
  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100;

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem('gihmhs-getting-started-done', 'true');
      setIsDismissed(true);
      toast('Welcome aboard! 🎉 You\'re ready to use GIHM-HIS. ShaComputeC AI is always here to help.', 'success');
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('gihmhs-getting-started-done', 'true');
    setIsDismissed(true);
  };

  const handleGoTo = () => {
    if (step.path) {
      navigate(step.path);
      handleNext();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header with gradient */}
        <div className={`bg-gradient-to-r ${step.color} p-6 text-white text-center relative`}>
          <button onClick={handleSkip} className="absolute top-3 right-3 text-white/70 hover:text-white text-sm font-medium">
            Skip Tour ✕
          </button>
          <span className="text-5xl mb-3 block">{step.icon}</span>
          <h2 className="text-xl font-bold">{step.title}</h2>
          {/* Progress bar */}
          <div className="mt-4 h-1.5 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs text-white/80">Step {currentStep + 1} of {WIZARD_STEPS.length}</p>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <p className="text-slate-600 text-sm leading-relaxed">{step.description}</p>
          {user && (
            <p className="mt-3 text-xs text-slate-400">
              Logged in as <span className="font-semibold text-slate-600">{user.fullName}</span> ({user.scope})
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3 justify-center">
          {step.path && (
            <button onClick={handleGoTo} className={`bg-gradient-to-r ${step.color} text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition`}>
              {step.action || 'Go to →'}
            </button>
          )}
          <button onClick={handleNext} className="bg-slate-100 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-200 transition">
            {isLast ? '🎉 Finish Tour' : 'Next →'}
          </button>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-1.5 pb-4">
          {WIZARD_STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === currentStep ? 'bg-blue-600 w-6' : i < currentStep ? 'bg-blue-300' : 'bg-slate-200'}`}
              title={s.title}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
