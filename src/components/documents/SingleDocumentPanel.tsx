import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { X, FileText, Hash, Ruler } from 'lucide-react';
import { vectorMagnitude } from '@/lib/pca';
import type { EmbeddingData } from './embedding-plot';

interface SingleDocumentPanelProps {
  document: EmbeddingData;
  onClose: () => void;
}

export function SingleDocumentPanel({ document, onClose }: SingleDocumentPanelProps) {
  const magnitude = useMemo(() => {
    return vectorMagnitude(document.vector);
  }, [document.vector]);

  const hasMetadata = document.metadata && Object.keys(document.metadata).length > 0;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between pb-3 border-b">
        <h3 className="font-semibold text-sm">Document Details</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 mt-3">
        <div className="space-y-4 pr-2">
          {/* Document ID */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Hash className="h-3 w-3" />
              Document ID
            </div>
            <p className="font-mono text-sm break-all bg-muted/50 p-2 rounded">
              {document.id}
            </p>
          </div>

          {/* Vector Info */}
          <Card className="bg-muted/30">
            <CardContent className="pt-4 pb-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Dimensions</p>
                  <p className="text-lg font-bold">{document.vector.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Magnitude</p>
                  <p className="text-lg font-bold font-mono">{magnitude.toFixed(4)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Content */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" />
              Document Content
            </div>
            <Card>
              <ScrollArea className="h-40">
                <CardContent className="pt-3 pb-3">
                  <p className="text-sm whitespace-pre-wrap">
                    {document.document || <span className="text-muted-foreground italic">No content</span>}
                  </p>
                </CardContent>
              </ScrollArea>
            </Card>
          </div>

          {/* Metadata */}
          {hasMetadata && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Ruler className="h-3 w-3" />
                Metadata
              </div>
              <Card>
                <ScrollArea className="h-32">
                  <CardContent className="pt-3 pb-3">
                    <div className="space-y-2">
                      {Object.entries(document.metadata!).map(([key, value]) => (
                        <div key={key} className="flex items-start justify-between gap-2">
                          <span className="text-xs font-medium text-muted-foreground">{key}</span>
                          <Badge variant="outline" className="text-xs font-mono max-w-[60%] truncate">
                            {String(value)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </ScrollArea>
              </Card>
            </div>
          )}

          {/* Vector Preview */}
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">
              Vector Preview (first 10 values)
            </div>
            <div className="flex flex-wrap gap-1">
              {document.vector.slice(0, 10).map((value, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs font-mono">
                  {value.toFixed(4)}
                </Badge>
              ))}
              {document.vector.length > 10 && (
                <Badge variant="outline" className="text-xs">
                  +{document.vector.length - 10} more
                </Badge>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
