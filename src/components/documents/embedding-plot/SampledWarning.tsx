import { AlertCircle } from 'lucide-react';
import { MAX_POINTS } from './types';

interface SampledWarningProps {
  totalCount: number;
}

export function SampledWarning({ totalCount }: SampledWarningProps) {
  return (
    <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-md">
      <AlertCircle className="h-4 w-4 text-yellow-600" />
      <span>
        Displaying {MAX_POINTS} of {totalCount} documents (sampled for performance)
      </span>
    </div>
  );
}
