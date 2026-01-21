import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
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
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2, ZoomIn, ZoomOut, RotateCcw, Download, Image, FileText, FileJson, AlertCircle, Move } from 'lucide-react';
import { toPng } from 'html-to-image';
import { reduceTo2D, euclideanDistance, cosineSimilarity, Point2D } from '@/lib/pca';
import PcaWorker from '@/workers/pca.worker?worker';
import type { Metadata } from '@/types/chromadb.types';

const MAX_POINTS = 1000; // Maximum points to visualize for performance

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
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSampled, setIsSampled] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const plotRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const zoomDomainRef = useRef(zoomDomain);
  const rafIdRef = useRef<number | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    zoomDomainRef.current = zoomDomain;
  }, [zoomDomain]);

  // Cleanup worker and animation frame on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // Check if embeddings need reduction
  const needsReduction = embeddings.length > 0 && embeddings[0] && embeddings[0].vector.length > 2;

  // Selected embedding data
  const selectedEmbedding = useMemo(() => {
    if (!selectedId) return null;
    return embeddings.find(e => e.id === selectedId);
  }, [embeddings, selectedId]);

  // Sample embeddings if there are too many
  const sampledEmbeddings = useMemo(() => {
    if (embeddings.length <= MAX_POINTS) {
      return embeddings;
    }

    // Uniform sampling
    const sampled: EmbeddingData[] = [];
    const step = embeddings.length / MAX_POINTS;

    for (let i = 0; i < MAX_POINTS; i++) {
      const idx = Math.floor(i * step);
      sampled.push(embeddings[idx]!);
    }

    return sampled;
  }, [embeddings]);

  // Fallback to main thread computation
  const fallbackReduce = useCallback(() => {
    try {
      const vectors = sampledEmbeddings.map(e => e.vector);
      const points2D = reduceTo2D(vectors);

      const plotData: PlotPoint[] = sampledEmbeddings.map((embedding, index) => {
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
    } catch (error) {
      console.error('Failed to reduce embeddings:', error);
    } finally {
      setIsReducing(false);
    }
  }, [sampledEmbeddings, selectedEmbedding]);

  // Reduce to 2D using PCA via Web Worker
  const handleReduce = useCallback(async () => {
    setIsReducing(true);
    setProgress(0);
    setIsSampled(embeddings.length > MAX_POINTS);

    // Terminate existing worker if any
    if (workerRef.current) {
      workerRef.current.terminate();
    }

    // Create new worker
    const worker = new PcaWorker();
    workerRef.current = worker;

    worker.onmessage = (event) => {
      const { type, progress: p, result, error } = event.data;

      if (type === 'progress') {
        setProgress(p);
      } else if (type === 'complete') {
        // Combine with original data
        const plotData: PlotPoint[] = sampledEmbeddings.map((embedding, index) => {
          const point = result[index];
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
        setIsReducing(false);
        setProgress(100);
      } else if (type === 'error') {
        console.error('Worker error:', error);
        // Fallback to main thread
        fallbackReduce();
      }
    };

    worker.onerror = () => {
      console.error('Worker failed, falling back to main thread');
      fallbackReduce();
    };

    // Start computation
    const vectors = sampledEmbeddings.map(e => e.vector);
    worker.postMessage({ type: 'compute', embeddings: vectors });
  }, [embeddings.length, sampledEmbeddings, selectedEmbedding, fallbackReduce]);

  // Automatically reduce if embeddings are already 2D
  useMemo(() => {
    if (!needsReduction && sampledEmbeddings.length > 0) {
      setIsSampled(embeddings.length > MAX_POINTS);
      const vectors = sampledEmbeddings.map(e => e.vector);
      const points2D = reduceTo2D(vectors);

      const plotData: PlotPoint[] = sampledEmbeddings.map((embedding, index) => {
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
  }, [embeddings.length, sampledEmbeddings, needsReduction, selectedEmbedding]);

  // Export as PNG
  const handleExportPng = useCallback(async () => {
    if (!plotRef.current || !reducedData) return;

    setIsExporting(true);
    try {
      const dataUrl = await toPng(plotRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });

      const link = document.createElement('a');
      link.download = `embeddings-plot-${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to export as PNG:', error);
    } finally {
      setIsExporting(false);
    }
  }, [reducedData]);

  // Export as CSV
  const handleExportCsv = useCallback(() => {
    if (!reducedData) return;

    const csvRows = [
      ['id', 'x', 'y', 'document_preview'].join(','),
      ...reducedData.map(point => {
        const docPreview = point.document.substring(0, 50).replace(/"/g, '""').replace(/\n/g, ' ');
        return [
          `"${point.id}"`,
          point.x.toFixed(6),
          point.y.toFixed(6),
          `"${docPreview}"`,
        ].join(',');
      }),
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = `embeddings-2d-${new Date().toISOString().split('T')[0]}.csv`;
    link.href = url;
    link.click();

    URL.revokeObjectURL(url);
  }, [reducedData]);

  // Export as JSON
  const handleExportJson = useCallback(() => {
    const exportData = embeddings.map((embedding, index) => ({
      id: embedding.id,
      document: embedding.document,
      metadata: embedding.metadata,
      vector: embedding.vector,
      coordinates2D: reducedData?.[index] ? {
        x: reducedData[index].x,
        y: reducedData[index].y,
      } : null,
    }));

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = `embeddings-full-${new Date().toISOString().split('T')[0]}.json`;
    link.href = url;
    link.click();

    URL.revokeObjectURL(url);
  }, [embeddings, reducedData]);

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

  // Compute data bounds for zoom
  const dataBounds = useMemo(() => {
    if (!reducedData || reducedData.length === 0) {
      return { x: [-1, 1] as [number, number], y: [-1, 1] as [number, number] };
    }

    const xValues = reducedData.map(p => p.x);
    const yValues = reducedData.map(p => p.y);

    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);

    // Add some padding (10%)
    const xPadding = (xMax - xMin) * 0.1 || 0.1;
    const yPadding = (yMax - yMin) * 0.1 || 0.1;

    return {
      x: [xMin - xPadding, xMax + xPadding] as [number, number],
      y: [yMin - yPadding, yMax + yPadding] as [number, number],
    };
  }, [reducedData]);

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
  const handleZoomIn = useCallback(() => {
    if (!reducedData) return;
    const currentDomain = zoomDomain || dataBounds;
    const xRange = currentDomain.x[1] - currentDomain.x[0];
    const yRange = currentDomain.y[1] - currentDomain.y[0];
    const xCenter = (currentDomain.x[0] + currentDomain.x[1]) / 2;
    const yCenter = (currentDomain.y[0] + currentDomain.y[1]) / 2;

    setZoomDomain({
      x: [xCenter - xRange / 4, xCenter + xRange / 4],
      y: [yCenter - yRange / 4, yCenter + yRange / 4],
    });
  }, [reducedData, zoomDomain, dataBounds]);

  const handleZoomOut = useCallback(() => {
    if (!reducedData) return;
    const currentDomain = zoomDomain || dataBounds;
    const xRange = currentDomain.x[1] - currentDomain.x[0];
    const yRange = currentDomain.y[1] - currentDomain.y[0];
    const xCenter = (currentDomain.x[0] + currentDomain.x[1]) / 2;
    const yCenter = (currentDomain.y[0] + currentDomain.y[1]) / 2;

    // Allow zooming out up to 2x the original bounds
    const maxXRange = (dataBounds.x[1] - dataBounds.x[0]) * 2;
    const maxYRange = (dataBounds.y[1] - dataBounds.y[0]) * 2;
    const newXRange = Math.min(xRange * 2, maxXRange);
    const newYRange = Math.min(yRange * 2, maxYRange);

    setZoomDomain({
      x: [xCenter - newXRange / 2, xCenter + newXRange / 2],
      y: [yCenter - newYRange / 2, yCenter + newYRange / 2],
    });
  }, [reducedData, zoomDomain, dataBounds]);

  const handleResetView = useCallback(() => {
    setZoomDomain(null);
  }, []);

  // Pan handlers for dragging when zoomed
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!zoomDomainRef.current) return; // Only allow panning when zoomed
    e.preventDefault();
    setIsPanning(true);
    panStartRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!panStartRef.current || !zoomDomainRef.current || !plotRef.current) return;

    // Cancel any pending animation frame
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

    const clientX = e.clientX;
    const clientY = e.clientY;

    rafIdRef.current = requestAnimationFrame(() => {
      if (!panStartRef.current || !zoomDomainRef.current || !plotRef.current) return;

      const plotRect = plotRef.current.getBoundingClientRect();
      const plotWidth = plotRect.width - 40; // Account for margins
      const plotHeight = 500 - 40; // Account for margins

      const dx = clientX - panStartRef.current.x;
      const dy = clientY - panStartRef.current.y;

      // Convert pixel movement to data units
      const currentDomain = zoomDomainRef.current;
      const xRange = currentDomain.x[1] - currentDomain.x[0];
      const yRange = currentDomain.y[1] - currentDomain.y[0];

      const xDelta = -(dx / plotWidth) * xRange;
      const yDelta = (dy / plotHeight) * yRange; // Inverted because Y axis is flipped

      const newDomain = {
        x: [currentDomain.x[0] + xDelta, currentDomain.x[1] + xDelta] as [number, number],
        y: [currentDomain.y[0] + yDelta, currentDomain.y[1] + yDelta] as [number, number],
      };

      zoomDomainRef.current = newDomain;
      setZoomDomain(newDomain);
      panStartRef.current = { x: clientX, y: clientY };
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    setIsPanning(false);
    panStartRef.current = null;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    setIsPanning(false);
    panStartRef.current = null;
  }, []);

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
                <Button variant="outline" size="icon" onClick={handleZoomIn} title="Zoom in">
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleZoomOut} title="Zoom out">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleResetView} title="Reset view">
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" disabled={isExporting}>
                      {isExporting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleExportPng}>
                      <Image className="mr-2 h-4 w-4" />
                      Export as PNG
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportCsv}>
                      <FileText className="mr-2 h-4 w-4" />
                      Export 2D Coordinates (CSV)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportJson}>
                      <FileJson className="mr-2 h-4 w-4" />
                      Export Full Data (JSON)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
        {isSampled && reducedData && (
          <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-md">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span>
              Displaying {MAX_POINTS} of {embeddings.length} documents (sampled for performance)
            </span>
          </div>
        )}
        {isReducing ? (
          <div className="flex h-96 items-center justify-center">
            <div className="text-center space-y-4 w-64">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Computing PCA...</p>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground">{progress}%</p>
              </div>
            </div>
          </div>
        ) : reducedData ? (
          <div
            ref={plotRef}
            className="bg-white rounded-md p-2"
            style={{ cursor: zoomDomain ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
          {zoomDomain && (
            <div className="flex items-center gap-1 mb-2 text-xs text-muted-foreground">
              <Move className="h-3 w-3" />
              <span>Drag to pan</span>
            </div>
          )}
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
                domain={zoomDomain ? zoomDomain.x : dataBounds.x}
                tick={{ fontSize: 12 }}
                allowDataOverflow
              />
              <YAxis
                type="number"
                dataKey="y"
                name="PC2"
                domain={zoomDomain ? zoomDomain.y : dataBounds.y}
                tick={{ fontSize: 12 }}
                allowDataOverflow
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
          </div>
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
