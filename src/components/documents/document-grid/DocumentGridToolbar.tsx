import { RefreshCw, Upload, Plus } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';

interface DocumentGridToolbarProps {
  totalDocuments: number;
  onRefresh: () => void;
  onImport: () => void;
  onAdd: () => void;
}

export const DocumentGridToolbar = ({
  totalDocuments,
  onRefresh,
  onImport,
  onAdd,
}: DocumentGridToolbarProps) => {
  return (
    <div className="flex items-center justify-between border-b p-4">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold">Documents</h2>
        <Badge variant="outline">
          {totalDocuments.toLocaleString()} total
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
        <Button variant="outline" size="sm" onClick={onImport}>
          <Upload className="mr-2 h-4 w-4" />
          Import
        </Button>
        <Button size="sm" onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Document
        </Button>
      </div>
    </div>
  );
};
