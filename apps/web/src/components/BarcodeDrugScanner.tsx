import { useState, useRef, useEffect } from 'react';
import { api } from '../lib/api';
import { Badge, Button, Card, Field, Icon, Input, useToast } from './ui';

interface Drug {
  id: string;
  name: string;
  genericName?: string;
  brandNames?: string;
  category: string;
  dosageForm?: string;
  strength?: string;
  route?: string;
  adultDose?: string;
  pediatricDose?: string;
  sideEffects?: string;
  contraindications?: string;
  pregnancyCategory?: string;
  description?: string;
}

// Known barcode prefixes for common drug identification systems
const BARCODE_DATABASES: Record<string, string> = {
  '300': 'EAN-13 (International)',
  '501': 'EAN-13 (UK)',
  '600': 'EAN-13 (South Africa)',
  '629': 'EAN-13 (UAE)',
  '890': 'EAN-13 (India)',
  '891': 'EAN-13 (India)',
  '893': 'EAN-13 (Vietnam)',
  '895': 'EAN-13 (Indonesia)',
  '896': 'EAN-13 (Bangladesh)',
  '899': 'EAN-13 (Indonesia)',
  '840': 'EAN-13 (Spain)',
  '841': 'EAN-13 (Spain)',
  '842': 'EAN-13 (Spain)',
  '843': 'EAN-13 (Spain)',
  '844': 'EAN-13 (Spain)',
  '845': 'EAN-13 (Spain)',
  '846': 'EAN-13 (Spain)',
  '847': 'EAN-13 (Spain)',
  '848': 'EAN-13 (Spain)',
  '849': 'EAN-13 (Spain)',
};

interface ScanResult {
  code: string;
  format: string;
  country: string;
  drugMatch: Drug | null;
  allMatches: Drug[];
}

export default function BarcodeDrugScanner() {
  const toast = useToast();
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [recentScans, setRecentScans] = useState<Array<{ code: string; drug: string; time: string }>>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  async function lookupBarcode(code: string) {
    if (!code.trim()) {
      toast('Please enter a barcode', 'error');
      return;
    }

    setScanning(true);
    try {
      // Search drugs by barcode/code
      const res = await api<{ items: Drug[] }>(`/drugs?search=${encodeURIComponent(code)}&pageSize=10`);
      const allMatches = res.items;

      // Try to match by name, brand name, or generic name
      const exactMatch = allMatches.find(
        (d) =>
          d.name.toLowerCase().includes(code.toLowerCase()) ||
          d.brandNames?.toLowerCase().includes(code.toLowerCase()) ||
          d.genericName?.toLowerCase().includes(code.toLowerCase()),
      );

      // Identify barcode format
      const prefix = code.substring(0, 3);
      const format = code.length === 13 ? 'EAN-13' : code.length === 12 ? 'UPC-A' : code.length === 8 ? 'EAN-8' : 'Unknown';
      const country = BARCODE_DATABASES[prefix] ?? `Unknown (${prefix})`;

      const scanResult: ScanResult = {
        code,
        format,
        country,
        drugMatch: exactMatch ?? null,
        allMatches,
      };

      setResult(scanResult);

      if (exactMatch) {
        toast(`Found: ${exactMatch.name}`, 'success');
        setRecentScans((prev) => [
          { code, drug: exactMatch.name, time: new Date().toLocaleTimeString() },
          ...prev.slice(0, 9),
        ]);
      } else if (allMatches.length > 0) {
        toast(`Found ${allMatches.length} potential matches`, 'info');
      } else {
        toast('No drugs found matching this barcode', 'error');
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Lookup failed', 'error');
    } finally {
      setScanning(false);
    }
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      toast('Camera started. Point at a barcode.', 'info');
    } catch {
      toast('Camera access denied. Use manual entry instead.', 'error');
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  return (
    <Card title="📷 Barcode Drug Scanner" subtitle="Scan drug barcodes or enter codes manually for quick identification">
      <div className="space-y-4">
        {/* Manual Entry */}
        <div className="flex gap-2">
          <Field label="Barcode / Product Code" className="flex-1">
            <div className="relative">
              <Icon name="search" className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter barcode, drug name, or brand name…"
                className="pl-9"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void lookupBarcode(manualCode);
                }}
              />
            </div>
          </Field>
          <div className="flex gap-2">
            <Button variant="green" onClick={() => void lookupBarcode(manualCode)} loading={scanning}>
              Look up
            </Button>
            <Button variant="outline" onClick={() => void startCamera()}>
              📷 Scan
            </Button>
          </div>
        </div>

        {/* Camera View */}
        <div className="relative rounded-lg border border-slate-200 bg-black" style={{ display: streamRef.current ? 'block' : 'none' }}>
          <video ref={videoRef} className="w-full rounded-lg" style={{ maxHeight: 300 }} playsInline muted />
          <div className="absolute bottom-2 right-2">
            <Button size="sm" variant="outline" onClick={stopCamera}>
              Stop camera
            </Button>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-0.5 w-2/3 bg-red-500 opacity-50" />
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge tone="blue">{result.format}</Badge>
              <Badge tone="gray">{result.country}</Badge>
              <span className="font-mono text-sm text-g-ink">{result.code}</span>
            </div>

            {result.drugMatch ? (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="text-xs font-bold uppercase text-green-600">✅ Drug Match Found</p>
                <h3 className="mt-1 text-lg font-bold text-g-ink">{result.drugMatch.name}</h3>
                {result.drugMatch.genericName && <p className="text-sm text-slate-500">{result.drugMatch.genericName}</p>}
                <div className="mt-2 flex flex-wrap gap-1">
                  <Badge tone="blue">{result.drugMatch.category}</Badge>
                  {result.drugMatch.dosageForm && <Badge tone="gray">{result.drugMatch.dosageForm}</Badge>}
                  {result.drugMatch.strength && <Badge tone="gray">{result.drugMatch.strength}</Badge>}
                  {result.drugMatch.route && <Badge tone="gray">{result.drugMatch.route}</Badge>}
                </div>
                {result.drugMatch.adultDose && (
                  <p className="mt-2 text-sm text-g-ink"><strong>Dose:</strong> {result.drugMatch.adultDose}</p>
                )}
                {result.drugMatch.pediatricDose && (
                  <p className="text-sm text-g-ink"><strong>Pediatric:</strong> {result.drugMatch.pediatricDose}</p>
                )}
                {result.drugMatch.sideEffects && (
                  <p className="mt-1 text-xs text-amber-700"><strong>Side effects:</strong> {result.drugMatch.sideEffects}</p>
                )}
                {result.drugMatch.pregnancyCategory && (
                  <p className="text-xs text-red-600"><strong>Pregnancy:</strong> Category {result.drugMatch.pregnancyCategory}</p>
                )}
                {result.drugMatch.description && (
                  <p className="mt-2 text-xs text-slate-600">{result.drugMatch.description}</p>
                )}
              </div>
            ) : result.allMatches.length > 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-bold text-amber-600">⚠️ Potential matches (barcode not directly matched)</p>
                <div className="mt-2 space-y-1">
                  {result.allMatches.slice(0, 5).map((d) => (
                    <button
                      key={d.id}
                      onClick={() => lookupBarcode(d.name)}
                      className="block w-full rounded bg-white px-3 py-2 text-left text-sm hover:bg-amber-100"
                    >
                      <span className="font-semibold text-g-ink">{d.name}</span>
                      {d.genericName && <span className="ml-2 text-xs text-slate-400">{d.genericName}</span>}
                      <span className="ml-2 text-xs text-slate-500">{d.category}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-600">No drug found matching barcode <code>{result.code}</code>.</p>
                <p className="mt-1 text-xs text-slate-500">Try entering the drug name or brand name instead.</p>
              </div>
            )}
          </div>
        )}

        {/* Recent Scans */}
        {recentScans.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-bold uppercase text-slate-400">Recent scans</p>
            <div className="space-y-1">
              {recentScans.map((scan, i) => (
                <button
                  key={i}
                  onClick={() => void lookupBarcode(scan.code)}
                  className="flex w-full items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-left text-xs hover:bg-slate-100"
                >
                  <span className="font-medium text-g-ink">{scan.drug}</span>
                  <span className="font-mono text-slate-400">{scan.code}</span>
                  <span className="text-slate-400">{scan.time}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
