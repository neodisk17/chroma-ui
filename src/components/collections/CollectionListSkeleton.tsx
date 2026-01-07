import { Skeleton } from '@/components/ui/skeleton';

/**
 * CollectionListSkeleton - Loading skeleton for CollectionList
 * Shows animated placeholders while collections are loading
 */
export function CollectionListSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {/* Search bar skeleton */}
      <Skeleton className="h-10 w-full" />

      {/* Collection items skeleton */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-2 rounded-lg border p-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}
