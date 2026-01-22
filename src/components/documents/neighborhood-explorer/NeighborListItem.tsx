import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeftRight } from 'lucide-react';
import { NeighborWithSimilarity, EmbeddingData } from './types';

interface NeighborListItemProps {
  neighbor: NeighborWithSimilarity;
  embedding?: EmbeddingData;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onSelectForCompare?: (id: string, slot: 1 | 2) => void;
}

export function NeighborListItem({
  neighbor,
  embedding,
  isHovered,
  onHover,
  onSelectForCompare,
}: NeighborListItemProps) {
  const docPreview = embedding?.document
    ? embedding.document.length > 60
      ? embedding.document.substring(0, 60) + '...'
      : embedding.document
    : '';

  const hasDoubleSimilarity = 'similarity1' in neighbor && 'similarity2' in neighbor;

  return (
    <div
      className={`p-2 rounded-md border bg-card hover:bg-accent transition-colors cursor-pointer ${
        isHovered ? 'ring-2 ring-primary' : ''
      }`}
      onMouseEnter={() => onHover(neighbor.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-xs font-medium truncate max-w-[150px]">
          {neighbor.id}
        </span>
        <div className="flex items-center gap-1">
          {hasDoubleSimilarity ? (
            <>
              <Badge variant="outline" className="text-xs bg-blue-50">
                {((neighbor.similarity1 || 0) * 100).toFixed(0)}%
              </Badge>
              <Badge variant="outline" className="text-xs bg-green-50">
                {((neighbor.similarity2 || 0) * 100).toFixed(0)}%
              </Badge>
            </>
          ) : (
            <Badge variant="outline" className="text-xs">
              {(neighbor.similarity * 100).toFixed(1)}%
            </Badge>
          )}
        </div>
      </div>
      {docPreview && (
        <p className="text-xs text-muted-foreground line-clamp-2">
          {docPreview}
        </p>
      )}
      {onSelectForCompare && (
        <div className="flex gap-1 mt-2">
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-xs flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onSelectForCompare(neighbor.id, 1);
            }}
          >
            <ArrowLeftRight className="h-3 w-3 mr-1" />
            Set as Doc 1
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-xs flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onSelectForCompare(neighbor.id, 2);
            }}
          >
            <ArrowLeftRight className="h-3 w-3 mr-1" />
            Set as Doc 2
          </Button>
        </div>
      )}
    </div>
  );
}
