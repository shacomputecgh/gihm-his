/**
 * Global Audit Trail — records all user actions in the system.
 * Stores locally and syncs to server when online.
 */

export interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: string;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'SEARCH' | 'VIEW' | 'CONFIGURE';
  module: string;
  recordId?: string;
  description: string;
  ipAddress?: string;
  deviceInfo?: string;
}

const STORAGE_KEY = 'gihm_audit_trail';

let _buffer: AuditEntry[] = [];

function getStored(): AuditEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as AuditEntry[] : [];
  } catch {
    return [];
  }
}

function persist() {
  const stored = getStored();
  const all = [...stored, ..._buffer].slice(-5000); // keep last 5000 entries
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  _buffer = [];
}

/**
 * Log an audit event.
 */
export function logAudit(entry: Omit<AuditEntry, 'id' | 'timestamp' | 'deviceInfo'>) {
  const full: AuditEntry = {
    ...entry,
    id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    deviceInfo: navigator.userAgent.slice(0, 100),
  };
  _buffer.push(full);
  // Flush every 10 entries
  if (_buffer.length >= 10) persist();
}

/**
 * Get all audit entries (with optional filters).
 */
export function getAuditEntries(filters?: {
  module?: string;
  action?: AuditEntry['action'];
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}): AuditEntry[] {
  persist(); // flush buffer
  let entries = getStored();
  if (filters) {
    if (filters.module) entries = entries.filter((e) => e.module === filters.module);
    if (filters.action) entries = entries.filter((e) => e.action === filters.action);
    if (filters.userId) entries = entries.filter((e) => e.userId === filters.userId);
    if (filters.dateFrom) entries = entries.filter((e) => e.timestamp >= filters.dateFrom!);
    if (filters.dateTo) entries = entries.filter((e) => e.timestamp <= filters.dateTo!);
  }
  return entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

/**
 * Export audit trail as CSV.
 */
export function exportAuditCSV(): string {
  const entries = getStored();
  const headers = ['ID', 'Timestamp', 'User', 'Role', 'Action', 'Module', 'Description'];
  const rows = entries.map((e) => [
    e.id, e.timestamp, e.userName, e.role, e.action, e.module, e.description,
  ]);
  return [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
}

/**
 * Get audit summary stats.
 */
export function getAuditSummary() {
  const entries = getStored();
  const today = new Date().toISOString().slice(0, 10);
  const todayEntries = entries.filter((e) => e.timestamp.startsWith(today));
  return {
    total: entries.length,
    today: todayEntries.length,
    byAction: entries.reduce<Record<string, number>>((acc, e) => { acc[e.action] = (acc[e.action] || 0) + 1; return acc; }, {}),
    byModule: entries.reduce<Record<string, number>>((acc, e) => { acc[e.module] = (acc[e.module] || 0) + 1; return acc; }, {}),
    recentLogin: entries.find((e) => e.action === 'LOGIN')?.timestamp ?? null,
  };
}

// Flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', persist);
}
