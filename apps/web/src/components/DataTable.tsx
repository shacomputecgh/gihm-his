import { useState, useMemo } from 'react';
import { logAudit } from '../lib/auditTrail';

export interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  searchable?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: string;
  onAdd?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onExport?: () => void;
  title?: string;
  subtitle?: string;
  searchPlaceholder?: string;
  pageSize?: number;
  addLabel?: string;
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  onAdd,
  onEdit,
  onDelete,
  onExport,
  title,
  subtitle,
  searchPlaceholder = 'Search records...',
  pageSize = 10,
  addLabel = '+ Add New',
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  const searchableColumns = useMemo(() => columns.filter((c) => c.searchable !== false), [columns]);

  const filtered = useMemo(() => {
    let result = [...data];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((item) =>
        searchableColumns.some((col) => {
          const val = String(item[col.key] ?? '').toLowerCase();
          return val.includes(q);
        })
      );
    }
    if (sortKey) {
      result.sort((a, b) => {
        const av = a[sortKey] ?? '';
        const bv = b[sortKey] ?? '';
        const cmp = String(av).localeCompare(String(bv));
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  }, [data, search, sortKey, sortDir, searchableColumns]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const toggleSelect = (id: string | number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paged.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paged.map((item) => item[keyField] as string | number)));
    }
  };

  return (
    <div className="space-y-4">
      {(title || onAdd || onExport) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            {title && <h2 className="text-lg font-bold text-slate-800">{title}</h2>}
            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          </div>
          <div className="flex gap-2">
            {onExport && (
              <button
                onClick={onExport}
                className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition"
              >
                📥 Export
              </button>
            )}
            {onAdd && (
              <button
                onClick={onAdd}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow"
              >
                {addLabel}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
          />
        </div>
        <span className="text-sm text-slate-500">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
        {selectedIds.size > 0 && onDelete && (
          <button
            onClick={() => {
              if (confirm(`Delete ${selectedIds.size} selected record(s)?`)) {
                data.forEach((item) => {
                  if (selectedIds.has(item[keyField] as string | number)) {
                    onDelete(item);
                  }
                });
                setSelectedIds(new Set());
              }
            }}
            className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition"
          >
            🗑 Delete ({selectedIds.size})
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {onDelete && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === paged.length && paged.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider ${col.sortable !== false ? 'cursor-pointer hover:text-green-600 select-none' : ''}`}
                  onClick={() => col.sortable !== false && toggleSort(col.key)}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
              {(onEdit || onDelete) && <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onDelete ? 1 : 0) + ((onEdit || onDelete) ? 1 : 0)} className="px-4 py-8 text-center text-slate-400">
                  No records found
                </td>
              </tr>
            ) : (
              paged.map((item) => (
                <tr key={String(item[keyField])} className="hover:bg-slate-50 transition">
                  {onDelete && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item[keyField] as string | number)}
                        onChange={() => toggleSelect(item[keyField] as string | number)}
                        className="rounded border-slate-300"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm text-slate-700">
                      {col.render ? col.render(item) : String(item[col.key] ?? '')}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(item)}
                            className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
                          >
                            ✏️ Edit
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => {
                              if (confirm('Delete this record?')) {
                                logAudit({ userId: 'current', userName: 'Current User', role: 'user', action: 'DELETE', module: title || 'DataTable', description: `Deleted record ${String(item[keyField])}` });
                                onDelete(item);
                              }
                            }}
                            className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
                          >
                            🗑
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              ← Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const p = start + i;
              if (p > totalPages) return null;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 text-sm rounded border ${p === page ? 'bg-green-600 text-white border-green-600' : 'border-slate-200 hover:bg-slate-50'}`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 text-sm rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
