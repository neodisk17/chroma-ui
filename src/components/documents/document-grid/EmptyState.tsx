import { Plus } from 'lucide-react';
import { Button } from '../../ui/button';

interface EmptyStateProps {
  onAddDocument: () => void;
}

export const EmptyState = ({ onAddDocument }: EmptyStateProps) => {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="max-w-md space-y-4">
        <p className="text-lg font-semibold">No documents in this collection</p>
        <p className="text-sm text-muted-foreground">
          Add your first document to get started
        </p>
        <Button onClick={onAddDocument}>
          <Plus className="mr-2 h-4 w-4" />
          Add Document
        </Button>
      </div>
    </div>
  );
};
