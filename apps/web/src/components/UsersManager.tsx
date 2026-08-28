import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { AdminUserRow, RoleBrief } from '../types';
import { Badge, Button, Card, Field, Input, Select, Spinner, useToast } from './ui';
import { fmtDateTime } from '../lib/format';

export default function UsersManager() {
  const toast = useToast();
  const [users, setUsers] = useState<AdminUserRow[] | null>(null);
  const [roles, setRoles] = useState<RoleBrief[]>([]);
  const [minLen, setMinLen] = useState(8);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ email: '', fullName: '', roleCode: '', password: '' });

  const load = useCallback(async () => {
    const res = await api<{ users: AdminUserRow[]; roles: RoleBrief[]; passwordMinLength: number }>('/admin/users');
    setUsers(res.users);
    setRoles(res.roles);
    setMinLen(res.passwordMinLength);
  }, []);
  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  async function create() {
    if (!form.email || !form.fullName || !form.roleCode || !form.password) {
      toast('Complete all fields', 'error');
      return;
    }
    setBusy(true);
    try {
      await api('/admin/users', { method: 'POST', body: form });
      toast('User created', 'success');
      setForm({ email: '', fullName: '', roleCode: '', password: '' });
      setCreating(false);
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Create failed', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: string, status: string) {
    try {
      await api(`/admin/users/${id}/status`, { method: 'PUT', body: { status } });
      toast(`User ${status.toLowerCase()}`, 'success');
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  }

  async function changeRole(id: string, roleCode: string) {
    try {
      await api(`/admin/users/${id}/role`, { method: 'PUT', body: { roleCode } });
      toast('Role changed', 'success');
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  }

  async function resetPassword(id: string, email: string) {
    const password = window.prompt(`New password for ${email} (min ${minLen} characters):`);
    if (!password) return;
    try {
      await api(`/admin/users/${id}/password`, { method: 'POST', body: { password } });
      toast('Password reset', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Reset failed', 'error');
    }
  }

  if (!users) {
    return (
      <div className="py-16">
        <Spinner label="Loading users…" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-slate-500">
          Create and manage staff accounts. Developer accounts can only be created by the platform developer (docs/25).
        </p>
        <Button size="sm" variant="navy" onClick={() => setCreating((c) => !c)}>Create user</Button>
      </div>

      {creating && (
        <Card title="Create user" subtitle={`Password must be at least ${minLen} characters.`}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full name"><Input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></Field>
            <Field label="Role">
              <Select value={form.roleCode} onChange={(e) => setForm((f) => ({ ...f, roleCode: e.target.value }))}>
                <option value="">Select a role…</option>
                {roles.map((r) => <option key={r.code} value={r.code}>{r.name} ({r.scope})</option>)}
              </Select>
            </Field>
            <Field label="Password"><Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} autoComplete="new-password" /></Field>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
            <Button variant="green" loading={busy} onClick={() => void create()}>Create account</Button>
          </div>
        </Card>
      )}

      <Card pad={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
                {['User', 'Role', 'Facility', 'Status', 'Last login', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-g-mist/40">
                  <td className="px-5 py-2.5">
                    <p className="font-semibold text-g-ink">{u.fullName}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </td>
                  <td className="px-5 py-2.5">
                    <Select className="py-1.5" value={u.roleCode} onChange={(e) => void changeRole(u.id, e.target.value)}>
                      {roles.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
                    </Select>
                  </td>
                  <td className="px-5 py-2.5 text-slate-500">{u.facility?.name ?? '—'}</td>
                  <td className="px-5 py-2.5">
                    <Badge tone={u.status === 'ACTIVE' ? 'green' : u.status === 'LOCKED' ? 'red' : 'gold'}>{u.status}</Badge>
                  </td>
                  <td className="px-5 py-2.5 text-slate-400">{u.lastLoginAt ? fmtDateTime(u.lastLoginAt) : '—'}</td>
                  <td className="px-5 py-2.5">
                    <div className="flex gap-2">
                      {u.status === 'ACTIVE' ? (
                        <button onClick={() => void setStatus(u.id, 'SUSPENDED')} className="cursor-pointer text-xs font-bold text-g-gold hover:underline">Suspend</button>
                      ) : (
                        <button onClick={() => void setStatus(u.id, 'ACTIVE')} className="cursor-pointer text-xs font-bold text-g-green hover:underline">Activate</button>
                      )}
                      <button onClick={() => void resetPassword(u.id, u.email)} className="cursor-pointer text-xs font-bold text-g-navy hover:underline">Reset password</button>
                    </div>
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
