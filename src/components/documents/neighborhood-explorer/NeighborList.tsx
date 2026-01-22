import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { NeighborWithSimilarity, EmbeddingData } from './types';
import { NeighborListItem } from './NeighborListItem';

const INITIAL_ITEMS_COUNT = 2;

interface NeighborListProps {
  title: string;
  icon: React.ReactNode;
  neighbors: NeighborWithSimilarity[];
  color: string;
  isExpanded: boolean;
  onToggle: () => void;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  getEmbeddingById: (id: string) => EmbeddingData | undefined;
  onSelectForCompare?: (id: string, slot: 1 | 2) => void;
}

export function NeighborList({
  title,
  icon,
  neighbors,
  color,
  isExpanded,
  onToggle,
  hoveredId,
  onHover,
  getEmbeddingById,
  onSelectForCompare,
}: NeighborListProps) {
  const [isLoadedMore, setIsLoadedMore] = useState(false);

  const displayedNeighbors = isLoadedMore
    ? neighbors
    : neighbors.slice(0, INITIAL_ITEMS_COUNT);
  const hasMore = neighbors.length > INITIAL_ITEMS_COUNT;
  const remainingCount = neighbors.length - INITIAL_ITEMS_COUNT;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between px-3 py-2 h-auto"
        >
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            {icon}
            <span className="font-medium">{title}</span>
            <Badge variant="secondary" className="ml-2">
              {neighbors.length}
            </Badge>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {neighbors.length === 0 ? (
          <p className="text-sm text-muted-foreground px-3 py-2">
            No documents found matching criteria
          </p>
        ) : (
          <ScrollArea className="h-auto max-h-48">
            <div className="space-y-1 px-3 pb-2">
              {displayedNeighbors.map(neighbor => (
                <NeighborListItem
                  key={neighbor.id}
                  neighbor={neighbor}
                  embedding={getEmbeddingById(neighbor.id)}
                  isHovered={hoveredId === neighbor.id}
                  onHover={onHover}
                  onSelectForCompare={onSelectForCompare}
                />
              ))}
              {hasMore && !isLoadedMore && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setIsLoadedMore(true)}
                >
                  Load more ({remainingCount} remaining)
                </Button>
              )}
            </div>
          </ScrollArea>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
