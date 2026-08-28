import { useState } from 'react';
import { Badge, Button, Card, Field, Input, PageHeader, useToast } from '../../components/ui';
import { fmtDateTime } from '../../lib/format';

interface BackupEntry {
  id: string;
  name: string;
  type: 'manual' | 'auto' | 'scheduled';
  size: string;
  status: 'completed' | 'in_progress' | 'failed';
  createdAt: string;
  includes: string[];
}

const DEMO_BACKUPS: BackupEntry[] = [
  { id: '1', name: 'Auto Backup — Daily', type: 'auto', size: '12.4 MB', status: 'completed', createdAt: new Date(Date.now() - 86400000).toISOString(), includes: ['patients', 'pharmacy', 'billing', 'audit'] },
  { id: '2', name: 'Auto Backup — Daily', type: 'auto', size: '12.3 MB', status: 'completed', createdAt: new Date(Date.now() - 172800000).toISOString(), includes: ['patients', 'pharmacy', 'billing', 'audit'] },
  { id: '3', name: 'Manual Backup — Before Update', type: 'manual', size: '12.2 MB', status: 'completed', createdAt: new Date(Date.now() - 604800000).toISOString(), includes: ['patients', 'pharmacy', 'billing', 'audit', 'staff', 'settings'] },
  { id: '4', name: 'Auto Backup — Daily', type: 'auto', size: '12.1 MB', status: 'completed', createdAt: new Date(Date.now() - 259200000).toISOString(), includes: ['patients', 'pharmacy', 'billing', 'audit'] },
];

const TABLES = ['patients', 'encounters', 'prescriptions', 'lab_results', 'pharmacy', 'billing', 'insurance', 'appointments', 'staff', 'audit_log', 'settings', 'immunizations', 'admissions', 'stock'];

export default function SystemBackup() {
  const toast = useToast();
  const [backups, setBackups] = useState<BackupEntry[]>(DEMO_BACKUPS);
  const [creating, setCreating] = useState(false);
  const [backupName, setBackupName] = useState('');
  const [selectedTables, setSelectedTables] = useState<string[]>(TABLES);
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupSchedule, setBackupSchedule] = useState('daily');
  const [lastBackup, setLastBackup] = useState<string>(DEMO_BACKUPS[0]?.createdAt ?? '');

  function toggleTable(table: string) {
    setSelectedTables((prev) =>
      prev.includes(table) ? prev.filter((t) => t !== table) : [...prev, table]
    );
  }

  function selectAll() {
    setSelectedTables(TABLES);
  }

  function deselectAll() {
    setSelectedTables([]);
  }

  async function createBackup() {
    setCreating(true);
    const name = backupName || `Manual Backup — ${new Date().toLocaleDateString()}`;

    // Simulate backup creation
    await new Promise((r) => setTimeout(r, 3000));

    const newBackup: BackupEntry = {
      id: String(Date.now()),
      name,
      type: 'manual',
      size: `${(10 + Math.random() * 5).toFixed(1)} MB`,
      status: 'completed',
      createdAt: new Date().toISOString(),
      includes: selectedTables,
    };

    setBackups([newBackup, ...backups]);
    setLastBackup(newBackup.createdAt);
    setBackupName('');
    setCreating(false);
    toast('Backup created successfully', 'success');
  }

  function downloadBackup(backup: BackupEntry) {
    const data = {
      backup: {
        id: backup.id,
        name: backup.name,
        type: backup.type,
        createdAt: backup.createdAt,
        includes: backup.includes,
        system: 'GIHM-HIS',
        version: '2.1.0',
        developer: 'ShaComputeC',
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GIHM-backup-${backup.id}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast('Backup downloaded', 'success');
  }

  function restoreBackup(backup: BackupEntry) {
    if (!window.confirm(`Restore backup "${backup.name}" from ${new Date(backup.createdAt).toLocaleString()}? This will overwrite current data.`)) return;
    toast('Restore initiated — this may take a few minutes', 'info');
  }

  const typeBadge: Record<string, string> = {
    manual: 'bg-blue-100 text-blue-700',
    auto: 'bg-green-100 text-green-700',
    scheduled: 'bg-purple-100 text-purple-700',
  };

  return (
    <div>
      <PageHeader
        title="System Backup & Restore"
        subtitle={`Protect your data with automatic backups. Last backup: ${lastBackup ? fmtDateTime(lastBackup) : 'Never'}`}
        action={
          <Button variant="green" loading={creating} onClick={() => void createBackup()}>
            💾 Create Backup Now
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Create Backup */}
        <Card title="Create New Backup">
          <div className="space-y-4">
            <Field label="Backup Name (optional)">
              <Input value={backupName} onChange={(e) => setBackupName(e.target.value)} placeholder="e.g. Before migration" />
            </Field>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Tables to Include</p>
                <div className="flex gap-2">
                  <button onClick={selectAll} className="text-xs font-bold text-blue-600 hover:underline">Select All</button>
                  <button onClick={deselectAll} className="text-xs font-bold text-slate-500 hover:underline">Deselect All</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {TABLES.map((t) => (
                  <label key={t} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs transition hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={selectedTables.includes(t)}
                      onChange={() => toggleTable(t)}
                      className="h-3.5 w-3.5 accent-blue-600"
                    />
                    <span className="font-medium text-slate-700">{t}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button variant="green" loading={creating} onClick={() => void createBackup()} className="w-full">
              💾 Backup {selectedTables.length} Tables
            </Button>
          </div>
        </Card>

        {/* Backup Settings */}
        <Card title="Backup Settings">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={autoBackup} onChange={(e) => setAutoBackup(e.target.checked)} className="h-4 w-4 accent-green-600" />
                <span className="text-sm font-semibold text-slate-700">Enable Automatic Backups</span>
              </label>
            </div>

            {autoBackup && (
              <Field label="Backup Schedule">
                <select value={backupSchedule} onChange={(e) => setBackupSchedule(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="hourly">Every Hour</option>
                  <option value="daily">Daily (recommended)</option>
                  <option value="weekly">Weekly</option>
                </select>
              </Field>
            )}

            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-xs font-bold text-blue-700">📊 Backup Stats</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-blue-600">
                <p>Total backups: <strong>{backups.length}</strong></p>
                <p>Last backup: <strong>{lastBackup ? fmtDateTime(lastBackup) : 'Never'}</strong></p>
                <p>Total size: <strong>~{backups.length * 12} MB</strong></p>
                <p>Tables backed up: <strong>{TABLES.length}</strong></p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Backup History */}
      <Card title="Backup History" className="mt-5">
        {backups.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No backups yet. Create your first backup above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Size</th>
                  <th className="px-5 py-3">Tables</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {backups.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-semibold text-slate-800">{b.name}</td>
                    <td className="px-5 py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${typeBadge[b.type]}`}>{b.type}</span></td>
                    <td className="px-5 py-3 text-slate-600">{b.size}</td>
                    <td className="px-5 py-3"><Badge tone="navy">{b.includes.length} tables</Badge></td>
                    <td className="px-5 py-3"><Badge tone={b.status === 'completed' ? 'green' : b.status === 'in_progress' ? 'gold' : 'red'}>{b.status}</Badge></td>
                    <td className="px-5 py-3 text-xs text-slate-400">{fmtDateTime(b.createdAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => downloadBackup(b)} className="text-xs font-bold text-blue-600 hover:underline">Download</button>
                        <button onClick={() => restoreBackup(b)} className="text-xs font-bold text-amber-600 hover:underline">Restore</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
