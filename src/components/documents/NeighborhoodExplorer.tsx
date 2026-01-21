import { useMemo, useState, useEffect } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, ArrowLeftRight, Sparkles, Users, Target } from 'lucide-react';
import {
  findNearestNeighbors,
  findSharedNeighbors,
  computeMidpointVector,
  reduceTo2D,
  NeighborResult,
} from '@/lib/pca';
import type { Metadata } from '@/types/chromadb.types';

export interface EmbeddingData {
  id: string;
  vector: number[];
  document: string;
  metadata?: Metadata;
}

interface NeighborhoodExplorerProps {
  embeddings: EmbeddingData[];
  document1: EmbeddingData;
  document2: EmbeddingData;
  onSelectForCompare?: (id: string, slot: 1 | 2) => void;
}

interface PlotPoint {
  x: number;
  y: number;
  id: string;
  category: 'doc1' | 'doc2' | 'neighbor1' | 'neighbor2' | 'shared' | 'bridge';
  similarity?: number;
  document?: string;
}

const CATEGORY_COLORS = {
  doc1: '#3b82f6',       // Blue - Document 1
  doc2: '#22c55e',       // Green - Document 2
  neighbor1: '#93c5fd',  // Light blue - Doc 1 neighbors
  neighbor2: '#86efac',  // Light green - Doc 2 neighbors
  shared: '#f59e0b',     // Amber/Gold - Shared neighbors
  bridge: '#a855f7',     // Purple - Bridging documents
};

const CATEGORY_LABELS = {
  doc1: 'Document 1',
  doc2: 'Document 2',
  neighbor1: 'Similar to Doc 1',
  neighbor2: 'Similar to Doc 2',
  shared: 'Related to Both',
  bridge: 'Bridging Documents',
};

// Custom hook for debouncing values
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * NeighborhoodExplorer - Visualize the neighborhood around two compared documents
 *
 * Features:
 * - Mini 2D scatter plot focused on the neighborhood
 * - Color-coded points by relationship type
 * - Expandable lists of neighbors
 * - Click to swap into comparison slots
 */
export function NeighborhoodExplorer({
  embeddings,
  document1,
  document2,
  onSelectForCompare,
}: NeighborhoodExplorerProps) {
  const [neighborCount, setNeighborCount] = useState(5);
  const [minSharedSimilarity, setMinSharedSimilarity] = useState(0.5);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['shared'])
  );
  const [loadedMoreSections, setLoadedMoreSections] = useState<Set<string>>(new Set());
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Debounce slider values for smooth UI while computing
  const debouncedNeighborCount = useDebouncedValue(neighborCount, 150);
  const debouncedMinSharedSimilarity = useDebouncedValue(minSharedSimilarity, 150);

  const INITIAL_ITEMS_COUNT = 2;

  // Compute neighbors for both documents
  const neighbors1 = useMemo(() => {
    const excludeIds = new Set([document1.id, document2.id]);
    return findNearestNeighbors(document1.vector, embeddings, debouncedNeighborCount, excludeIds);
  }, [document1, document2, embeddings, debouncedNeighborCount]);

  const neighbors2 = useMemo(() => {
    const excludeIds = new Set([document1.id, document2.id]);
    return findNearestNeighbors(document2.vector, embeddings, debouncedNeighborCount, excludeIds);
  }, [document1, document2, embeddings, debouncedNeighborCount]);

  // Compute shared neighbors
  const sharedNeighbors = useMemo(() => {
    const excludeSet = new Set([document1.id, document2.id]);
    const filtered = embeddings.filter(e => !excludeSet.has(e.id));
    return findSharedNeighbors(
      document1.vector,
      document2.vector,
      filtered,
      debouncedMinSharedSimilarity,
      10
    );
  }, [document1, document2, embeddings, debouncedMinSharedSimilarity]);

  // Compute bridging documents (closest to midpoint)
  const bridgingDocs = useMemo(() => {
    const midpoint = computeMidpointVector(document1.vector, document2.vector);
    const excludeIds = new Set([document1.id, document2.id]);
    return findNearestNeighbors(midpoint, embeddings, debouncedNeighborCount, excludeIds);
  }, [document1, document2, embeddings, debouncedNeighborCount]);

  // Compute filtered lists that match plot categorization
  // These ensure the badge counts match what's shown on the plot
  const filteredLists = useMemo(() => {
    const neighbor1Ids = new Set(neighbors1.map(n => n.id));
    const neighbor2Ids = new Set(neighbors2.map(n => n.id));
    const sharedIds = new Set(sharedNeighbors.map(n => n.id));

    // Bridging docs that are NOT also neighbors (matches plot logic)
    const displayedBridgingDocs = bridgingDocs.filter(
      n => !neighbor1Ids.has(n.id) && !neighbor2Ids.has(n.id) && !sharedIds.has(n.id)
    );

    // Neighbors1 that are NOT shared
    const displayedNeighbors1 = neighbors1.filter(
      n => !sharedIds.has(n.id)
    );

    // Neighbors2 that are NOT shared and NOT already in neighbors1
    const displayedNeighbors2 = neighbors2.filter(
      n => !sharedIds.has(n.id) && !neighbor1Ids.has(n.id)
    );

    return {
      bridgingDocs: displayedBridgingDocs,
      neighbors1: displayedNeighbors1,
      neighbors2: displayedNeighbors2,
    };
  }, [neighbors1, neighbors2, sharedNeighbors, bridgingDocs]);

  // Create the set of all IDs to include in mini plot
  const neighborhoodIds = useMemo(() => {
    const ids = new Set<string>();
    ids.add(document1.id);
    ids.add(document2.id);
    neighbors1.forEach(n => ids.add(n.id));
    neighbors2.forEach(n => ids.add(n.id));
    sharedNeighbors.forEach(n => ids.add(n.id));
    bridgingDocs.forEach(n => ids.add(n.id));
    return ids;
  }, [document1.id, document2.id, neighbors1, neighbors2, sharedNeighbors, bridgingDocs]);

  // Filter embeddings for mini plot and compute 2D coordinates
  const plotData: PlotPoint[] = useMemo(() => {
    const neighborhoodEmbeddings = embeddings.filter(e => neighborhoodIds.has(e.id));
    if (neighborhoodEmbeddings.length < 2) return [];

    const vectors = neighborhoodEmbeddings.map(e => e.vector);
    const points2D = reduceTo2D(vectors);

    // Build ID sets for category assignment
    const neighbor1Ids = new Set(neighbors1.map(n => n.id));
    const neighbor2Ids = new Set(neighbors2.map(n => n.id));
    const sharedIds = new Set(sharedNeighbors.map(n => n.id));
    const bridgeIds = new Set(bridgingDocs.map(n => n.id));

    const results: PlotPoint[] = [];

    for (let index = 0; index < neighborhoodEmbeddings.length; index++) {
      const embedding = neighborhoodEmbeddings[index];
      const point = points2D[index];
      if (!embedding || !point) continue;

      // Determine category (priority: doc1/doc2 > shared > bridge > neighbor1/neighbor2)
      let category: PlotPoint['category'];
      if (embedding.id === document1.id) {
        category = 'doc1';
      } else if (embedding.id === document2.id) {
        category = 'doc2';
      } else if (sharedIds.has(embedding.id)) {
        category = 'shared';
      } else if (bridgeIds.has(embedding.id) && !neighbor1Ids.has(embedding.id) && !neighbor2Ids.has(embedding.id)) {
        category = 'bridge';
      } else if (neighbor1Ids.has(embedding.id)) {
        category = 'neighbor1';
      } else if (neighbor2Ids.has(embedding.id)) {
        category = 'neighbor2';
      } else {
        category = 'bridge';
      }

      results.push({
        x: point.x,
        y: point.y,
        id: embedding.id,
        category,
        document: embedding.document,
      });
    }

    return results;
  }, [embeddings, neighborhoodIds, document1.id, document2.id, neighbors1, neighbors2, sharedNeighbors, bridgingDocs]);

  // Get document 1 and 2 plot points for reference line
  const doc1Point = plotData.find(p => p.id === document1.id);
  const doc2Point = plotData.find(p => p.id === document2.id);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const getEmbeddingById = (id: string) => embeddings.find(e => e.id === id);

  // Custom tooltip for mini plot
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: PlotPoint }>;
  }) => {
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
  };

  const renderNeighborList = (
    title: string,
    icon: React.ReactNode,
    neighbors: Array<NeighborResult & { similarity1?: number; similarity2?: number }>,
    sectionKey: string,
    color: string
  ) => {
    const isExpanded = expandedSections.has(sectionKey);
    const isLoadedMore = loadedMoreSections.has(sectionKey);
    const displayedNeighbors = isLoadedMore
      ? neighbors
      : neighbors.slice(0, INITIAL_ITEMS_COUNT);
    const hasMore = neighbors.length > INITIAL_ITEMS_COUNT;
    const remainingCount = neighbors.length - INITIAL_ITEMS_COUNT;

    const handleLoadMore = () => {
      setLoadedMoreSections(prev => {
        const next = new Set(prev);
        next.add(sectionKey);
        return next;
      });
    };

    return (
      <Collapsible open={isExpanded} onOpenChange={() => toggleSection(sectionKey)}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between px-3 py-2 h-auto"
          >
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              {icon}
              <span className="font-medium">{title}</span>
              <Badge variant="secondary" className="ml-2">
                {neighbors.length}
              </Badge>
            </div>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {neighbors.length === 0 ? (
            <p className="text-sm text-muted-foreground px-3 py-2">
              No documents found matching criteria
            </p>
          ) : (
            <ScrollArea className="h-auto max-h-48">
              <div className="space-y-1 px-3 pb-2">
                {displayedNeighbors.map(neighbor => {
                  const embedding = getEmbeddingById(neighbor.id);
                  const docPreview = embedding?.document
                    ? embedding.document.length > 60
                      ? embedding.document.substring(0, 60) + '...'
                      : embedding.document
                    : '';

                  return (
                    <div
                      key={neighbor.id}
                      className={`p-2 rounded-md border bg-card hover:bg-accent transition-colors cursor-pointer ${
                        hoveredId === neighbor.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onMouseEnter={() => setHoveredId(neighbor.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs font-medium truncate max-w-[150px]">
                          {neighbor.id}
                        </span>
                        <div className="flex items-center gap-1">
                          {'similarity1' in neighbor && 'similarity2' in neighbor ? (
                            <>
                              <Badge variant="outline" className="text-xs bg-blue-50">
                                {((neighbor.similarity1 || 0) * 100).toFixed(0)}%
                              </Badge>
                              <Badge variant="outline" className="text-xs bg-green-50">
                                {((neighbor.similarity2 || 0) * 100).toFixed(0)}%
                              </Badge>
                            </>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              {(neighbor.similarity * 100).toFixed(1)}%
                            </Badge>
                          )}
                        </div>
                      </div>
                      {docPreview && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {docPreview}
                        </p>
                      )}
                      {onSelectForCompare && (
                        <div className="flex gap-1 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectForCompare(neighbor.id, 1);
                            }}
                          >
                            <ArrowLeftRight className="h-3 w-3 mr-1" />
                            Set as Doc 1
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectForCompare(neighbor.id, 2);
                            }}
                          >
                            <ArrowLeftRight className="h-3 w-3 mr-1" />
                            Set as Doc 2
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {hasMore && !isLoadedMore && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-muted-foreground hover:text-foreground"
                    onClick={handleLoadMore}
                  >
                    Load more ({remainingCount} remaining)
                  </Button>
                )}
              </div>
            </ScrollArea>
          )}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  console.log("filteredLists ", filteredLists)

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4" />
          Neighborhood Explorer
        </CardTitle>
        <CardDescription>
          Discover documents related to your comparison
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mini 2D Plot */}
        <div className="border rounded-lg p-3 bg-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Neighborhood Map</span>
            <div className="flex items-center gap-2 flex-wrap">
              {Object.entries(CATEGORY_COLORS).map(([key, color]) => (
                <div key={key} className="flex items-center gap-1 text-xs">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-muted-foreground">
                    {CATEGORY_LABELS[key as keyof typeof CATEGORY_LABELS]}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="number"
                dataKey="x"
                domain={[0, 1]}
                tick={{ fontSize: 10 }}
                tickFormatter={() => ''}
              />
              <YAxis
                type="number"
                dataKey="y"
                domain={[0, 1]}
                tick={{ fontSize: 10 }}
                tickFormatter={() => ''}
              />
              <Tooltip content={<CustomTooltip />} />
              {/* Reference line connecting doc1 and doc2 */}
              {doc1Point && doc2Point && (
                <ReferenceLine
                  segment={[
                    { x: doc1Point.x, y: doc1Point.y },
                    { x: doc2Point.x, y: doc2Point.y },
                  ]}
                  stroke="#94a3b8"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                />
              )}
              <Scatter
                key={`scatter-${debouncedNeighborCount}-${debouncedMinSharedSimilarity}`}
                data={plotData}
                onMouseEnter={(data: PlotPoint) => setHoveredId(data.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {plotData.map((point) => (
                  <Cell
                    key={point.id}
                    fill={CATEGORY_COLORS[point.category]}
                    r={
                      point.category === 'doc1' || point.category === 'doc2'
                        ? 10
                        : point.category === 'shared'
                          ? 8
                          : hoveredId === point.id
                            ? 7
                            : 6
                    }
                    stroke={hoveredId === point.id ? '#000' : 'none'}
                    strokeWidth={hoveredId === point.id ? 2 : 0}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Neighbors per document: {neighborCount}
            </label>
            <Slider
              value={[neighborCount]}
              onValueChange={([val]) => setNeighborCount(val || 5)}
              min={3}
              max={15}
              step={1}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Shared similarity threshold: {(minSharedSimilarity * 100).toFixed(0)}%
            </label>
            <Slider
              value={[minSharedSimilarity]}
              onValueChange={([val]) => setMinSharedSimilarity(val || 0.5)}
              min={0.3}
              max={0.9}
              step={0.05}
              className="w-full"
            />
          </div>
        </div>

        {/* Neighbor Lists */}
        <div className="space-y-1 border rounded-lg overflow-hidden">
          {renderNeighborList(
            'Related to Both',
            <Users className="h-4 w-4" />,
            sharedNeighbors,
            'shared',
            CATEGORY_COLORS.shared
          )}
          {renderNeighborList(
            'Bridging Documents',
            <Sparkles className="h-4 w-4" />,
            filteredLists.bridgingDocs,
            'bridge',
            CATEGORY_COLORS.bridge
          )}
          {renderNeighborList(
            `Similar to Document 1`,
            <span className="w-3 h-3 rounded-full bg-blue-500" />,
            filteredLists.neighbors1,
            'neighbors1',
            CATEGORY_COLORS.neighbor1
          )}
          {renderNeighborList(
            `Similar to Document 2`,
            <span className="w-3 h-3 rounded-full bg-green-500" />,
            filteredLists.neighbors2,
            'neighbors2',
            CATEGORY_COLORS.neighbor2
          )}
        </div>
      </CardContent>
    </Card>
  );
}
