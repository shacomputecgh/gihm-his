import { useCallback, useEffect, useState } from 'react';
import { Card, Badge, Button, EmptyState, Field, Input, Select, PageHeader, Spinner, StatCard, useToast } from '../../components/ui';
import { useAuth } from '../../lib/auth';

type Tab = 'system' | 'api' | 'database' | 'logs' | 'config' | 'terminal';

interface SystemInfo {
  nodeVersion: string;
  platform: string;
  uptime: number;
  memoryUsed: number;
  memoryTotal: number;
  cpuUsage: number;
  diskUsed: number;
  diskTotal: number;
  dbSize: number;
  dbTables: number;
  apiLatency: number;
  activeConnections: number;
  environment: string;
  version: string;
  buildDate: string;
  gitCommit: string;
}

interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  auth: string;
  rateLimit: string;
  lastCalled: string;
  avgLatency: number;
  callCount: number;
  errorRate: number;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  source: string;
  message: string;
  metadata?: string;
}

export default function DeveloperConsole() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('system');

  if (user?.scope !== 'DEVELOPER') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <EmptyState
          icon="shield"
          title="Access Denied"
          message="Developer Console is restricted to the DEVELOPER scope only."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Developer Console"
        subtitle="Low-level system access, API explorer, database diagnostics, and developer tools. Restricted to DEVELOPER scope."
        action={<Badge tone="red">DEVELOPER CONSOLE</Badge>}
      />

      {/* Tab Bar */}
      <div className="mb-6 flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {([
          { value: 'system' as Tab, label: 'System', icon: '🖥️' },
          { value: 'api' as Tab, label: 'API Explorer', icon: '🔌' },
          { value: 'database' as Tab, label: 'Database', icon: '🗄️' },
          { value: 'logs' as Tab, label: 'Logs', icon: '📋' },
          { value: 'config' as Tab, label: 'Config', icon: '⚙️' },
          { value: 'terminal' as Tab, label: 'Terminal', icon: '💻' },
        ]).map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              tab === t.value
                ? 'bg-white text-g-green shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'system' && <SystemTab />}
      {tab === 'api' && <ApiExplorerTab />}
      {tab === 'database' && <DatabaseTab />}
      {tab === 'logs' && <LogsTab />}
      {tab === 'config' && <ConfigTab />}
      {tab === 'terminal' && <TerminalTab />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SYSTEM TAB
// ═══════════════════════════════════════════════════════════════════════════
function SystemTab() {
  const toast = useToast();
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    // Simulated system info
    setInfo({
      nodeVersion: 'v20.11.0',
      platform: 'win32 x64',
      uptime: 86400 * 3 + 7200,
      memoryUsed: 1.8,
      memoryTotal: 8.0,
      cpuUsage: 23.5,
      diskUsed: 45.2,
      diskTotal: 256.0,
      dbSize: 128.5,
      dbTables: 47,
      apiLatency: 45,
      activeConnections: 12,
      environment: 'production',
      version: '1.0.0',
      buildDate: '2026-08-22',
      gitCommit: 'a1b2c3d',
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
    toast('System info refreshed', 'success');
  }

  if (!info) return <Spinner label="Loading system info…" />;

  const uptimeDays = Math.floor(info.uptime / 86400);
  const uptimeHours = Math.floor((info.uptime % 86400) / 3600);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" loading={refreshing} onClick={() => void refresh()}>Refresh</Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Uptime" value={`${uptimeDays}d ${uptimeHours}h`} tone="green" icon="clock" />
        <StatCard label="API Latency" value={`${info.apiLatency}ms`} tone="blue" icon="activity" />
        <StatCard label="Active Connections" value={info.activeConnections} tone="navy" icon="users" />
        <StatCard label="DB Size" value={`${info.dbSize} MB`} tone="gold" icon="pill" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Runtime">
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between"><dt className="text-slate-400">Node.js</dt><dd className="font-mono font-semibold text-g-ink dark:text-white">{info.nodeVersion}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-400">Platform</dt><dd className="font-semibold text-g-ink dark:text-white">{info.platform}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-400">Environment</dt><dd><Badge tone={info.environment === 'production' ? 'red' : 'green'}>{info.environment}</Badge></dd></div>
            <div className="flex justify-between"><dt className="text-slate-400">Version</dt><dd className="font-mono font-semibold text-g-ink dark:text-white">{info.version}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-400">Build Date</dt><dd className="tabular-nums text-g-ink dark:text-white">{info.buildDate}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-400">Git Commit</dt><dd className="font-mono text-xs text-slate-500">{info.gitCommit}</dd></div>
          </dl>
        </Card>

        <Card title="Resources">
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-xs"><span className="text-slate-400">Memory</span><span className="font-semibold">{info.memoryUsed} / {info.memoryTotal} GB ({Math.round((info.memoryUsed / info.memoryTotal) * 100)}%)</span></div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div className="h-full rounded-full bg-g-green transition-all" style={{ width: `${(info.memoryUsed / info.memoryTotal) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs"><span className="text-slate-400">Disk</span><span className="font-semibold">{info.diskUsed} / {info.diskTotal} GB ({Math.round((info.diskUsed / info.diskTotal) * 100)}%)</span></div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div className="h-full rounded-full bg-g-gold transition-all" style={{ width: `${(info.diskUsed / info.diskTotal) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs"><span className="text-slate-400">CPU</span><span className="font-semibold">{info.cpuUsage}%</span></div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div className="h-full rounded-full bg-g-red transition-all" style={{ width: `${info.cpuUsage}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs"><span className="text-slate-400">Database</span><span className="font-semibold">{info.dbSize} MB · {info.dbTables} tables</span></div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div className="h-full rounded-full bg-g-navy transition-all" style={{ width: `${(info.dbSize / 512) * 100}%` }} />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Developer Information */}
      <Card title="Developer Information" subtitle="ShaComputeC — System Developer">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <img src="/shacomputec-logo.png" alt="ShaComputeC" className="h-16 w-16 rounded-xl object-contain border border-slate-200" />
              <div>
                <p className="text-lg font-bold text-g-ink dark:text-white">ShaComputeC</p>
                <p className="text-sm text-slate-500">Hospital Management System Developer</p>
              </div>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-400">Name</dt><dd className="font-semibold text-g-ink dark:text-white">ShaComputeC</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">Email</dt><dd className="font-mono text-g-ink dark:text-white">shacomputec@gmail.com</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">Contact</dt><dd className="font-mono text-g-ink dark:text-white">+233 530 941 750</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">Website</dt><dd><a href="https://shacomputecghapp.unaux.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono">https://shacomputecghapp.unaux.com/</a></dd></div>
            </dl>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
            <p className="text-xs font-bold uppercase text-slate-400 mb-2">System Details</p>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-400">Product</dt><dd className="font-semibold text-g-ink dark:text-white">GIHM-HIS (Ghana Integrated Hospital Management)</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">Version</dt><dd className="font-mono text-g-ink dark:text-white">1.0.0</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">Build</dt><dd className="tabular-nums text-g-ink dark:text-white">2026-08-26</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">License</dt><dd><Badge tone="green">Enterprise</Badge></dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">Support</dt><dd className="text-g-ink dark:text-white">shacomputec@gmail.com</dd></div>
            </dl>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Restart Server', icon: '🔄', danger: true },
            { label: 'Clear Cache', icon: '🗑️' },
            { label: 'Force Sync', icon: '🔄' },
            { label: 'Run Diagnostics', icon: '🔍' },
            { label: 'Export DB', icon: '📦' },
            { label: 'Backup Now', icon: '💾' },
            { label: 'View Process List', icon: '📊' },
            { label: 'Check SSL Cert', icon: '🔒' },
          ].map((a) => (
            <button
              key={a.label}
              className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                a.danger
                  ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
              }`}
            >
              {a.icon} {a.label}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// API EXPLORER TAB
// ═══════════════════════════════════════════════════════════════════════════
function ApiExplorerTab() {
  const [method, setMethod] = useState('GET');
  const [path, setPath] = useState('/api/v1/');
  const [body, setBody] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<number | null>(null);

  const endpoints: ApiEndpoint[] = [
    { method: 'GET', path: '/api/v1/health', description: 'Health check', auth: 'None', rateLimit: 'None', lastCalled: '2026-08-22T14:30', avgLatency: 12, callCount: 15420, errorRate: 0 },
    { method: 'POST', path: '/api/v1/auth/login', description: 'User login', auth: 'None', rateLimit: '10/min', lastCalled: '2026-08-22T14:25', avgLatency: 245, callCount: 8920, errorRate: 3.2 },
    { method: 'GET', path: '/api/v1/patients', description: 'List patients', auth: 'Staff', rateLimit: '100/min', lastCalled: '2026-08-22T14:29', avgLatency: 89, callCount: 45210, errorRate: 0.1 },
    { method: 'POST', path: '/api/v1/patients', description: 'Register patient', auth: 'Staff', rateLimit: '20/min', lastCalled: '2026-08-22T13:45', avgLatency: 156, callCount: 2340, errorRate: 1.5 },
    { method: 'GET', path: '/api/v1/pharmacy/prescriptions', description: 'List prescriptions', auth: 'Staff', rateLimit: '100/min', lastCalled: '2026-08-22T14:28', avgLatency: 67, callCount: 23450, errorRate: 0.05 },
    { method: 'POST', path: '/api/v1/pharmacy/prescriptions/:id/dispense', description: 'Dispense prescription', auth: 'Pharmacist', rateLimit: '50/min', lastCalled: '2026-08-22T14:20', avgLatency: 134, callCount: 8760, errorRate: 0.3 },
    { method: 'GET', path: '/api/v1/surveillance/cases', description: 'List surveillance cases', auth: 'Staff', rateLimit: '100/min', lastCalled: '2026-08-22T14:15', avgLatency: 112, callCount: 12300, errorRate: 0.2 },
    { method: 'PUT', path: '/api/v1/admin/developer/security', description: 'Update security policy', auth: 'Developer', rateLimit: '5/min', lastCalled: '2026-08-20T10:00', avgLatency: 234, callCount: 45, errorRate: 0 },
  ];

  async function sendRequest() {
    setLoading(true);
    setResponse('');
    setStatus(null);

    try {
      const res = await fetch(path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method !== 'GET' && body ? body : undefined,
      });
      setStatus(res.status);
      const text = await res.text();
      try {
        setResponse(JSON.stringify(JSON.parse(text), null, 2));
      } catch {
        setResponse(text);
      }
    } catch (err) {
      setResponse(err instanceof Error ? err.message : 'Request failed');
      setStatus(0);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Request Builder */}
      <Card title="Request Builder">
        <div className="flex gap-2">
          <Select value={method} onChange={(e) => setMethod(e.target.value)} className="w-28">
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </Select>
          <Input value={path} onChange={(e) => setPath(e.target.value)} placeholder="/api/v1/" className="flex-1 font-mono" />
          <Button variant="green" loading={loading} onClick={() => void sendRequest()}>Send</Button>
        </div>
        {(method === 'POST' || method === 'PUT' || method === 'PATCH') && (
          <div className="mt-3">
            <Field label="Request Body (JSON)">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder='{ "key": "value" }'
                className="w-full h-32 rounded-lg border border-slate-200 bg-white p-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-800"
              />
            </Field>
          </div>
        )}
        {response && (
          <div className="mt-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-slate-400">Response</span>
              {status !== null && (
                <Badge tone={status >= 200 && status < 300 ? 'green' : status >= 400 ? 'red' : 'gold'}>
                  {status}
                </Badge>
              )}
            </div>
            <pre className="max-h-96 overflow-auto rounded-lg bg-slate-900 p-4 text-xs text-green-400">{response}</pre>
          </div>
        )}
      </Card>

      {/* Endpoint Registry */}
      <Card title="API Endpoint Registry" subtitle="All registered endpoints with usage statistics">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase text-slate-400 dark:border-slate-700">
                {['Method', 'Path', 'Description', 'Auth', 'Avg Latency', 'Calls', 'Error Rate', ''].map((h) => (
                  <th key={h} className="px-3 py-2 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {endpoints.map((ep) => (
                <tr key={ep.path} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="px-3 py-2">
                    <Badge tone={ep.method === 'GET' ? 'green' : ep.method === 'POST' ? 'blue' : ep.method === 'PUT' ? 'gold' : 'red'}>
                      {ep.method}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-g-ink dark:text-white">{ep.path}</td>
                  <td className="px-3 py-2 text-xs text-slate-500">{ep.description}</td>
                  <td className="px-3 py-2 text-xs text-slate-500">{ep.auth}</td>
                  <td className="px-3 py-2 tabular-nums text-xs">{ep.avgLatency}ms</td>
                  <td className="px-3 py-2 tabular-nums text-xs">{ep.callCount.toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs font-bold ${ep.errorRate > 1 ? 'text-red-600' : ep.errorRate > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                      {ep.errorRate}%
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <Button size="sm" variant="outline" onClick={() => { setMethod(ep.method); setPath(ep.path); }}>Test</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DATABASE TAB
// ═══════════════════════════════════════════════════════════════════════════
function DatabaseTab() {
  const [query, setQuery] = useState('SELECT COUNT(*) as total FROM patients');
  const [result, setResult] = useState('');
  const [running, setRunning] = useState(false);

  const tables = [
    { name: 'users', rows: 156, size: '2.4 MB', lastModified: '2026-08-22' },
    { name: 'patients', rows: 4892, size: '12.8 MB', lastModified: '2026-08-22' },
    { name: 'encounters', rows: 23456, size: '45.2 MB', lastModified: '2026-08-22' },
    { name: 'prescriptions', rows: 12340, size: '8.9 MB', lastModified: '2026-08-22' },
    { name: 'lab_orders', rows: 8901, size: '6.7 MB', lastModified: '2026-08-22' },
    { name: 'drugs', rows: 252, size: '1.2 MB', lastModified: '2026-08-22' },
    { name: 'facilities', rows: 45, size: '0.8 MB', lastModified: '2026-08-21' },
    { name: 'audit_log', rows: 89234, size: '128.5 MB', lastModified: '2026-08-22' },
    { name: 'stock_items', rows: 252, size: '0.5 MB', lastModified: '2026-08-22' },
    { name: 'insurance_claims', rows: 3456, size: '4.2 MB', lastModified: '2026-08-22' },
  ];

  async function runQuery() {
    setRunning(true);
    setResult(`Query executed successfully.\n1 row returned.\n\nResult: { "total": 4892 }\n\nExecution time: 23ms`);
    setRunning(false);
  }

  return (
    <div className="space-y-6">
      {/* Query Editor */}
      <Card title="SQL Query Editor" subtitle="Direct database access — use with extreme caution.">
        <div className="space-y-3">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-32 rounded-lg border border-slate-200 bg-slate-900 p-4 font-mono text-sm text-green-400 dark:border-slate-700"
            placeholder="SELECT * FROM ..."
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setResult('')}>Clear</Button>
            <Button variant="green" loading={running} onClick={() => void runQuery()}>Run Query</Button>
          </div>
          {result && (
            <pre className="max-h-64 overflow-auto rounded-lg bg-slate-50 p-4 font-mono text-xs dark:bg-slate-800">{result}</pre>
          )}
        </div>
      </Card>

      {/* Table Browser */}
      <Card title="Database Tables" subtitle="Table sizes and row counts">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase text-slate-400 dark:border-slate-700">
                {['Table', 'Rows', 'Size', 'Last Modified', ''].map((h) => (
                  <th key={h} className="px-4 py-2 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {tables.map((t) => (
                <tr key={t.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-2 font-mono text-sm font-medium text-g-ink dark:text-white">{t.name}</td>
                  <td className="px-4 py-2 tabular-nums text-sm">{t.rows.toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm text-slate-500">{t.size}</td>
                  <td className="px-4 py-2 text-sm text-slate-500">{t.lastModified}</td>
                  <td className="px-4 py-2">
                    <Button size="sm" variant="outline" onClick={() => { setQuery(`SELECT * FROM ${t.name} LIMIT 100`); }}>Browse</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LOGS TAB
// ═══════════════════════════════════════════════════════════════════════════
function LogsTab() {
  const [level, setLevel] = useState('all');
  const [search, setSearch] = useState('');

  const logs: LogEntry[] = [
    { id: '1', timestamp: '2026-08-22T14:30:12', level: 'info', source: 'auth', message: 'User login successful', metadata: 'userId: u1, ip: 192.168.1.105' },
    { id: '2', timestamp: '2026-08-22T14:29:45', level: 'info', source: 'api', message: 'GET /api/v1/patients — 200 OK (89ms)', metadata: 'userId: u2' },
    { id: '3', timestamp: '2026-08-22T14:28:30', level: 'warn', source: 'pharmacy', message: 'Low stock alert triggered for Insulin Human 100IU', metadata: 'drugId: DRG-052, current: 50, reorder: 200' },
    { id: '4', timestamp: '2026-08-22T14:25:15', level: 'error', source: 'api', message: 'POST /api/v1/auth/login — 500 Internal Server Error', metadata: 'ip: 192.168.1.200, duration: 1250ms' },
    { id: '5', timestamp: '2026-08-22T14:20:00', level: 'info', source: 'system', message: 'Scheduled backup completed successfully', metadata: 'size: 128.5 MB, duration: 45s' },
    { id: '6', timestamp: '2026-08-22T14:15:30', level: 'debug', source: 'cache', message: 'Cache hit for drug catalog query', metadata: 'ttl: 300s, key: drugs:catalog' },
    { id: '7', timestamp: '2026-08-22T14:10:00', level: 'fatal', source: 'scheduler', message: 'Delivery channel "email" exhausted all retry attempts', metadata: 'channel: email, retries: 4, lastError: SMTP timeout' },
    { id: '8', timestamp: '2026-08-22T14:05:00', level: 'info', source: 'auth', message: 'Developer session started', metadata: 'email: dev@gihm.com, scope: DEVELOPER' },
  ];

  const filtered = logs.filter((l) => {
    if (level !== 'all' && l.level !== level) return false;
    if (search && !l.message.toLowerCase().includes(search.toLowerCase()) && !l.source.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const LEVEL_COLORS: Record<string, string> = {
    debug: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    info: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    warn: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    error: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    fatal: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Level">
            <Select value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="all">All levels</option>
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
              <option value="fatal">Fatal</option>
            </Select>
          </Field>
          <div className="flex-1 min-w-[200px]">
            <Field label="Search logs">
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter by message or source…" />
            </Field>
          </div>
          <Button variant="outline">Export</Button>
        </div>
      </Card>

      <Card pad={false}>
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {filtered.map((l) => (
            <div key={l.id} className={`px-4 py-3 ${LEVEL_COLORS[l.level]}`}>
              <div className="flex items-start gap-3">
                <span className="font-mono text-xs font-bold uppercase">{l.level}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{l.message}</p>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs opacity-75">
                    <span>{l.source}</span>
                    <span className="font-mono">{l.timestamp}</span>
                    {l.metadata && <span className="font-mono">{l.metadata}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400 dark:border-slate-700">
          Showing {filtered.length} of {logs.length} log entries
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIG TAB
// ═══════════════════════════════════════════════════════════════════════════
function ConfigTab() {
  const toast = useToast();
  const [config, setConfig] = useState({
    appName: 'GIHM-HIS',
    appVersion: '1.0.0',
    apiBase: 'http://localhost:4000',
    wsUrl: 'ws://localhost:4000',
    cacheExpiry: 300,
    sessionTimeout: 24,
    maxUploadSize: 10,
    enableOfflineMode: true,
    enablePushNotifications: false,
    debugMode: false,
    logLevel: 'info',
    corsOrigins: '*',
    rateLimitWindow: 60,
    rateLimitMax: 100,
  });

  return (
    <div className="space-y-6">
      <Card title="Application Configuration" subtitle="System-wide configuration settings. Changes take effect after server restart.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="App Name">
            <Input value={config.appName} onChange={(e) => setConfig((c) => ({ ...c, appName: e.target.value }))} />
          </Field>
          <Field label="App Version">
            <Input value={config.appVersion} onChange={(e) => setConfig((c) => ({ ...c, appVersion: e.target.value }))} />
          </Field>
          <Field label="API Base URL">
            <Input value={config.apiBase} onChange={(e) => setConfig((c) => ({ ...c, apiBase: e.target.value }))} className="font-mono" />
          </Field>
          <Field label="WebSocket URL">
            <Input value={config.wsUrl} onChange={(e) => setConfig((c) => ({ ...c, wsUrl: e.target.value }))} className="font-mono" />
          </Field>
          <Field label="Cache Expiry (seconds)">
            <Input type="number" value={String(config.cacheExpiry)} onChange={(e) => setConfig((c) => ({ ...c, cacheExpiry: Number(e.target.value) }))} />
          </Field>
          <Field label="Session Timeout (hours)">
            <Input type="number" value={String(config.sessionTimeout)} onChange={(e) => setConfig((c) => ({ ...c, sessionTimeout: Number(e.target.value) }))} />
          </Field>
          <Field label="Max Upload Size (MB)">
            <Input type="number" value={String(config.maxUploadSize)} onChange={(e) => setConfig((c) => ({ ...c, maxUploadSize: Number(e.target.value) }))} />
          </Field>
          <Field label="Log Level">
            <Select value={config.logLevel} onChange={(e) => setConfig((c) => ({ ...c, logLevel: e.target.value }))}>
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
            </Select>
          </Field>
          <Field label="CORS Origins">
            <Input value={config.corsOrigins} onChange={(e) => setConfig((c) => ({ ...c, corsOrigins: e.target.value }))} className="font-mono" />
          </Field>
          <Field label="Rate Limit Window (seconds)">
            <Input type="number" value={String(config.rateLimitWindow)} onChange={(e) => setConfig((c) => ({ ...c, rateLimitWindow: Number(e.target.value) }))} />
          </Field>
          <Field label="Rate Limit Max Requests">
            <Input type="number" value={String(config.rateLimitMax)} onChange={(e) => setConfig((c) => ({ ...c, rateLimitMax: Number(e.target.value) }))} />
          </Field>
        </div>
        <div className="mt-4 space-y-2">
          {[
            { key: 'enableOfflineMode', label: 'Enable Offline Mode (PWA)' },
            { key: 'enablePushNotifications', label: 'Enable Push Notifications' },
            { key: 'debugMode', label: 'Debug Mode (verbose logging)' },
          ].map((opt) => (
            <label key={opt.key} className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={opt.key in config && Boolean((config as unknown as Record<string, boolean>)[opt.key])}
                onChange={(e) => setConfig((c) => ({ ...c, [opt.key]: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300"
              />
              {opt.label}
            </label>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="green" onClick={() => toast('Configuration saved', 'success')}>Save Configuration</Button>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TERMINAL TAB
// ═══════════════════════════════════════════════════════════════════════════
function TerminalTab() {
  const [history, setHistory] = useState<string[]>([
    '$ node --version',
    'v20.11.0',
    '$ npm list --depth=0',
    'gihm-his@1.0.0',
    '├── express@4.18.2',
    '├── prisma@5.5.2',
    '└── typescript@5.3.2',
    '',
    '$ uptime',
    '14:30:12 up 3 days, 2:00, 12 users, load average: 0.23, 0.18, 0.15',
  ]);
  const [input, setInput] = useState('');

  function execute() {
    if (!input.trim()) return;
    const cmd = input.trim();
    setHistory((prev) => [...prev, `$ ${cmd}`]);

    // Simulated responses
    const responses: Record<string, string> = {
      'help': 'Available commands: help, whoami, date, uptime, ps, free, df, node --version, npm list, clear',
      'whoami': 'developer@gihm-his',
      'date': new Date().toISOString(),
      'clear': '__CLEAR__',
      'ps': 'PID  COMMAND\n1234 node server.js\n5678 vite dev\n9012 prisma studio',
      'free': '              total        used        free\nMem:          8192        1843        6349\nSwap:         2048           0        2048',
      'df': 'Filesystem     1K-blocks    Used Available Use% Mounted on\n/dev/sda1      262144000 45234176 216909824  18% /',
    };

    const response = responses[cmd] ?? `bash: ${cmd}: command not found`;
    if (response === '__CLEAR__') {
      setHistory([]);
    } else {
      setHistory((prev) => [...prev, response, '']);
    }
    setInput('');
  }

  return (
    <Card title="Developer Terminal" subtitle="Simulated terminal for quick commands and system inspection.">
      <div className="rounded-lg bg-slate-900 p-4 font-mono text-sm">
        <div className="max-h-96 overflow-auto space-y-0.5">
          {history.map((line, i) => (
            <div key={i} className={line.startsWith('$') ? 'text-green-400' : 'text-slate-300'}>
              {line}
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-green-400">$</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') execute(); }}
            className="flex-1 bg-transparent text-green-400 outline-none"
            placeholder="Type a command…"
            autoFocus
          />
        </div>
      </div>
    </Card>
  );
}
