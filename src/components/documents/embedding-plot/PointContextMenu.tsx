import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuLabel,
} from '@/components/ui/context-menu';
import { Eye, Circle, CircleDot, Users } from 'lucide-react';

interface PointContextMenuProps {
  children: React.ReactNode;
  pointId: string;
  isDoc1: boolean;
  isDoc2: boolean;
  onViewDetails: (id: string) => void;
  onSetAsDoc1: (id: string) => void;
  onSetAsDoc2: (id: string) => void;
  onFindNeighbors: (id: string) => void;
}

export function PointContextMenu({
  children,
  pointId,
  isDoc1,
  isDoc2,
  onViewDetails,
  onSetAsDoc1,
  onSetAsDoc2,
  onFindNeighbors,
}: PointContextMenuProps) {
  return (
    <ContextMenu>
      {children}
      <ContextMenuContent className="w-48">
        <ContextMenuLabel className="font-mono text-xs truncate">
          {pointId}
        </ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onViewDetails(pointId)} className="gap-2">
          <Eye className="h-4 w-4" />
          View Details
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => onSetAsDoc1(pointId)}
          disabled={isDoc1}
          className="gap-2"
        >
          <Circle className="h-4 w-4 text-blue-500" />
          Set as Document 1
          {isDoc1 && <span className="ml-auto text-xs text-muted-foreground">(current)</span>}
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => onSetAsDoc2(pointId)}
          disabled={isDoc2}
          className="gap-2"
        >
          <CircleDot className="h-4 w-4 text-green-500" />
          Set as Document 2
          {isDoc2 && <span className="ml-auto text-xs text-muted-foreground">(current)</span>}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onFindNeighbors(pointId)} className="gap-2">
          <Users className="h-4 w-4" />
          Find Nearest Neighbors
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
