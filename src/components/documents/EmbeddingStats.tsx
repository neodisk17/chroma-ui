import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { vectorMagnitude } from '@/lib/pca';

export interface EmbeddingData {
  id: string;
  vector: number[];
  document: string;
}

interface EmbeddingStatsProps {
  embeddings: EmbeddingData[];
}

interface DimensionStats {
  dimension: number;
  min: number;
  max: number;
  mean: number;
  stdDev: number;
  variance: number;
}

interface MagnitudeHistogramBin {
  range: string;
  count: number;
  minVal: number;
  maxVal: number;
}

/**
 * EmbeddingStats component - Display statistics about embeddings
 *
 * Features:
 * - Dimension count
 * - Min/max values per dimension
 * - Mean and standard deviation
 * - Vector magnitude distribution (histogram)
 * - Dimension variance heatmap
 */
export function EmbeddingStats({ embeddings }: EmbeddingStatsProps) {
  // Compute all statistics
  const stats = useMemo(() => {
    if (embeddings.length === 0 || !embeddings[0]?.vector) {
      return null;
    }

    const dimensions = embeddings[0].vector.length;
    const n = embeddings.length;

    // Compute dimension-wise statistics
    const dimensionStats: DimensionStats[] = [];
    for (let d = 0; d < dimensions; d++) {
      const values = embeddings.map(e => e.vector[d] || 0);

      const min = Math.min(...values);
      const max = Math.max(...values);
      const mean = values.reduce((a, b) => a + b, 0) / n;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
      const stdDev = Math.sqrt(variance);

      dimensionStats.push({
        dimension: d,
        min,
        max,
        mean,
        stdDev,
        variance,
      });
    }

    // Compute magnitudes
    const magnitudes = embeddings.map(e => vectorMagnitude(e.vector));
    const minMagnitude = Math.min(...magnitudes);
    const maxMagnitude = Math.max(...magnitudes);
    const meanMagnitude = magnitudes.reduce((a, b) => a + b, 0) / n;

    // Create magnitude histogram (10 bins)
    const numBins = 10;
    const binWidth = (maxMagnitude - minMagnitude) / numBins || 1;
    const magnitudeHistogram: MagnitudeHistogramBin[] = [];

    for (let i = 0; i < numBins; i++) {
      const minVal = minMagnitude + i * binWidth;
      const maxVal = minMagnitude + (i + 1) * binWidth;
      const count = magnitudes.filter(m => m >= minVal && (i === numBins - 1 ? m <= maxVal : m < maxVal)).length;
      magnitudeHistogram.push({
        range: `${minVal.toFixed(2)}-${maxVal.toFixed(2)}`,
        count,
        minVal,
        maxVal,
      });
    }

    // Find top 10 dimensions with highest variance
    const topVarianceDimensions = [...dimensionStats]
      .sort((a, b) => b.variance - a.variance)
      .slice(0, 10);

    // Global statistics
    const allValues = embeddings.flatMap(e => e.vector);
    const globalMin = Math.min(...allValues);
    const globalMax = Math.max(...allValues);
    const globalMean = allValues.reduce((a, b) => a + b, 0) / allValues.length;
    const globalVariance = allValues.reduce((sum, val) => sum + Math.pow(val - globalMean, 2), 0) / allValues.length;
    const globalStdDev = Math.sqrt(globalVariance);

    return {
      documentCount: n,
      dimensions,
      dimensionStats,
      magnitudes,
      minMagnitude,
      maxMagnitude,
      meanMagnitude,
      magnitudeHistogram,
      topVarianceDimensions,
      globalMin,
      globalMax,
      globalMean,
      globalStdDev,
    };
  }, [embeddings]);

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Embedding Statistics</CardTitle>
          <CardDescription>No embeddings to analyze</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Format variance for display
  const formatVariance = (variance: number) => {
    const maxVariance = Math.max(...stats.dimensionStats.map(d => d.variance));
    const normalized = variance / maxVariance;
    return {
      width: `${Math.max(5, normalized * 100)}%`,
      color: normalized > 0.8 ? 'bg-red-500' : normalized > 0.5 ? 'bg-yellow-500' : 'bg-green-500',
    };
  };

  return (
    <div className="space-y-4">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Documents</p>
              <p className="text-2xl font-bold">{stats.documentCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Dimensions</p>
              <p className="text-2xl font-bold">{stats.dimensions}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Value Range</p>
              <p className="text-sm font-mono">
                [{stats.globalMin.toFixed(3)}, {stats.globalMax.toFixed(3)}]
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Global Mean ± Std</p>
              <p className="text-sm font-mono">
                {stats.globalMean.toFixed(4)} ± {stats.globalStdDev.toFixed(4)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Magnitude Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vector Magnitude Distribution</CardTitle>
          <CardDescription>
            Range: {stats.minMagnitude.toFixed(4)} - {stats.maxMagnitude.toFixed(4)} |
            Mean: {stats.meanMagnitude.toFixed(4)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.magnitudeHistogram}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="range"
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => [value ?? 0, 'Count']}
                labelFormatter={(label) => `Magnitude: ${label}`}
              />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Variance Dimensions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Variance Dimensions</CardTitle>
          <CardDescription>
            Dimensions with the highest variance (most discriminative features)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {stats.topVarianceDimensions.map((dim) => {
                const { width, color } = formatVariance(dim.variance);
                return (
                  <div key={dim.dimension} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-mono">Dim {dim.dimension}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          var: {dim.variance.toFixed(6)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          μ: {dim.mean.toFixed(4)}
                        </Badge>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${color}`}
                        style={{ width }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>min: {dim.min.toFixed(4)}</span>
                      <span>max: {dim.max.toFixed(4)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Full Dimension Statistics Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Dimension Statistics</CardTitle>
          <CardDescription>
            Detailed statistics for all {stats.dimensions} dimensions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Dim</th>
                  <th className="text-right p-2 font-medium">Min</th>
                  <th className="text-right p-2 font-medium">Max</th>
                  <th className="text-right p-2 font-medium">Mean</th>
                  <th className="text-right p-2 font-medium">Std Dev</th>
                  <th className="text-right p-2 font-medium">Variance</th>
                </tr>
              </thead>
              <tbody>
                {stats.dimensionStats.map((dim) => (
                  <tr key={dim.dimension} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-mono">{dim.dimension}</td>
                    <td className="p-2 text-right font-mono">{dim.min.toFixed(6)}</td>
                    <td className="p-2 text-right font-mono">{dim.max.toFixed(6)}</td>
                    <td className="p-2 text-right font-mono">{dim.mean.toFixed(6)}</td>
                    <td className="p-2 text-right font-mono">{dim.stdDev.toFixed(6)}</td>
                    <td className="p-2 text-right font-mono">{dim.variance.toFixed(6)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
