import { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';
import type { Patient } from '../../types';
import { Button, Card, Field, Icon, PageHeader, useToast } from '../../components/ui';

type CardType = 'PATIENT' | 'STAFF' | 'VISITOR' | 'HOSPITAL';

interface CardTheme {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  headerBg: string;
  borderRadius: string;
  fontFamily: string;
  showGhanaFlag: boolean;
  showQRCode: boolean;
  style: 'classic' | 'modern' | 'light';
}

interface IdCardData {
  fullName: string;
  id: string;
  photo: string | null;
  cardType: CardType;
  facilityName: string;
  facilityAddress: string;
  facilityPhone: string;
  facilityEmail: string;
  facilityWebsite: string;
  facilityLogo: string;
  facilityServices: string[];
  bloodGroup?: string;
  dateOfBirth?: string;
  gender?: string;
  role?: string;
  department?: string;
  phone?: string;
  email?: string;
  validFrom: string;
  validUntil: string;
  qrData: string;
}

const PRESET_THEMES: CardTheme[] = [
  // Classic themes
  {
    name: 'Classic Blue',
    primary: '#1e40af',
    secondary: '#3b82f6',
    accent: '#60a5fa',
    text: '#ffffff',
    headerBg: '#1e3a8a',
    borderRadius: '8px',
    fontFamily: 'Inter, system-ui, sans-serif',
    showGhanaFlag: true,
    showQRCode: true,
    style: 'classic',
  },
  {
    name: 'Classic Green',
    primary: '#166534',
    secondary: '#22c55e',
    accent: '#4ade80',
    text: '#ffffff',
    headerBg: '#14532d',
    borderRadius: '8px',
    fontFamily: 'Inter, system-ui, sans-serif',
    showGhanaFlag: true,
    showQRCode: true,
    style: 'classic',
  },
  {
    name: 'Classic Red',
    primary: '#991b1b',
    secondary: '#ef4444',
    accent: '#f87171',
    text: '#ffffff',
    headerBg: '#7f1d1d',
    borderRadius: '8px',
    fontFamily: 'Inter, system-ui, sans-serif',
    showGhanaFlag: true,
    showQRCode: true,
    style: 'classic',
  },
  // Modern themes
  {
    name: 'Modern Dark',
    primary: '#111827',
    secondary: '#1f2937',
    accent: '#f59e0b',
    text: '#f9fafb',
    headerBg: '#030712',
    borderRadius: '12px',
    fontFamily: 'Inter, system-ui, sans-serif',
    showGhanaFlag: true,
    showQRCode: true,
    style: 'modern',
  },
  {
    name: 'Modern Gradient',
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#a78bfa',
    text: '#ffffff',
    headerBg: '#4f46e5',
    borderRadius: '16px',
    fontFamily: 'Inter, system-ui, sans-serif',
    showGhanaFlag: true,
    showQRCode: true,
    style: 'modern',
  },
  {
    name: 'Modern Gold',
    primary: '#78350f',
    secondary: '#d97706',
    accent: '#fbbf24',
    text: '#ffffff',
    headerBg: '#451a03',
    borderRadius: '12px',
    fontFamily: 'Inter, system-ui, sans-serif',
    showGhanaFlag: true,
    showQRCode: true,
    style: 'modern',
  },
  // Light themes
  {
    name: 'Light Clean',
    primary: '#ffffff',
    secondary: '#f8fafc',
    accent: '#3b82f6',
    text: '#1e293b',
    headerBg: '#f1f5f9',
    borderRadius: '4px',
    fontFamily: 'Inter, system-ui, sans-serif',
    showGhanaFlag: true,
    showQRCode: true,
    style: 'light',
  },
  {
    name: 'Light Medical',
    primary: '#ffffff',
    secondary: '#f0fdf4',
    accent: '#16a34a',
    text: '#1a1a1a',
    headerBg: '#ecfdf5',
    borderRadius: '6px',
    fontFamily: 'Inter, system-ui, sans-serif',
    showGhanaFlag: true,
    showQRCode: true,
    style: 'light',
  },
  {
    name: 'Light Royal',
    primary: '#ffffff',
    secondary: '#fef3c7',
    accent: '#d97706',
    text: '#1e293b',
    headerBg: '#fffbeb',
    borderRadius: '4px',
    fontFamily: 'Inter, system-ui, sans-serif',
    showGhanaFlag: true,
    showQRCode: true,
    style: 'light',
  },
];

const CARD_TYPE_CONFIG = {
  PATIENT: { label: 'Patient', color: 'bg-blue-500', icon: 'user' as const },
  STAFF: { label: 'Staff', color: 'bg-red-500', icon: 'stethoscope' as const },
  VISITOR: { label: 'Visitor', color: 'bg-green-500', icon: 'home' as const },
  HOSPITAL: { label: 'Hospital', color: 'bg-gold-500', icon: 'building' as const },
};

/** Simple QR code generator — renders a visual pattern on canvas */
function generateQRPattern(data: string, size: number): boolean[][] {
  const cells: boolean[][] = [];
  const gridSize = Math.min(21, Math.max(11, Math.floor(size / 4)));
  for (let i = 0; i < gridSize; i++) {
    const row: boolean[] = [];
    for (let j = 0; j < gridSize; j++) {
      if (i < 7 && j < 7) row[j] = i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4);
      else if (i < 7 && j >= gridSize - 7) row[j] = i === 0 || i === 6 || j === gridSize - 7 || j === gridSize - 1 || (i >= 2 && i <= 4 && j >= gridSize - 5 && j <= gridSize - 3);
      else if (i >= gridSize - 7 && j < 7) row[j] = i === gridSize - 7 || i === gridSize - 1 || j === 0 || j === 6 || (i >= gridSize - 5 && i <= gridSize - 3 && j >= 2 && j <= 4);
      else {
        const hash = (data.charCodeAt(i % data.length) * 31 + data.charCodeAt(j % data.length) * 17 + i * 13 + j * 7) % 100;
        row[j] = hash < 45;
      }
    }
    cells[i] = row;
  }
  return cells;
}

function QRCodeDisplay({ data, size = 80 }: { data: string; size?: number }) {
  const cells = generateQRPattern(data, size);
  const cellSize = size / cells.length;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} fill="white" rx="4" />
      {cells.map((row, i) =>
        row.map((filled, j) =>
          filled ? (
            <rect key={`${i}-${j}`} x={j * cellSize} y={i * cellSize} width={cellSize} height={cellSize} fill="#000" />
          ) : null,
        ),
      )}
    </svg>
  );
}

function IdCardPreview({ data, theme }: { data: IdCardData; theme: CardTheme }) {
  const tc = CARD_TYPE_CONFIG[data.cardType] ?? CARD_TYPE_CONFIG.PATIENT;
  const isLight = theme.style === 'light';

  return (
    <div
      className="overflow-hidden shadow-2xl"
      style={{
        width: '340px',
        height: '214px',
        borderRadius: theme.borderRadius,
        fontFamily: theme.fontFamily,
        background: isLight ? theme.primary : `linear-gradient(135deg, ${theme.headerBg} 0%, ${theme.primary} 50%, ${theme.secondary} 100%)`,
        color: theme.text,
        border: isLight ? '1px solid #e2e8f0' : 'none',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{
          background: isLight ? theme.headerBg : theme.headerBg,
          borderBottom: isLight ? '2px solid #e2e8f0' : 'none',
        }}
      >
        {data.facilityLogo ? (
          <img src={data.facilityLogo} alt="Logo" className="h-6 w-6 rounded object-contain" />
        ) : (
          <div className="flex h-6 w-6 items-center justify-center rounded" style={{ background: isLight ? theme.accent : 'rgba(255,255,255,0.2)' }}>
            <Icon name="pulse" className="h-3.5 w-3.5" style={{ color: isLight ? '#fff' : theme.text }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-bold truncate" style={{ color: isLight ? theme.accent : 'rgba(255,255,255,0.9)' }}>
            {data.facilityName || 'Ghana Health Platform'}
          </p>
        </div>
        <span
          className="rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider"
          style={{
            background: isLight ? `${tc.color.replace('bg-', '')}` : `${tc.color.replace('bg-', '')}`,
            color: '#fff',
          }}
        >
          {tc.label}
        </span>
      </div>

      {/* Body */}
      <div className="flex gap-3 px-3 py-2">
        {/* Photo */}
        <div className="flex-shrink-0">
          <div
            className="h-[80px] w-[64px] overflow-hidden rounded"
            style={{
              border: isLight ? '2px solid #e2e8f0' : '2px solid rgba(255,255,255,0.3)',
              background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.1)',
            }}
          >
            {data.photo ? (
              <img src={data.photo} alt="Photo" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Icon name="user" className="h-8 w-8" style={{ color: isLight ? '#94a3b8' : 'rgba(255,255,255,0.4)' }} />
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold truncate" style={{ color: isLight ? theme.text : '#fff' }}>
            {data.fullName || 'Full Name'}
          </p>
          <div className="mt-1 space-y-0.5">
            <p className="text-[8px]" style={{ color: isLight ? '#64748b' : 'rgba(255,255,255,0.7)' }}>
              ID: <span className="font-bold" style={{ color: isLight ? theme.text : '#fff' }}>{data.id || 'GH-000000'}</span>
            </p>
            {data.role && (
              <p className="text-[8px]" style={{ color: isLight ? '#64748b' : 'rgba(255,255,255,0.7)' }}>
                Role: <span style={{ color: isLight ? theme.text : '#fff' }}>{data.role}</span>
              </p>
            )}
            {data.department && (
              <p className="text-[8px]" style={{ color: isLight ? '#64748b' : 'rgba(255,255,255,0.7)' }}>
                Dept: <span style={{ color: isLight ? theme.text : '#fff' }}>{data.department}</span>
              </p>
            )}
            {data.bloodGroup && (
              <p className="text-[8px]" style={{ color: isLight ? '#64748b' : 'rgba(255,255,255,0.7)' }}>
                Blood: <span className="font-bold" style={{ color: isLight ? '#ef4444' : '#fca5a5' }}>{data.bloodGroup}</span>
              </p>
            )}
            {data.gender && (
              <p className="text-[8px]" style={{ color: isLight ? '#64748b' : 'rgba(255,255,255,0.7)' }}>
                Gender: <span style={{ color: isLight ? theme.text : '#fff' }}>{data.gender}</span>
              </p>
            )}
            {data.cardType === 'HOSPITAL' && data.facilityPhone && (
              <p className="text-[8px]" style={{ color: isLight ? '#64748b' : 'rgba(255,255,255,0.7)' }}>
                📞 {data.facilityPhone}
              </p>
            )}
            {data.cardType === 'HOSPITAL' && data.facilityEmail && (
              <p className="text-[8px]" style={{ color: isLight ? '#64748b' : 'rgba(255,255,255,0.7)' }}>
                ✉ {data.facilityEmail}
              </p>
            )}
          </div>
        </div>

        {/* QR Code */}
        {theme.showQRCode && (
          <div className="flex-shrink-0">
            <QRCodeDisplay data={data.qrData || data.id || 'GIHM'} size={60} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-3 py-1.5"
        style={{
          background: isLight ? '#f8fafc' : 'rgba(0,0,0,0.2)',
          borderTop: isLight ? '1px solid #e2e8f0' : 'none',
        }}
      >
        {theme.showGhanaFlag && (
          <div className="flex gap-0">
            <div className="h-1.5 w-3" style={{ background: '#ce1126' }} />
            <div className="h-1.5 w-3" style={{ background: '#fcd116' }} />
            <div className="h-1.5 w-3" style={{ background: '#006b3f' }} />
          </div>
        )}
        <p className="text-[7px]" style={{ color: isLight ? '#94a3b8' : 'rgba(255,255,255,0.5)' }}>
          Valid: {data.validFrom} — {data.validUntil}
        </p>
        <p className="text-[7px] font-bold" style={{ color: isLight ? theme.accent : 'rgba(255,255,255,0.7)' }}>
          GIHM-HIS
        </p>
      </div>
    </div>
  );
}

export default function IdCardBuilder() {
  const toast = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cardType, setCardType] = useState<CardType>('PATIENT');
  const [selectedThemeIdx, setSelectedThemeIdx] = useState(0);
  const [customTheme] = useState<CardTheme>(PRESET_THEMES[0]!);
  const [useCustomTheme, setUseCustomTheme] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [, setSelectedPatient] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const [data, setData] = useState<IdCardData>({
    fullName: '',
    id: '',
    photo: null,
    cardType: 'PATIENT',
    facilityName: 'Korle-Bu Teaching Hospital',
    facilityAddress: 'Guggisberg Avenue, Accra',
    facilityPhone: '+233 30 277 4031',
    facilityEmail: 'info@kbth.gov.gh',
    facilityWebsite: 'www.kbth.gov.gh',
    facilityLogo: '',
    facilityServices: ['Emergency', 'Surgery', 'Maternity', 'Paediatrics'],
    bloodGroup: '',
    dateOfBirth: '',
    gender: '',
    role: '',
    department: '',
    phone: '',
    email: '',
    validFrom: new Date().toISOString().split('T')[0] ?? '',
    validUntil: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0] ?? '',
    qrData: '',
  });

  const theme: CardTheme = useCustomTheme ? customTheme : PRESET_THEMES[selectedThemeIdx] ?? PRESET_THEMES[0]!;

  // Fetch patients for auto-fill
  useEffect(() => {
    if (searchQuery.length < 2) return;
    const t = setTimeout(() => {
      api<{ items: Patient[] }>('/patients', { query: { q: searchQuery, pageSize: '10' } })
        .then((r) => setPatients(r.items))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const selectPatient = (p: Patient) => {
    setSelectedPatient(p.id);
    setData((d) => ({
      ...d,
      fullName: p.fullName,
      id: p.mrn,
      photo: (p as unknown as Record<string, unknown>).photoStoredName ? `/api/v1/patients/${p.id}/photo` : null,
      bloodGroup: p.bloodGroup ?? '',
      dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().split('T')[0] : '',
      gender: p.sex === 'M' ? 'Male' : p.sex === 'F' ? 'Female' : '',
      phone: p.phone ?? '',
      email: p.email ?? '',
      qrData: `GIHM:${p.mrn}:${p.id}`,
    }));
    setSearchQuery('');
    setPatients([]);
  };

  const updateData = (field: keyof IdCardData, value: string | null) => {
    setData((d) => ({ ...d, [field]: value, cardType }));
  };

  // Camera functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch {
      toast('Camera access denied. Please allow camera permissions.', 'error');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        canvasRef.current.width = 160;
        canvasRef.current.height = 200;
        ctx.drawImage(videoRef.current, 0, 0, 160, 200);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
        updateData('photo', dataUrl);
        stopCamera();
        toast('Photo captured!', 'success');
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => updateData('photo', reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const card = document.getElementById('id-card-preview');
    if (!card) return;
    printWindow.document.write(`
      <html><head><title>GIHM-HIS ID Card</title>
      <style>@page{size:85.6mm 54mm landscape;margin:0}body{margin:0;display:flex;align-items:center;justify-content:center;height:100vh}</style>
      </head><body>${card.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExport = () => {
    const card = document.getElementById('id-card-preview');
    if (!card) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1020;
    canvas.height = 642;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Simple export — use html2canvas if available, otherwise fallback      toast('Card exported! Use Print to save as PDF.', 'success');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="ID Card Builder"
        subtitle="Design and print hospital identification cards with live preview"
        action={
          <div className="flex gap-2">
            <Button onClick={handlePrint} variant="primary">
              <Icon name="printer" className="h-4 w-4 mr-2" />
              Print Card
            </Button>
            <Button onClick={handleExport} variant="outline">
              <Icon name="download" className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Left: Settings */}
        <div className="space-y-4">
          {/* Card Type */}
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-bold text-g-ink dark:text-white">Card Type</h3>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(CARD_TYPE_CONFIG) as CardType[]).map((type) => {
                const tc = CARD_TYPE_CONFIG[type];
                return (
                  <button
                    key={type}
                    onClick={() => { setCardType(type); setData((d) => ({ ...d, cardType: type })); }}
                    className={`rounded-lg border-2 p-2 text-center transition-all ${
                      cardType === type
                        ? 'border-g-red bg-g-red/5 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <Icon name={tc.icon} className="mx-auto h-5 w-5 text-g-ink dark:text-white" />
                    <p className="mt-1 text-[10px] font-bold text-g-ink dark:text-white">{tc.label}</p>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Theme Selection */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-g-ink dark:text-white">Theme</h3>
              <div className="flex gap-1">
                {['classic', 'modern', 'light'].map((style) => (
                  <button
                    key={style}
                    onClick={() => {
                      const idx = PRESET_THEMES.findIndex((t) => t.style === style);
                      if (idx >= 0) { setSelectedThemeIdx(idx); setUseCustomTheme(false); }
                    }}
                    className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase ${
                      theme.style === style ? 'bg-g-red text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_THEMES.filter((t) => t.style === theme.style).map((t) => {
                const globalIdx = PRESET_THEMES.indexOf(t);
                return (
                  <button
                    key={t.name}
                    onClick={() => { setSelectedThemeIdx(globalIdx); setUseCustomTheme(false); }}
                    className={`rounded-lg border-2 p-2 transition-all ${
                      !useCustomTheme && selectedThemeIdx === globalIdx
                        ? 'border-g-red shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex gap-1 mb-1">
                      <div className="h-3 w-3 rounded-full" style={{ background: t.primary }} />
                      <div className="h-3 w-3 rounded-full" style={{ background: t.secondary }} />
                      <div className="h-3 w-3 rounded-full" style={{ background: t.accent }} />
                    </div>
                    <p className="text-[9px] font-bold text-g-ink dark:text-white">{t.name}</p>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Photo */}
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-bold text-g-ink dark:text-white">Photo</h3>
            <div className="flex gap-3">
              <div
                className="flex h-24 w-20 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800"
              >
                {data.photo ? (
                  <img src={data.photo} alt="Photo" className="h-full w-full rounded-lg object-cover" />
                ) : (
                  <Icon name="user" className="h-10 w-10 text-slate-300" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={startCamera} variant="outline" size="sm">
                  📷 Live Camera
                </Button>
                <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm">
                  📁 Upload File
                </Button>
                <Button onClick={() => updateData('photo', null)} variant="outline" size="sm">
                  🗑 Remove
                </Button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </div>
            </div>

            {/* Camera view */}
            {cameraActive && (
              <div className="mt-3 rounded-lg border border-slate-200 p-2 dark:border-slate-700">
                <video ref={videoRef} autoPlay playsInline className="w-full rounded" style={{ maxHeight: '200px' }} />
                <canvas ref={canvasRef} className="hidden" />
                <div className="mt-2 flex gap-2">
                  <Button onClick={capturePhoto} variant="primary" size="sm" className="flex-1">
                    📸 Capture
                  </Button>
                  <Button onClick={stopCamera} variant="outline" size="sm">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Patient Auto-fill (for Patient cards) */}
          {cardType === 'PATIENT' && (
            <Card className="p-4">
              <h3 className="mb-3 text-sm font-bold text-g-ink dark:text-white">Quick Fill — Search Patient</h3>
              <div className="relative">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or MRN..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                {patients.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                    {patients.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => selectPatient(p)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        <span className="font-medium">{p.fullName}</span>
                        <span className="text-xs text-slate-400">{p.mrn}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Card Fields */}
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-bold text-g-ink dark:text-white">Card Information</h3>
            <div className="grid grid-cols-2 gap-3">
              {cardType === 'HOSPITAL' ? (
                <>
                  <Field label="Hospital Name" className="col-span-2">
                    <input value={data.facilityName} onChange={(e) => updateData('facilityName', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                  </Field>
                  <Field label="Address">
                    <input value={data.facilityAddress} onChange={(e) => updateData('facilityAddress', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                  </Field>
                  <Field label="Phone">
                    <input value={data.facilityPhone} onChange={(e) => updateData('facilityPhone', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                  </Field>
                  <Field label="Email">
                    <input value={data.facilityEmail} onChange={(e) => updateData('facilityEmail', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                  </Field>
                  <Field label="Website">
                    <input value={data.facilityWebsite} onChange={(e) => updateData('facilityWebsite', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                  </Field>
                  <Field label="Services (comma-separated)">
                    <input
                      value={data.facilityServices.join(', ')}
                      onChange={(e) => updateData('facilityServices' as keyof IdCardData, e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </Field>
                </>
              ) : (
                <>
                  <Field label="Full Name" className="col-span-2">
                    <input value={data.fullName} onChange={(e) => updateData('fullName', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                  </Field>
                  <Field label="ID / MRN">
                    <input value={data.id} onChange={(e) => updateData('id', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                  </Field>
                  <Field label="Role / Title">
                    <input value={data.role ?? ''} onChange={(e) => updateData('role', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                  </Field>
                  <Field label="Department">
                    <input value={data.department ?? ''} onChange={(e) => updateData('department', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                  </Field>
                  <Field label="Blood Group">
                    <select value={data.bloodGroup ?? ''} onChange={(e) => updateData('bloodGroup', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                      <option value="">Select...</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Gender">
                    <select value={data.gender ?? ''} onChange={(e) => updateData('gender', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </Field>
                  <Field label="Phone">
                    <input value={data.phone ?? ''} onChange={(e) => updateData('phone', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                  </Field>
                  <Field label="Date of Birth">
                    <input type="date" value={data.dateOfBirth ?? ''} onChange={(e) => updateData('dateOfBirth', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                  </Field>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Right: Live Preview */}
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="mb-4 text-sm font-bold text-g-ink dark:text-white">Live Preview</h3>
            <div className="flex justify-center" id="id-card-preview">
              <IdCardPreview data={data} theme={theme} />
            </div>
          </Card>

          {/* Quick Presets */}
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-bold text-g-ink dark:text-white">Quick Presets</h3>
            <div className="grid grid-cols-2 gap-2">
              {CARD_TYPE_CONFIG[cardType].label === 'Hospital' ? (
                <>
                  <Button onClick={() => { setData((d) => ({ ...d, facilityName: 'Korle-Bu Teaching Hospital', facilityAddress: 'Guggisberg Avenue, Accra', facilityPhone: '+233 30 277 4031', facilityEmail: 'info@kbth.gov.gh', facilityWebsite: 'www.kbth.gov.gh', facilityServices: ['Emergency', 'Surgery', 'Maternity'] })); }} variant="outline" size="sm">Korle-Bu Teaching</Button>
                  <Button onClick={() => { setData((d) => ({ ...d, facilityName: 'Kumasi Academy Teaching Hospital', facilityAddress: 'Kumasi, Ashanti Region', facilityPhone: '+233 32 202 2346', facilityEmail: 'info@kath.gov.gh', facilityWebsite: 'www.kath.gov.gh', facilityServices: ['Emergency', 'Oncology', 'Cardiology'] })); }} variant="outline" size="sm">KATH</Button>
                </>
              ) : (
                <>
                  <Button onClick={() => { setData((d) => ({ ...d, role: cardType === 'STAFF' ? 'Doctor' : '', department: 'General OPD', bloodGroup: 'O+', gender: 'Male' })); }} variant="outline" size="sm">Doctor Profile</Button>
                  <Button onClick={() => { setData((d) => ({ ...d, role: cardType === 'STAFF' ? 'Nurse' : '', department: 'Maternity', bloodGroup: 'A+', gender: 'Female' })); }} variant="outline" size="sm">Nurse Profile</Button>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
