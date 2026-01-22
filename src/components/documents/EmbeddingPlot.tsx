import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toPng } from 'html-to-image';
import { reduceTo2D, euclideanDistance, cosineSimilarity } from '@/lib/pca';
import PcaWorker from '@/workers/pca.worker?worker';

import {
  PlotControls,
  ColorLegend,
  SampledWarning,
  LoadingState,
  EmbeddingScatterChart,
  MAX_POINTS,
} from './embedding-plot';
import type { EmbeddingData, EmbeddingPlotProps, PlotPoint } from './embedding-plot';

// Re-export types for external use
export type { EmbeddingData, EmbeddingPlotProps };

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
  const needsReduction = embeddings.length > 0 && embeddings[0] != null && embeddings[0].vector.length > 2;

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

  // Create plot data from reduced points
  const createPlotData = useCallback((points2D: { x: number; y: number }[]): PlotPoint[] => {
    return sampledEmbeddings.map((embedding, index) => {
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
  }, [sampledEmbeddings, selectedEmbedding]);

  // Fallback to main thread computation
  const fallbackReduce = useCallback(() => {
    try {
      const vectors = sampledEmbeddings.map(e => e.vector);
      const points2D = reduceTo2D(vectors);
      setReducedData(createPlotData(points2D));
    } catch (error) {
      console.error('Failed to reduce embeddings:', error);
    } finally {
      setIsReducing(false);
    }
  }, [sampledEmbeddings, createPlotData]);

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
        setReducedData(createPlotData(result));
        setIsReducing(false);
        setProgress(100);
      } else if (type === 'error') {
        console.error('Worker error:', error);
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
  }, [embeddings.length, sampledEmbeddings, createPlotData, fallbackReduce]);

  // Automatically reduce if embeddings are already 2D
  useMemo(() => {
    if (!needsReduction && sampledEmbeddings.length > 0) {
      setIsSampled(embeddings.length > MAX_POINTS);
      const vectors = sampledEmbeddings.map(e => e.vector);
      const points2D = reduceTo2D(vectors);
      setReducedData(createPlotData(points2D));
    }
  }, [embeddings.length, sampledEmbeddings, needsReduction, createPlotData]);

  // Export handlers
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
    if (point.id === selectedId) return '#ef4444'; // red - selected
    if (point.id === hoveredId) return '#f97316'; // orange - hovered

    if (selectedId && point.distance !== undefined) {
      if (point.distance < 0.2) return '#22c55e'; // green - very similar
      if (point.distance < 0.5) return '#eab308'; // yellow - similar
      return '#3b82f6'; // blue - different
    }

    return '#3b82f6'; // blue - default
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

    const xPadding = (xMax - xMin) * 0.1 || 0.1;
    const yPadding = (yMax - yMin) * 0.1 || 0.1;

    return {
      x: [xMin - xPadding, xMax + xPadding] as [number, number],
      y: [yMin - yPadding, yMax + yPadding] as [number, number],
    };
  }, [reducedData]);

  // Zoom handlers
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

  // Pan handlers
  const handlePanStart = useCallback((e: React.MouseEvent) => {
    if (!zoomDomainRef.current) return;
    e.preventDefault();
    setIsPanning(true);
    panStartRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePanMove = useCallback((e: React.MouseEvent) => {
    if (!panStartRef.current || !zoomDomainRef.current || !plotRef.current) return;

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

    const clientX = e.clientX;
    const clientY = e.clientY;

    rafIdRef.current = requestAnimationFrame(() => {
      if (!panStartRef.current || !zoomDomainRef.current || !plotRef.current) return;

      const plotRect = plotRef.current.getBoundingClientRect();
      const plotWidth = plotRect.width - 40;
      const plotHeight = 500 - 40;

      const dx = clientX - panStartRef.current.x;
      const dy = clientY - panStartRef.current.y;

      const currentDomain = zoomDomainRef.current;
      const xRange = currentDomain.x[1] - currentDomain.x[0];
      const yRange = currentDomain.y[1] - currentDomain.y[0];

      const xDelta = -(dx / plotWidth) * xRange;
      const yDelta = (dy / plotHeight) * yRange;

      const newDomain = {
        x: [currentDomain.x[0] + xDelta, currentDomain.x[1] + xDelta] as [number, number],
        y: [currentDomain.y[0] + yDelta, currentDomain.y[1] + yDelta] as [number, number],
      };

      zoomDomainRef.current = newDomain;
      setZoomDomain(newDomain);
      panStartRef.current = { x: clientX, y: clientY };
    });
  }, []);

  const handlePanEnd = useCallback(() => {
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

          <PlotControls
            needsReduction={needsReduction}
            hasReducedData={!!reducedData}
            isReducing={isReducing}
            isExporting={isExporting}
            onReduce={handleReduce}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetView={handleResetView}
            onExportPng={handleExportPng}
            onExportCsv={handleExportCsv}
            onExportJson={handleExportJson}
          />
        </div>
        {selectedId && reducedData && <ColorLegend />}
      </CardHeader>
      <CardContent>
        {isSampled && reducedData && <SampledWarning totalCount={embeddings.length} />}

        {isReducing ? (
          <LoadingState progress={progress} />
        ) : reducedData ? (
          <EmbeddingScatterChart
            data={reducedData}
            selectedId={selectedId}
            zoomDomain={zoomDomain}
            dataBounds={dataBounds}
            isPanning={isPanning}
            plotRef={plotRef}
            onPointClick={onPointClick}
            onHover={setHoveredId}
            onPanStart={handlePanStart}
            onPanMove={handlePanMove}
            onPanEnd={handlePanEnd}
            getPointColor={getPointColor}
            getPointRadius={getPointRadius}
          />
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
