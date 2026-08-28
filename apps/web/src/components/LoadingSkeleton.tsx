import { cn } from './ui';

export function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn('skeleton h-4 w-full', className)} />;
}

export function SkeletonCircle({ className }: { className?: string }) {
  return <div className={cn('skeleton h-10 w-10 rounded-full', className)} />;
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <SkeletonLine className="h-3 w-20" />
          <SkeletonLine className="mt-2 h-7 w-16" />
        </div>
        <div className="skeleton h-10 w-10 rounded-lg" />
      </div>
    </div>
  );
}

export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <SkeletonLine className="mb-4 h-4 w-32" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonLine key={i} className={cn('h-3', i === rows - 1 ? 'w-2/3' : 'w-full')} />
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-3">
        <SkeletonLine className="h-4 w-24" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-5 py-3">
            {Array.from({ length: cols }).map((_, c) => (
              <SkeletonLine key={c} className={cn('h-3', c === 0 ? 'w-32' : 'flex-1')} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <SkeletonLine className="h-7 w-64" />
        <SkeletonLine className="mt-2 h-4 w-96" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <CardSkeleton rows={4} />
        <CardSkeleton rows={4} />
      </div>
    </div>
  );
}
