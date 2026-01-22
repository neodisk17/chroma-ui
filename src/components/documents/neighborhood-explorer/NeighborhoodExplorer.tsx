import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Users, Target } from 'lucide-react';
import {
  findNearestNeighbors,
  findSharedNeighbors,
  computeMidpointVector,
  reduceTo2D,
} from '@/lib/pca';
import {
  EmbeddingData,
  NeighborhoodExplorerProps,
  PlotPoint,
  CATEGORY_COLORS,
} from './types';
import { NeighborhoodPlot } from './NeighborhoodPlot';
import { NeighborhoodControls } from './NeighborhoodControls';
import { NeighborList } from './NeighborList';

// Re-export types for backward compatibility
export type { EmbeddingData };

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
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const debouncedNeighborCount = useDebouncedValue(neighborCount, 150);
  const debouncedMinSharedSimilarity = useDebouncedValue(minSharedSimilarity, 150);

  const neighbors1 = useMemo(() => {
    const excludeIds = new Set([document1.id, document2.id]);
    return findNearestNeighbors(document1.vector, embeddings, debouncedNeighborCount, excludeIds);
  }, [document1, document2, embeddings, debouncedNeighborCount]);

  const neighbors2 = useMemo(() => {
    const excludeIds = new Set([document1.id, document2.id]);
    return findNearestNeighbors(document2.vector, embeddings, debouncedNeighborCount, excludeIds);
  }, [document1, document2, embeddings, debouncedNeighborCount]);

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

  const bridgingDocs = useMemo(() => {
    const midpoint = computeMidpointVector(document1.vector, document2.vector);
    const excludeIds = new Set([document1.id, document2.id]);
    return findNearestNeighbors(midpoint, embeddings, debouncedNeighborCount, excludeIds);
  }, [document1, document2, embeddings, debouncedNeighborCount]);

  const filteredLists = useMemo(() => {
    const neighbor1Ids = new Set(neighbors1.map(n => n.id));
    const neighbor2Ids = new Set(neighbors2.map(n => n.id));
    const sharedIds = new Set(sharedNeighbors.map(n => n.id));

    const displayedBridgingDocs = bridgingDocs.filter(
      n => !neighbor1Ids.has(n.id) && !neighbor2Ids.has(n.id) && !sharedIds.has(n.id)
    );

    const displayedNeighbors1 = neighbors1.filter(
      n => !sharedIds.has(n.id)
    );

    const displayedNeighbors2 = neighbors2.filter(
      n => !sharedIds.has(n.id) && !neighbor1Ids.has(n.id)
    );

    return {
      bridgingDocs: displayedBridgingDocs,
      neighbors1: displayedNeighbors1,
      neighbors2: displayedNeighbors2,
    };
  }, [neighbors1, neighbors2, sharedNeighbors, bridgingDocs]);

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

  const plotData: PlotPoint[] = useMemo(() => {
    const neighborhoodEmbeddings = embeddings.filter(e => neighborhoodIds.has(e.id));
    if (neighborhoodEmbeddings.length < 2) return [];

    const vectors = neighborhoodEmbeddings.map(e => e.vector);
    const points2D = reduceTo2D(vectors);

    const neighbor1Ids = new Set(neighbors1.map(n => n.id));
    const neighbor2Ids = new Set(neighbors2.map(n => n.id));
    const sharedIds = new Set(sharedNeighbors.map(n => n.id));
    const bridgeIds = new Set(bridgingDocs.map(n => n.id));

    const results: PlotPoint[] = [];

    for (let index = 0; index < neighborhoodEmbeddings.length; index++) {
      const embedding = neighborhoodEmbeddings[index];
      const point = points2D[index];
      if (!embedding || !point) continue;

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
        <NeighborhoodPlot
          plotData={plotData}
          doc1Point={doc1Point}
          doc2Point={doc2Point}
          hoveredId={hoveredId}
          onHover={setHoveredId}
          scatterKey={`scatter-${debouncedNeighborCount}-${debouncedMinSharedSimilarity}`}
        />

        <NeighborhoodControls
          neighborCount={neighborCount}
          onNeighborCountChange={setNeighborCount}
          minSharedSimilarity={minSharedSimilarity}
          onMinSharedSimilarityChange={setMinSharedSimilarity}
        />

        <div className="space-y-1 border rounded-lg overflow-hidden">
          <NeighborList
            title="Related to Both"
            icon={<Users className="h-4 w-4" />}
            neighbors={sharedNeighbors}
            color={CATEGORY_COLORS.shared}
            isExpanded={expandedSections.has('shared')}
            onToggle={() => toggleSection('shared')}
            hoveredId={hoveredId}
            onHover={setHoveredId}
            getEmbeddingById={getEmbeddingById}
            onSelectForCompare={onSelectForCompare}
          />
          <NeighborList
            title="Bridging Documents"
            icon={<Sparkles className="h-4 w-4" />}
            neighbors={filteredLists.bridgingDocs}
            color={CATEGORY_COLORS.bridge}
            isExpanded={expandedSections.has('bridge')}
            onToggle={() => toggleSection('bridge')}
            hoveredId={hoveredId}
            onHover={setHoveredId}
            getEmbeddingById={getEmbeddingById}
            onSelectForCompare={onSelectForCompare}
          />
          <NeighborList
            title="Similar to Document 1"
            icon={<span className="w-3 h-3 rounded-full bg-blue-500" />}
            neighbors={filteredLists.neighbors1}
            color={CATEGORY_COLORS.neighbor1}
            isExpanded={expandedSections.has('neighbors1')}
            onToggle={() => toggleSection('neighbors1')}
            hoveredId={hoveredId}
            onHover={setHoveredId}
            getEmbeddingById={getEmbeddingById}
            onSelectForCompare={onSelectForCompare}
          />
          <NeighborList
            title="Similar to Document 2"
            icon={<span className="w-3 h-3 rounded-full bg-green-500" />}
            neighbors={filteredLists.neighbors2}
            color={CATEGORY_COLORS.neighbor2}
            isExpanded={expandedSections.has('neighbors2')}
            onToggle={() => toggleSection('neighbors2')}
            hoveredId={hoveredId}
            onHover={setHoveredId}
            getEmbeddingById={getEmbeddingById}
            onSelectForCompare={onSelectForCompare}
          />
        </div>
      </CardContent>
    </Card>
  );
}
