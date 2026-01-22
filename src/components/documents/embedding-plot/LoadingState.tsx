import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface LoadingStateProps {
  progress: number;
}

export function LoadingState({ progress }: LoadingStateProps) {
  return (
    <div className="flex h-96 items-center justify-center">
      <div className="text-center space-y-4 w-64">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Computing PCA...</p>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">{progress}%</p>
        </div>
      </div>
    </div>
  );
}
