import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlotPoint, CATEGORY_COLORS, CATEGORY_LABELS } from './types';

interface NeighborhoodTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: PlotPoint }>;
}

export function NeighborhoodTooltip({ active, payload }: NeighborhoodTooltipProps) {
  if (!active || !payload || payload.length === 0 || !payload[0]?.payload) return null;

  const point = payload[0].payload;
  const docPreview = point.document
    ? point.document.length > 80
      ? point.document.substring(0, 80) + '...'
      : point.document
    : '';

  return (
    <Card className="max-w-xs border shadow-lg">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: CATEGORY_COLORS[point.category] }}
          />
          <span className="font-mono text-xs font-medium">{point.id}</span>
        </div>
        <Badge variant="outline" className="text-xs">
          {CATEGORY_LABELS[point.category]}
        </Badge>
        {docPreview && (
          <p className="text-xs text-muted-foreground">{docPreview}</p>
        )}
      </CardContent>
    </Card>
  );
}
