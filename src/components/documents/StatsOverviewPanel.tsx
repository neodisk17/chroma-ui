import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, BarChart2, Hash, Ruler, TrendingUp } from 'lucide-react';
import { vectorMagnitude } from '@/lib/pca';
import type { EmbeddingData } from './embedding-plot';

interface StatsOverviewPanelProps {
  embeddings: EmbeddingData[];
  onDimensionClick?: (dimension: number) => void;
}

interface DimensionStats {
  dimension: number;
  min: number;
  max: number;
  mean: number;
  stdDev: number;
  variance: number;
}

export function StatsOverviewPanel({ embeddings, onDimensionClick }: StatsOverviewPanelProps) {
  const [showAllDimensions, setShowAllDimensions] = useState(false);

  // Compute statistics
  const stats = useMemo(() => {
    if (embeddings.length === 0 || !embeddings[0]?.vector) {
      return null;
    }

    const dimensions = embeddings[0].vector.length;
    const n = embeddings.length;

    // Compute dimension-wise statistics
    const dimensionStats: DimensionStats[] = [];
    for (let d = 0; d < dimensions; d++) {
      let min = Infinity;
      let max = -Infinity;
      let sum = 0;
      for (let i = 0; i < n; i++) {
        const v = embeddings[i]!.vector[d] ?? 0;
        if (v < min) min = v;
        if (v > max) max = v;
        sum += v;
      }
      const mean = sum / n;
      let varianceSum = 0;
      for (let i = 0; i < n; i++) {
        const diff = (embeddings[i]!.vector[d] ?? 0) - mean;
        varianceSum += diff * diff;
      }
      const variance = varianceSum / n;
      dimensionStats.push({
        dimension: d,
        min,
        max,
        mean,
        stdDev: Math.sqrt(variance),
        variance,
      });
    }

    // Compute magnitudes without spread
    let minMagnitude = Infinity;
    let maxMagnitude = -Infinity;
    let magnitudeSum = 0;
    for (const e of embeddings) {
      const mag = vectorMagnitude(e.vector);
      if (mag < minMagnitude) minMagnitude = mag;
      if (mag > maxMagnitude) maxMagnitude = mag;
      magnitudeSum += mag;
    }
    const meanMagnitude = magnitudeSum / n;

    // Find top 10 dimensions with highest variance
    const topVarianceDimensions = [...dimensionStats]
      .sort((a, b) => b.variance - a.variance)
      .slice(0, 10);

    // Global statistics — iterate directly to avoid spreading millions of values
    let globalMin = Infinity;
    let globalMax = -Infinity;
    let globalSum = 0;
    let globalCount = 0;
    for (const e of embeddings) {
      for (const v of e.vector) {
        if (v < globalMin) globalMin = v;
        if (v > globalMax) globalMax = v;
        globalSum += v;
        globalCount++;
      }
    }
    const globalMean = globalCount > 0 ? globalSum / globalCount : 0;

    return {
      documentCount: n,
      dimensions,
      dimensionStats,
      minMagnitude,
      maxMagnitude,
      meanMagnitude,
      topVarianceDimensions,
      globalMin,
      globalMax,
      globalMean,
    };
  }, [embeddings]);

  if (!stats) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">No embeddings to analyze</p>
      </div>
    );
  }

  // Format variance for display
  const formatVariance = (variance: number) => {
    const maxVariance = Math.max(...stats.topVarianceDimensions.map(d => d.variance));
    const normalized = variance / maxVariance;
    return {
      width: `${Math.max(8, normalized * 100)}%`,
      color: normalized > 0.8 ? 'bg-red-500' : normalized > 0.5 ? 'bg-yellow-500' : 'bg-green-500',
    };
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 pb-3 border-b">
        <BarChart2 className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">Statistics Overview</h3>
      </div>

      <ScrollArea className="flex-1 mt-3">
        <div className="space-y-4 pr-2">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-2">
            <Card className="bg-muted/30">
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Documents</p>
                    <p className="text-lg font-bold">{stats.documentCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Dimensions</p>
                    <p className="text-lg font-bold">{stats.dimensions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Magnitude Stats */}
          <Card>
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-xs flex items-center gap-2">
                <TrendingUp className="h-3 w-3" />
                Vector Magnitude
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] text-muted-foreground">Min</p>
                  <p className="text-xs font-mono font-semibold">{stats.minMagnitude.toFixed(3)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Mean</p>
                  <p className="text-xs font-mono font-semibold">{stats.meanMagnitude.toFixed(3)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Max</p>
                  <p className="text-xs font-mono font-semibold">{stats.maxMagnitude.toFixed(3)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Value Range */}
          <Card>
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-xs">Value Range</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="flex justify-between items-center">
                <Badge variant="outline" className="text-xs font-mono">
                  min: {stats.globalMin.toFixed(4)}
                </Badge>
                <span className="text-xs text-muted-foreground">to</span>
                <Badge variant="outline" className="text-xs font-mono">
                  max: {stats.globalMax.toFixed(4)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Top Variance Dimensions */}
          <Card>
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-xs">Top 10 Variance Dimensions</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="space-y-2">
                {stats.topVarianceDimensions.map((dim) => {
                  const { width, color } = formatVariance(dim.variance);
                  return (
                    <div
                      key={dim.dimension}
                      className="space-y-1 cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors"
                      onClick={() => onDimensionClick?.(dim.dimension)}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-muted-foreground">Dim {dim.dimension}</span>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {dim.variance.toExponential(2)}
                        </Badge>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${color} transition-all`}
                          style={{ width }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Expandable All Dimensions */}
          <Collapsible open={showAllDimensions} onOpenChange={setShowAllDimensions}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-2 pt-3 px-3 cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardTitle className="text-xs flex items-center justify-between">
                    <span>All Dimension Statistics</span>
                    {showAllDimensions ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-3 pb-3">
                  <ScrollArea className="h-48">
                    <table className="w-full text-[10px]">
                      <thead className="sticky top-0 bg-background">
                        <tr className="border-b">
                          <th className="text-left p-1 font-medium">Dim</th>
                          <th className="text-right p-1 font-medium">Mean</th>
                          <th className="text-right p-1 font-medium">Std</th>
                          <th className="text-right p-1 font-medium">Var</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.dimensionStats.map((dim) => (
                          <tr
                            key={dim.dimension}
                            className="border-b hover:bg-muted/50 cursor-pointer"
                            onClick={() => onDimensionClick?.(dim.dimension)}
                          >
                            <td className="p-1 font-mono">{dim.dimension}</td>
                            <td className="p-1 text-right font-mono">{dim.mean.toFixed(4)}</td>
                            <td className="p-1 text-right font-mono">{dim.stdDev.toFixed(4)}</td>
                            <td className="p-1 text-right font-mono">{dim.variance.toExponential(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Tip */}
          <p className="text-[10px] text-muted-foreground text-center py-2">
            Click a point on the plot to view document details.
            <br />
            Click two points to compare them.
          </p>
        </div>
      </ScrollArea>
    </div>
  );
}
