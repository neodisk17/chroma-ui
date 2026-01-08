import { useState, useMemo, useCallback } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  Cell,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { reduceTo2D, euclideanDistance, cosineSimilarity, Point2D } from '@/lib/pca';
import type { Metadata } from '@/types/chromadb.types';

export interface EmbeddingData {
  id: string;
  vector: number[];
  document: string;
  metadata?: Metadata;
}

interface EmbeddingPlotProps {
  embeddings: EmbeddingData[];
  selectedId?: string;
  onPointClick?: (id: string) => void;
}

interface PlotPoint extends Point2D {
  id: string;
  document: string;
  metadata?: Metadata;
  distance?: number;
  similarity?: number;
}

/**
 * EmbeddingPlot component - Interactive 2D visualization of embeddings
 *
 * Features:
 * - PCA dimensionality reduction for high-dimensional embeddings
 * - Interactive scatter plot with hover tooltips
 * - Click to view document details
 * - Similarity highlighting (color by distance to selected point)
 * - Zoom and reset controls
 * - Responsive design
 */
export function EmbeddingPlot({ embeddings, selectedId, onPointClick }: EmbeddingPlotProps) {
  const [isReducing, setIsReducing] = useState(false);
  const [reducedData, setReducedData] = useState<PlotPoint[] | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [zoomDomain, setZoomDomain] = useState<{ x: [number, number]; y: [number, number] } | null>(null);

  // Check if embeddings need reduction
  const needsReduction = embeddings.length > 0 && embeddings[0] && embeddings[0].vector.length > 2;

  // Selected embedding data
  const selectedEmbedding = useMemo(() => {
    if (!selectedId) return null;
    return embeddings.find(e => e.id === selectedId);
  }, [embeddings, selectedId]);

  // Reduce to 2D using PCA
  const handleReduce = useCallback(async () => {
    setIsReducing(true);

    // Run PCA in next tick to allow UI to update
    setTimeout(() => {
      try {
        const vectors = embeddings.map(e => e.vector);
        const points2D = reduceTo2D(vectors);

        // Combine with original data
        const plotData: PlotPoint[] = embeddings.map((embedding, index) => {
          const point = points2D[index];
          if (!point) {
            return {
              x: 0,
              y: 0,
              id: embedding.id,
              document: embedding.document,
              metadata: embedding.metadata,
            };
          }

          let distance: number | undefined;
          let similarity: number | undefined;

          // Compute distance and similarity to selected point if any
          if (selectedEmbedding) {
            distance = euclideanDistance(embedding.vector, selectedEmbedding.vector);
            similarity = cosineSimilarity(embedding.vector, selectedEmbedding.vector);
          }

          return {
            x: point.x,
            y: point.y,
            id: embedding.id,
            document: embedding.document,
            metadata: embedding.metadata,
            distance,
            similarity,
          };
        });

        setReducedData(plotData);
      } catch (error) {
        console.error('Failed to reduce embeddings:', error);
      } finally {
        setIsReducing(false);
      }
    }, 100);
  }, [embeddings, selectedEmbedding]);

  // Automatically reduce if embeddings are already 2D
  useMemo(() => {
    if (!needsReduction && embeddings.length > 0) {
      const vectors = embeddings.map(e => e.vector);
      const points2D = reduceTo2D(vectors);

      const plotData: PlotPoint[] = embeddings.map((embedding, index) => {
        const point = points2D[index];
        if (!point) {
          return {
            x: 0,
            y: 0,
            id: embedding.id,
            document: embedding.document,
            metadata: embedding.metadata,
          };
        }

        let distance: number | undefined;
        let similarity: number | undefined;

        if (selectedEmbedding) {
          distance = euclideanDistance(embedding.vector, selectedEmbedding.vector);
          similarity = cosineSimilarity(embedding.vector, selectedEmbedding.vector);
        }

        return {
          x: point.x,
          y: point.y,
          id: embedding.id,
          document: embedding.document,
          metadata: embedding.metadata,
          distance,
          similarity,
        };
      });

      setReducedData(plotData);
    }
  }, [embeddings, needsReduction, selectedEmbedding]);

  // Get color for point based on selection and distance
  const getPointColor = useCallback((point: PlotPoint) => {
    // Selected point
    if (point.id === selectedId) {
      return '#ef4444'; // red
    }

    // Hovered point
    if (point.id === hoveredId) {
      return '#f97316'; // orange
    }

    // Color by distance if point is selected
    if (selectedId && point.distance !== undefined) {
      if (point.distance < 0.2) return '#22c55e'; // green - very similar
      if (point.distance < 0.5) return '#eab308'; // yellow - similar
      return '#3b82f6'; // blue - different
    }

    // Default
    return '#3b82f6'; // blue
  }, [selectedId, hoveredId]);

  // Get point radius based on selection
  const getPointRadius = useCallback((point: PlotPoint) => {
    if (point.id === selectedId) return 9;
    if (point.id === hoveredId) return 7;
    return 5;
  }, [selectedId, hoveredId]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: PlotPoint }> }) => {
    if (!active || !payload || payload.length === 0 || !payload[0]?.payload) return null;

    const point = payload[0].payload;
    const docPreview = point.document.length > 100
      ? point.document.substring(0, 100) + '...'
      : point.document;

    return (
      <Card className="max-w-sm border-2 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono">{point.id}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Document:</p>
            <p className="text-sm">{docPreview}</p>
          </div>
          {point.metadata && Object.keys(point.metadata).length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Metadata:</p>
              <pre className="text-xs font-mono bg-muted p-1 rounded overflow-auto max-h-20">
                {JSON.stringify(point.metadata, null, 2)}
              </pre>
            </div>
          )}
          {selectedId && point.id !== selectedId && (
            <div className="flex gap-2 pt-2 border-t">
              <Badge variant="outline" className="text-xs">
                Distance: {point.distance?.toFixed(4)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Similarity: {((point.similarity || 0) * 100).toFixed(1)}%
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Handle zoom
  const handleZoomIn = () => {
    if (!reducedData) return;
    const currentDomain = zoomDomain || { x: [0, 1], y: [0, 1] };
    const xRange = currentDomain.x[1] - currentDomain.x[0];
    const yRange = currentDomain.y[1] - currentDomain.y[0];
    const xCenter = (currentDomain.x[0] + currentDomain.x[1]) / 2;
    const yCenter = (currentDomain.y[0] + currentDomain.y[1]) / 2;

    setZoomDomain({
      x: [xCenter - xRange / 4, xCenter + xRange / 4],
      y: [yCenter - yRange / 4, yCenter + yRange / 4],
    });
  };

  const handleZoomOut = () => {
    if (!reducedData) return;
    const currentDomain = zoomDomain || { x: [0, 1], y: [0, 1] };
    const xRange = currentDomain.x[1] - currentDomain.x[0];
    const yRange = currentDomain.y[1] - currentDomain.y[0];
    const xCenter = (currentDomain.x[0] + currentDomain.x[1]) / 2;
    const yCenter = (currentDomain.y[0] + currentDomain.y[1]) / 2;

    setZoomDomain({
      x: [Math.max(0, xCenter - xRange), Math.min(1, xCenter + xRange)],
      y: [Math.max(0, yCenter - yRange), Math.min(1, yCenter + yRange)],
    });
  };

  const handleResetView = () => {
    setZoomDomain(null);
  };

  // Empty state
  if (embeddings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Embedding Visualization</CardTitle>
          <CardDescription>No embeddings to visualize</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Embedding Visualization</CardTitle>
            <CardDescription>
              {embeddings.length} documents | {embeddings[0]?.vector.length || 0} dimensions
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {needsReduction && !reducedData && (
              <Button onClick={handleReduce} disabled={isReducing}>
                {isReducing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reduce to 2D
              </Button>
            )}
            {reducedData && (
              <>
                <Button variant="outline" size="icon" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleResetView}>
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
        {selectedId && reducedData && (
          <div className="flex items-center gap-2 pt-2">
            <span className="text-sm text-muted-foreground">Color legend:</span>
            <Badge variant="outline" className="bg-green-500/20 text-green-700">
              Very Similar (&lt; 0.2)
            </Badge>
            <Badge variant="outline" className="bg-yellow-500/20 text-yellow-700">
              Similar (0.2-0.5)
            </Badge>
            <Badge variant="outline" className="bg-blue-500/20 text-blue-700">
              Different (&gt; 0.5)
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isReducing ? (
          <div className="flex h-96 items-center justify-center">
            <div className="text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">Computing PCA...</p>
            </div>
          </div>
        ) : reducedData ? (
          <ResponsiveContainer width="100%" height={500}>
            <ScatterChart
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              onClick={(e) => {
                if (e && 'activePayload' in e && e.activePayload && Array.isArray(e.activePayload) && e.activePayload.length > 0) {
                  const point = e.activePayload[0].payload as PlotPoint;
                  onPointClick?.(point.id);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="x"
                name="PC1"
                domain={zoomDomain ? zoomDomain.x : [0, 1]}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="PC2"
                domain={zoomDomain ? zoomDomain.y : [0, 1]}
                tick={{ fontSize: 12 }}
              />
              <ZAxis range={[50, 200]} />
              <Tooltip content={<CustomTooltip />} />
              <Scatter
                data={reducedData}
                onMouseEnter={(data: PlotPoint) => setHoveredId(data.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{ cursor: 'pointer' }}
              >
                {reducedData.map((point) => (
                  <Cell
                    key={point.id}
                    fill={getPointColor(point)}
                    r={getPointRadius(point)}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-96 items-center justify-center">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Click "Reduce to 2D" to visualize embeddings
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
