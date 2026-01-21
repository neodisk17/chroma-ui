import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeftRight, X } from 'lucide-react';
import { cosineSimilarity, euclideanDistance, vectorMagnitude } from '@/lib/pca';
import { NeighborhoodExplorer } from './NeighborhoodExplorer';
import type { Metadata } from '@/types/chromadb.types';

export interface EmbeddingData {
  id: string;
  vector: number[];
  document: string;
  metadata?: Metadata;
}

interface EmbeddingCompareProps {
  embeddings: EmbeddingData[];
  onHighlightPoints?: (ids: [string, string] | null) => void;
}

/**
 * EmbeddingCompare component - Compare two documents side by side
 *
 * Features:
 * - Select two documents to compare
 * - Side-by-side display of document text and metadata
 * - Statistics: cosine similarity, Euclidean distance, vector magnitudes
 * - Highlights both points on the embedding plot
 */
export function EmbeddingCompare({ embeddings, onHighlightPoints }: EmbeddingCompareProps) {
  const [selectedId1, setSelectedId1] = useState<string | null>(null);
  const [selectedId2, setSelectedId2] = useState<string | null>(null);

  const document1 = useMemo(() => {
    return embeddings.find(e => e.id === selectedId1);
  }, [embeddings, selectedId1]);

  const document2 = useMemo(() => {
    return embeddings.find(e => e.id === selectedId2);
  }, [embeddings, selectedId2]);

  // Compute statistics when both documents are selected
  const stats = useMemo(() => {
    if (!document1 || !document2) return null;

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

  // Notify parent about highlighted points
  const handleSelection = (id1: string | null, id2: string | null) => {
    if (id1 && id2) {
      onHighlightPoints?.([id1, id2]);
    } else {
      onHighlightPoints?.(null);
    }
  };

  const handleSelectDocument1 = (id: string) => {
    setSelectedId1(id);
    handleSelection(id, selectedId2);
  };

  const handleSelectDocument2 = (id: string) => {
    setSelectedId2(id);
    handleSelection(selectedId1, id);
  };

  const handleSwapDocuments = () => {
    const temp = selectedId1;
    setSelectedId1(selectedId2);
    setSelectedId2(temp);
  };

  const handleClear = () => {
    setSelectedId1(null);
    setSelectedId2(null);
    onHighlightPoints?.(null);
  };

  // Handler for selecting a neighbor as one of the comparison documents
  const handleSelectForCompare = (id: string, slot: 1 | 2) => {
    if (slot === 1) {
      setSelectedId1(id);
      handleSelection(id, selectedId2);
    } else {
      setSelectedId2(id);
      handleSelection(selectedId1, id);
    }
  };

  // Get similarity color
  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.9) return 'bg-green-500/20 text-green-700';
    if (similarity >= 0.7) return 'bg-yellow-500/20 text-yellow-700';
    if (similarity >= 0.5) return 'bg-orange-500/20 text-orange-700';
    return 'bg-red-500/20 text-red-700';
  };

  const getSimilarityLabel = (similarity: number) => {
    if (similarity >= 0.9) return 'Very High';
    if (similarity >= 0.7) return 'High';
    if (similarity >= 0.5) return 'Moderate';
    if (similarity >= 0.3) return 'Low';
    return 'Very Low';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Compare Embeddings</CardTitle>
            <CardDescription>
              Select two documents to compare their embeddings
            </CardDescription>
          </div>
          {(selectedId1 || selectedId2) && (
            <Button variant="outline" size="sm" onClick={handleClear}>
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Document Selectors */}
        <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
          <div className="space-y-2">
            <label className="text-sm font-medium">Document 1</label>
            <Select value={selectedId1 || ''} onValueChange={handleSelectDocument1}>
              <SelectTrigger>
                <SelectValue placeholder="Select document..." />
              </SelectTrigger>
              <SelectContent>
                {embeddings.map(e => (
                  <SelectItem key={e.id} value={e.id} disabled={e.id === selectedId2}>
                    <span className="font-mono text-xs">{e.id}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleSwapDocuments}
            disabled={!selectedId1 || !selectedId2}
            className="mt-6"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </Button>

          <div className="space-y-2">
            <label className="text-sm font-medium">Document 2</label>
            <Select value={selectedId2 || ''} onValueChange={handleSelectDocument2}>
              <SelectTrigger>
                <SelectValue placeholder="Select document..." />
              </SelectTrigger>
              <SelectContent>
                {embeddings.map(e => (
                  <SelectItem key={e.id} value={e.id} disabled={e.id === selectedId1}>
                    <span className="font-mono text-xs">{e.id}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <Card className="border-2 border-primary/20">
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center space-y-1">
                  <p className="text-xs text-muted-foreground">Similarity Score</p>
                  <Badge className={getSimilarityColor(stats.cosineSimilarity)}>
                    {getSimilarityLabel(stats.cosineSimilarity)} ({(stats.cosineSimilarity * 100).toFixed(1)}%)
                  </Badge>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs text-muted-foreground">Euclidean Distance</p>
                  <p className="text-lg font-mono font-semibold">
                    {stats.euclideanDistance.toFixed(4)}
                  </p>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs text-muted-foreground">Doc 1 Magnitude</p>
                  <p className="text-lg font-mono font-semibold">
                    {stats.magnitude1.toFixed(4)}
                  </p>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs text-muted-foreground">Doc 2 Magnitude</p>
                  <p className="text-lg font-mono font-semibold">
                    {stats.magnitude2.toFixed(4)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Side by Side Comparison */}
        {document1 && document2 && (
          <div className="grid grid-cols-2 gap-4">
            {/* Document 1 */}
            <Card className="border-blue-500/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-blue-500" />
                  {document1.id}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Document</p>
                  <ScrollArea className="h-32 rounded-md border p-2">
                    <p className="text-sm">{document1.document}</p>
                  </ScrollArea>
                </div>
                {document1.metadata && Object.keys(document1.metadata).length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Metadata</p>
                    <ScrollArea className="h-24 rounded-md border p-2">
                      <pre className="text-xs font-mono">
                        {JSON.stringify(document1.metadata, null, 2)}
                      </pre>
                    </ScrollArea>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Dimensions: {document1.vector.length}</span>
                  <span>Magnitude: {stats?.magnitude1.toFixed(4)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Document 2 */}
            <Card className="border-green-500/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
                  {document2.id}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Document</p>
                  <ScrollArea className="h-32 rounded-md border p-2">
                    <p className="text-sm">{document2.document}</p>
                  </ScrollArea>
                </div>
                {document2.metadata && Object.keys(document2.metadata).length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Metadata</p>
                    <ScrollArea className="h-24 rounded-md border p-2">
                      <pre className="text-xs font-mono">
                        {JSON.stringify(document2.metadata, null, 2)}
                      </pre>
                    </ScrollArea>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Dimensions: {document2.vector.length}</span>
                  <span>Magnitude: {stats?.magnitude2.toFixed(4)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Neighborhood Explorer - shown when both documents are selected */}
        {document1 && document2 && (
          <NeighborhoodExplorer
            embeddings={embeddings}
            document1={document1}
            document2={document2}
            onSelectForCompare={handleSelectForCompare}
          />
        )}

        {/* Empty state */}
        {(!selectedId1 || !selectedId2) && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">
              {!selectedId1 && !selectedId2
                ? 'Select two documents to compare their embeddings'
                : !selectedId1
                  ? 'Select Document 1 to compare'
                  : 'Select Document 2 to compare'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
