import { Plus, Upload } from 'lucide-react';
import { Button } from '../../ui/button';

interface EmptyStateProps {
  onAddDocument: () => void;
  onBulkImport: () => void;
}

export const EmptyState = ({ onAddDocument, onBulkImport }: EmptyStateProps) => {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="max-w-md space-y-4">
        <p className="text-lg font-semibold">No documents in this collection</p>
        <p className="text-sm text-muted-foreground">
          Add your first document or bulk import to get started
        </p>
        <div className="flex items-center justify-center gap-2">
          <Button onClick={onAddDocument}>
            <Plus className="mr-2 h-4 w-4" />
            Add Document
          </Button>
          <Button variant="outline" onClick={onBulkImport}>
            <Upload className="mr-2 h-4 w-4" />
            Bulk Import
          </Button>
        </div>
      </div>
    </div>
  );
};
