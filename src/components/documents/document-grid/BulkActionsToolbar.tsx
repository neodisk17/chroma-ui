import { X, Download, Trash2 } from 'lucide-react';
import { Button } from '../../ui/button';

interface BulkActionsToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onDeleteSelected: () => void;
}

export const BulkActionsToolbar = ({
  selectedCount,
  onClearSelection,
  onExportJSON,
  onExportCSV,
  onDeleteSelected,
}: BulkActionsToolbarProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {selectedCount} document{selectedCount !== 1 ? 's' : ''} selected
        </span>
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          <X className="mr-1 h-3 w-3" />
          Clear
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onExportJSON}>
          <Download className="mr-2 h-4 w-4" />
          Export JSON
        </Button>
        <Button variant="outline" size="sm" onClick={onExportCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDeleteSelected}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Selected
        </Button>
      </div>
    </div>
  );
};
