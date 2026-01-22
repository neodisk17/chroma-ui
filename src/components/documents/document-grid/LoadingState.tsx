import { Skeleton } from '../../ui/skeleton';

export const LoadingState = () => {
  return (
    <div className="flex h-full flex-col">
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
};
