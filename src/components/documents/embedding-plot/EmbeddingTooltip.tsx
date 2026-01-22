import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PlotPoint } from './types';

interface EmbeddingTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: PlotPoint }>;
  selectedId?: string;
}

export function EmbeddingTooltip({ active, payload, selectedId }: EmbeddingTooltipProps) {
  if (!active || !payload || payload.length === 0 || !payload[0]?.payload) return null;

  const point = payload[0].payload;
  const docPreview = point.document.length > 100
    ? point.document.substring(0, 100) + '...'
    : point.document;

  return (
    <Card className="max-w-sm border-2 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-mono">{point.id}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Document:</p>
          <p className="text-sm">{docPreview}</p>
        </div>
        {point.metadata && Object.keys(point.metadata).length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground">Metadata:</p>
            <pre className="text-xs font-mono bg-muted p-1 rounded overflow-auto max-h-20">
              {JSON.stringify(point.metadata, null, 2)}
            </pre>
          </div>
        )}
        {selectedId && point.id !== selectedId && (
          <div className="flex gap-2 pt-2 border-t">
            <Badge variant="outline" className="text-xs">
              Distance: {point.distance?.toFixed(4)}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Similarity: {((point.similarity || 0) * 100).toFixed(1)}%
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
