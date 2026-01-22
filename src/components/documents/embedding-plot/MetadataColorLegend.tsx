import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface MetadataColorLegendProps {
  field: string;
  valueColors: Map<string, string>;
}

export function MetadataColorLegend({ field, valueColors }: MetadataColorLegendProps) {
  const entries = Array.from(valueColors.entries());

  if (entries.length === 0) return null;

  return (
    <div className="pt-2 space-y-1">
      <span className="text-xs text-muted-foreground">
        Colored by: <span className="font-mono font-medium">{field}</span>
      </span>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex items-center gap-2 pb-2">
          {entries.map(([value, color]) => (
            <Badge
              key={value}
              variant="outline"
              className="text-xs flex items-center gap-1.5 shrink-0"
            >
              <span
                className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="truncate max-w-[100px]">{value || '(empty)'}</span>
            </Badge>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
