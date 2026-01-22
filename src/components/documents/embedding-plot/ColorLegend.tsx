import { Badge } from '@/components/ui/badge';

export function ColorLegend() {
  return (
    <div className="flex items-center gap-2 pt-2">
      <span className="text-sm text-muted-foreground">Color legend:</span>
      <Badge variant="outline" className="bg-green-500/20 text-green-700">
        Very Similar (&lt; 0.2)
      </Badge>
      <Badge variant="outline" className="bg-yellow-500/20 text-yellow-700">
        Similar (0.2-0.5)
      </Badge>
      <Badge variant="outline" className="bg-blue-500/20 text-blue-700">
        Different (&gt; 0.5)
      </Badge>
    </div>
  );
}
