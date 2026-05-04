import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '../../../ui/popover';
import type { MetadataCellRendererParams } from './types';

const MAX_VISIBLE_BADGES = 4;

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.length > 18 ? value.substring(0, 18) + '…' : value;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return value.toString();
  if (value instanceof Date) return value.toLocaleDateString();
  return JSON.stringify(value);
};

const formatBadgeLabel = (key: string, value: unknown): string => {
  const val = formatValue(value);
  const label = `${key}: ${val}`;
  return label.length > 24 ? label.substring(0, 24) + '…' : label;
};

// Explicit styles that bypass AG Grid alpine theme CSS overrides
const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  fontSize: '11px',
  lineHeight: '1.4',
  padding: '2px 7px',
  borderRadius: '4px',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  backgroundColor: 'rgba(148, 163, 184, 0.1)',
  color: 'inherit',
  maxWidth: '150px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  cursor: 'default',
  flexShrink: 0,
};

const moreBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  fontSize: '11px',
  lineHeight: '1.4',
  padding: '2px 8px',
  borderRadius: '4px',
  border: '1px solid rgba(34, 211, 238, 0.35)',
  backgroundColor: 'rgba(34, 211, 238, 0.08)',
  color: 'rgb(34, 211, 238)',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  flexShrink: 0,
};

export const MetadataCellRenderer = (params: MetadataCellRendererParams) => {
  const metadata = params.value as Record<string, unknown> | null | undefined;

  if (!metadata || Object.keys(metadata).length === 0) {
    return <span style={{ fontSize: '12px', opacity: 0.4 }}>—</span>;
  }

  const sortedKeys = Object.keys(metadata).sort();
  const visibleKeys = sortedKeys.slice(0, MAX_VISIBLE_BADGES);
  const hiddenKeys = sortedKeys.slice(MAX_VISIBLE_BADGES);
  const hasMore = hiddenKeys.length > 0;

  return (
    <TooltipProvider delayDuration={200}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '100%', padding: '4px 0', overflow: 'hidden' }}>
        {visibleKeys.map((key) => (
          <Tooltip key={key}>
            <TooltipTrigger asChild>
              <span style={badgeStyle}>
                {formatBadgeLabel(key, metadata[key])}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              <div className="text-xs">
                <span className="font-mono font-medium">{key}</span>
                <span className="text-muted-foreground"> = </span>
                <span>{String(metadata[key])}</span>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}

        {hasMore && (
          <Popover>
            <PopoverTrigger asChild>
              <span style={moreBadgeStyle}>+{hiddenKeys.length} more</span>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">All Metadata</h4>
                <div className="space-y-1.5">
                  {sortedKeys.map((key) => (
                    <div key={key} className="flex items-start justify-between gap-3 text-xs">
                      <span className="text-muted-foreground font-mono shrink-0 pt-0.5">{key}</span>
                      <span className="text-foreground font-medium text-right break-all">{String(metadata[key])}</span>
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
