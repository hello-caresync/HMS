import { Skeleton } from '@/components/ui/skeleton';
import { clinicalClasses } from '@/lib/doctor/theme';

export function ClinicalPageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-3 md:grid-cols-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className={`${clinicalClasses.card} h-36`} />
        ))}
      </div>
    </div>
  );
}

export function ClinicalTableSkeleton() {
  return (
    <div className={`${clinicalClasses.card} space-y-2 p-4`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  );
}
