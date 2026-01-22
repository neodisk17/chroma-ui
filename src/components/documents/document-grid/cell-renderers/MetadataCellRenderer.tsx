import { Badge } from '../../../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '../../../ui/popover';
import type { MetadataCellRendererParams } from './types';

const MAX_VISIBLE_BADGES = 3;

const formatMetadataValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') {
    return value.length > 20 ? value.substring(0, 20) + '...' : value;
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return value.toString();
  if (value instanceof Date) return value.toLocaleDateString();
  return JSON.stringify(value);
};

export const MetadataCellRenderer = (params: MetadataCellRendererParams) => {
  const metadata = params.value as Record<string, unknown> | null | undefined;

  if (!metadata || Object.keys(metadata).length === 0) {
    return <span className="text-muted-foreground text-xs">No metadata</span>;
  }

  const sortedKeys = Object.keys(metadata).sort();
  const visibleKeys = sortedKeys.slice(0, MAX_VISIBLE_BADGES);
  const hiddenKeys = sortedKeys.slice(MAX_VISIBLE_BADGES);
  const hasMore = hiddenKeys.length > 0;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-full items-center gap-1 py-1">
        {visibleKeys.map((key) => (
          <Tooltip key={key}>
            <TooltipTrigger asChild>
              <Badge
                variant="secondary"
                className="cursor-default truncate max-w-[100px] text-xs"
              >
                {formatMetadataValue(metadata[key])}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top">
              <span className="font-medium">{key}</span>
            </TooltipContent>
          </Tooltip>
        ))}

        {hasMore && (
          <Popover>
            <PopoverTrigger asChild>
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-secondary text-xs"
              >
                +{hiddenKeys.length} more
              </Badge>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">All Metadata</h4>
                <div className="space-y-2">
                  {sortedKeys.map((key) => (
                    <div key={key} className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground text-sm shrink-0">
                        {key}
                      </span>
                      <Badge variant="secondary" className="truncate max-w-[180px] text-xs">
                        {formatMetadataValue(metadata[key])}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </TooltipProvider>
  );
};
