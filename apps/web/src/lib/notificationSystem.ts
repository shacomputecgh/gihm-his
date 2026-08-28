/**
 * Notification System — real-time alerts for critical hospital events.
 */

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'critical';
  title: string;
  message: string;
  module: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

const STORAGE_KEY = 'gihm_notifications';
const MAX_NOTIFICATIONS = 200;

let _listeners: ((notifications: Notification[]) => void)[] = [];

function getStored(): Notification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as Notification[] : [];
  } catch {
    return [];
  }
}

function persist(notifications: Notification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS)));
  _listeners.forEach((fn) => fn(notifications));
}

/**
 * Subscribe to notification changes.
 */
export function onNotificationsChange(fn: (notifications: Notification[]) => void): () => void {
  _listeners.push(fn);
  return () => { _listeners = _listeners.filter((l) => l !== fn); };
}

/**
 * Create a new notification.
 */
export function notify(
  type: Notification['type'],
  title: string,
  message: string,
  module: string,
  options?: { priority?: Notification['priority']; actionUrl?: string }
): Notification {
  const notif: Notification = {
    id: `NOTIF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    title,
    message,
    module,
    timestamp: new Date().toISOString(),
    read: false,
    priority: options?.priority ?? 'medium',
    actionUrl: options?.actionUrl,
  };
  const all = getStored();
  all.unshift(notif);
  persist(all);

  // Show browser notification for critical items
  if (type === 'critical' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body: message, icon: '/favicon.ico' });
  }

  return notif;
}

/**
 * Get all notifications.
 */
export function getNotifications(filters?: { unreadOnly?: boolean; type?: Notification['type']; module?: string }): Notification[] {
  let notifs = getStored();
  if (filters?.unreadOnly) notifs = notifs.filter((n) => !n.read);
  if (filters?.type) notifs = notifs.filter((n) => n.type === filters.type);
  if (filters?.module) notifs = notifs.filter((n) => n.module === filters.module);
  return notifs;
}

/**
 * Get unread count.
 */
export function getUnreadCount(): number {
  return getStored().filter((n) => !n.read).length;
}

/**
 * Mark a notification as read.
 */
export function markAsRead(id: string) {
  const notifs = getStored().map((n) => n.id === id ? { ...n, read: true } : n);
  persist(notifs);
}

/**
 * Mark all as read.
 */
export function markAllAsRead() {
  const notifs = getStored().map((n) => ({ ...n, read: true }));
  persist(notifs);
}

/**
 * Delete a notification.
 */
export function deleteNotification(id: string) {
  const notifs = getStored().filter((n) => n.id !== id);
  persist(notifs);
}

/**
 * Clear all notifications.
 */
export function clearAll() {
  persist([]);
}

// Pre-defined hospital alerts
export const ALERTS = {
  codeBlue: (location: string) => notify('critical', 'Code Blue', `Code Blue called at ${location}`, 'Emergency', { priority: 'urgent' }),
  lowStock: (drug: string, qty: number) => notify('warning', 'Low Stock Alert', `${drug} is running low (${qty} units remaining)`, 'Pharmacy', { priority: 'high' }),
  expiredMedicine: (drug: string) => notify('error', 'Medicine Expired', `${drug} has expired and should be removed from stock`, 'Pharmacy', { priority: 'high' }),
  bedFull: (ward: string) => notify('warning', 'Ward Full', `${ward} has reached maximum bed capacity`, 'Bed Management', { priority: 'high' }),
  labCritical: (patient: string, test: string) => notify('critical', 'Critical Lab Result', `Critical result for ${patient}: ${test}`, 'Laboratory', { priority: 'urgent' }),
  admissionAlert: (patient: string) => notify('info', 'New Admission', `New patient admitted: ${patient}`, 'Admissions'),
  dischargeReady: (patient: string) => notify('success', 'Discharge Ready', `Patient ${patient} is ready for discharge`, 'Discharge'),
  insuranceClaim: (patient: string) => notify('info', 'Insurance Claim', `New claim submitted for ${patient}`, 'Insurance'),
  equipmentFailure: (equipment: string) => notify('error', 'Equipment Failure', `${equipment} has malfunctioned`, 'Maintenance', { priority: 'high' }),
  infectionAlert: (ward: string) => notify('critical', 'Infection Alert', `HAI outbreak detected in ${ward}`, 'Infection Control', { priority: 'urgent' }),
};

// Request browser notification permission
if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
  // Will request when user first interacts
  document.addEventListener('click', () => {
    if (Notification.permission === 'default') Notification.requestPermission();
  }, { once: true });
}
