import { Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '../../../ui/button';
import type { ActionsCellRendererParams } from './types';

export const ActionsCellRenderer = (params: ActionsCellRendererParams) => {
  const { onView, onEdit, onDelete } = params;

  return (
    <div className="flex h-full items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={() => onView?.(params.data!)}
        title="View"
      >
        <Eye className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={() => onEdit?.(params.data!)}
        title="Edit"
      >
        <Edit className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-destructive"
        onClick={() => onDelete?.([params.data!.id])}
        title="Delete"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
};
