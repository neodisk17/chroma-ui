import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface EmbeddingViewerProps {
  embedding: number[] | null | undefined;
  className?: string;
}

/**
 * EmbeddingViewer component - displays embedding vectors in a compact, expandable format
 *
 * Features:
 * - Collapsed by default (shows first 5 values + "...")
 * - Expand/collapse button
 * - When expanded: Shows all values in grid format (10 per row)
 * - Format numbers to 6 decimal places
 * - Show vector magnitude and dimension count
 * - Copy vector as JSON button
 */
export function EmbeddingViewer({ embedding, className = '' }: EmbeddingViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Handle case where embedding is null or undefined
  if (!embedding || embedding.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Embedding</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No embedding available</p>
        </CardContent>
      </Card>
    );
  }

  const dimensionCount = embedding.length;

  // Calculate vector magnitude: sqrt(sum of squares)
  const magnitude = Math.sqrt(
    embedding.reduce((sum, val) => sum + val * val, 0)
  );

  // Get preview (first 5 values)
  const preview = embedding.slice(0, 5).map(v => v.toFixed(6)).join(', ');

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(embedding, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Embedding</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {dimensionCount} dimensions
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 w-7 p-0"
              title="Copy as JSON"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Vector magnitude */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Magnitude:</span>
          <span className="font-mono">{magnitude.toFixed(6)}</span>
        </div>

        {/* Preview or full display */}
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 px-2 text-xs"
          >
            {isExpanded ? (
              <>
                <ChevronDown className="mr-1 h-3 w-3" />
                Collapse
              </>
            ) : (
              <>
                <ChevronRight className="mr-1 h-3 w-3" />
                Expand
              </>
            )}
          </Button>

          {isExpanded ? (
            // Full vector display (10 per row)
            <div className="max-h-96 overflow-y-auto rounded-md border p-3">
              <div className="grid grid-cols-5 gap-2 font-mono text-xs">
                {embedding.map((value, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b py-1"
                  >
                    <span className="text-muted-foreground">[{index}]:</span>
                    <span>{value.toFixed(6)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Collapsed preview
            <div className="rounded-md border bg-muted/50 p-3 font-mono text-xs">
              <div className="flex items-center">
                <span>[</span>
                <span className="mx-1">{preview}</span>
                <span>, ...</span>
                <span>]</span>
              </div>
            </div>
          )}
        </div>

        {/* Additional info when collapsed */}
        {!isExpanded && (
          <p className="text-xs text-muted-foreground">
            Click expand to view all {dimensionCount} values
          </p>
        )}
      </CardContent>
    </Card>
  );
}
