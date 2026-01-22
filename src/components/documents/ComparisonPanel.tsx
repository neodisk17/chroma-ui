import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { X, ArrowLeftRight } from 'lucide-react';
import { cosineSimilarity, euclideanDistance, vectorMagnitude } from '@/lib/pca';
import { NeighborhoodExplorer } from './NeighborhoodExplorer';
import type { EmbeddingData } from './embedding-plot';

interface ComparisonPanelProps {
  document1: EmbeddingData;
  document2: EmbeddingData;
  allEmbeddings: EmbeddingData[];
  onSwap: () => void;
  onClear: () => void;
  onSelectForCompare: (id: string, slot: 1 | 2) => void;
}

export function ComparisonPanel({
  document1,
  document2,
  allEmbeddings,
  onSwap,
  onClear,
  onSelectForCompare,
}: ComparisonPanelProps) {
  // Compute comparison statistics
  const stats = useMemo(() => {
    try {
      const similarity = cosineSimilarity(document1.vector, document2.vector);
      const distance = euclideanDistance(document1.vector, document2.vector);
      const magnitude1 = vectorMagnitude(document1.vector);
      const magnitude2 = vectorMagnitude(document2.vector);

      return {
        cosineSimilarity: similarity,
        euclideanDistance: distance,
        magnitude1,
        magnitude2,
      };
    } catch {
      return null;
    }
  }, [document1, document2]);

  // Get similarity color
  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.9) return 'bg-green-500 text-white';
    if (similarity >= 0.7) return 'bg-yellow-500 text-white';
    if (similarity >= 0.5) return 'bg-orange-500 text-white';
    return 'bg-red-500 text-white';
  };

  const getSimilarityLabel = (similarity: number) => {
    if (similarity >= 0.9) return 'Very High';
    if (similarity >= 0.7) return 'High';
    if (similarity >= 0.5) return 'Moderate';
    if (similarity >= 0.3) return 'Low';
    return 'Very Low';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between pb-3 border-b">
        <h3 className="font-semibold text-sm">Comparing Documents</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onSwap} title="Swap documents">
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClear}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 mt-3">
        <div className="space-y-4 pr-2">
          {/* Similarity Score - Prominent Display */}
          {stats && (
            <Card className="border-2 border-primary/30">
              <CardContent className="pt-4 pb-4">
                <div className="text-center space-y-2">
                  <p className="text-xs text-muted-foreground">Cosine Similarity</p>
                  <Badge className={`${getSimilarityColor(stats.cosineSimilarity)} text-lg px-4 py-1`}>
                    {(stats.cosineSimilarity * 100).toFixed(1)}%
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {getSimilarityLabel(stats.cosineSimilarity)} Similarity
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Metrics */}
          {stats && (
            <div className="grid grid-cols-3 gap-2">
              <Card className="bg-muted/30">
                <CardContent className="pt-2 pb-2 px-2">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Distance</p>
                    <p className="text-sm font-mono font-semibold">{stats.euclideanDistance.toFixed(3)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-muted/30">
                <CardContent className="pt-2 pb-2 px-2">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Doc 1 Mag</p>
                    <p className="text-sm font-mono font-semibold">{stats.magnitude1.toFixed(3)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-muted/30">
                <CardContent className="pt-2 pb-2 px-2">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Doc 2 Mag</p>
                    <p className="text-sm font-mono font-semibold">{stats.magnitude2.toFixed(3)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Side-by-Side Document Cards */}
          <div className="space-y-3">
            {/* Document 1 */}
            <Card className="border-blue-500/50 border-l-4">
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-xs font-mono flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                  <span className="truncate">{document1.id}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-3 pb-3 space-y-2">
                <ScrollArea className="h-20 rounded-md border p-2">
                  <p className="text-xs">{document1.document || <span className="text-muted-foreground italic">No content</span>}</p>
                </ScrollArea>
                {document1.metadata && Object.keys(document1.metadata).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(document1.metadata).slice(0, 3).map(([key, value]) => (
                      <Badge key={key} variant="outline" className="text-[10px]">
                        {key}: {String(value).slice(0, 15)}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Document 2 */}
            <Card className="border-green-500/50 border-l-4">
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-xs font-mono flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                  <span className="truncate">{document2.id}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-3 pb-3 space-y-2">
                <ScrollArea className="h-20 rounded-md border p-2">
                  <p className="text-xs">{document2.document || <span className="text-muted-foreground italic">No content</span>}</p>
                </ScrollArea>
                {document2.metadata && Object.keys(document2.metadata).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(document2.metadata).slice(0, 3).map(([key, value]) => (
                      <Badge key={key} variant="outline" className="text-[10px]">
                        {key}: {String(value).slice(0, 15)}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Neighborhood Explorer */}
          <NeighborhoodExplorer
            embeddings={allEmbeddings}
            document1={document1}
            document2={document2}
            onSelectForCompare={onSelectForCompare}
          />
        </div>
      </ScrollArea>
    </div>
  );
}
