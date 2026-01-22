import { RefreshCw } from 'lucide-react';
import { Button } from '../../ui/button';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export const ErrorState = ({ message, onRetry }: ErrorStateProps) => {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="max-w-md space-y-4">
        <p className="text-lg font-semibold text-destructive">Failed to load documents</p>
        <p className="text-sm text-muted-foreground">{message}</p>
        <Button onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    </div>
  );
};
