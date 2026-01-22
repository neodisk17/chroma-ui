import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowUp, ArrowDown, MousePointerClick } from 'lucide-react';
import type { EmbeddingData } from './embedding-plot';

interface DimensionOutliersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dimension: number | null;
  embeddings: EmbeddingData[];
  onSelectDocument: (id: string) => void;
}

interface OutlierDoc {
  id: string;
  value: number;
  document: string;
}

export function DimensionOutliersDialog({
  open,
  onOpenChange,
  dimension,
  embeddings,
  onSelectDocument,
}: DimensionOutliersDialogProps) {
  const outliers = useMemo(() => {
    if (dimension === null || embeddings.length === 0) {
      return { highest: [], lowest: [] };
    }

    const withValues: OutlierDoc[] = embeddings.map((e) => ({
      id: e.id,
      value: e.vector[dimension] || 0,
      document: e.document,
    }));

    // Sort by value
    const sorted = [...withValues].sort((a, b) => b.value - a.value);

    return {
      highest: sorted.slice(0, 5),
      lowest: sorted.slice(-5).reverse(),
    };
  }, [dimension, embeddings]);

  const stats = useMemo(() => {
    if (dimension === null || embeddings.length === 0) {
      return null;
    }

    const values = embeddings.map((e) => e.vector[dimension] || 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return { min, max, mean, stdDev };
  }, [dimension, embeddings]);

  const handleSelect = (id: string) => {
    onSelectDocument(id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Dimension {dimension} Outliers
          </DialogTitle>
          <DialogDescription>
            Documents with extreme values in this dimension
          </DialogDescription>
        </DialogHeader>

        {stats && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            <Card className="bg-muted/30">
              <CardContent className="pt-2 pb-2 px-3">
                <p className="text-[10px] text-muted-foreground">Min</p>
                <p className="text-sm font-mono font-semibold">{stats.min.toFixed(4)}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardContent className="pt-2 pb-2 px-3">
                <p className="text-[10px] text-muted-foreground">Max</p>
                <p className="text-sm font-mono font-semibold">{stats.max.toFixed(4)}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardContent className="pt-2 pb-2 px-3">
                <p className="text-[10px] text-muted-foreground">Mean</p>
                <p className="text-sm font-mono font-semibold">{stats.mean.toFixed(4)}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardContent className="pt-2 pb-2 px-3">
                <p className="text-[10px] text-muted-foreground">Std Dev</p>
                <p className="text-sm font-mono font-semibold">{stats.stdDev.toFixed(4)}</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Highest Values */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-green-600">
              <ArrowUp className="h-4 w-4" />
              Highest Values
            </div>
            <ScrollArea className="h-64">
              <div className="space-y-2 pr-2">
                {outliers.highest.map((doc, idx) => (
                  <Card
                    key={doc.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSelect(doc.id)}
                  >
                    <CardContent className="pt-3 pb-3 px-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          #{idx + 1}
                        </Badge>
                        <Badge variant="outline" className="font-mono text-xs text-green-600">
                          {doc.value.toFixed(6)}
                        </Badge>
                      </div>
                      <p className="font-mono text-xs truncate">{doc.id}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {doc.document || <span className="italic">No content</span>}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <MousePointerClick className="h-3 w-3" />
                        Click to select
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Lowest Values */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-red-600">
              <ArrowDown className="h-4 w-4" />
              Lowest Values
            </div>
            <ScrollArea className="h-64">
              <div className="space-y-2 pr-2">
                {outliers.lowest.map((doc, idx) => (
                  <Card
                    key={doc.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSelect(doc.id)}
                  >
                    <CardContent className="pt-3 pb-3 px-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          #{idx + 1}
                        </Badge>
                        <Badge variant="outline" className="font-mono text-xs text-red-600">
                          {doc.value.toFixed(6)}
                        </Badge>
                      </div>
                      <p className="font-mono text-xs truncate">{doc.id}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {doc.document || <span className="italic">No content</span>}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <MousePointerClick className="h-3 w-3" />
                        Click to select
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
