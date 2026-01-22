import React from 'react';
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
import { Move } from 'lucide-react';
import { EmbeddingTooltip } from './EmbeddingTooltip';
import type { PlotPoint } from './types';

interface EmbeddingScatterChartProps {
  data: PlotPoint[];
  selectedId?: string;
  zoomDomain: { x: [number, number]; y: [number, number] } | null;
  dataBounds: { x: [number, number]; y: [number, number] };
  isPanning: boolean;
  plotRef: React.RefObject<HTMLDivElement>;
  onPointClick?: (id: string) => void;
  onHover: (id: string | null) => void;
  onPanStart: (e: React.MouseEvent) => void;
  onPanMove: (e: React.MouseEvent) => void;
  onPanEnd: () => void;
  getPointColor: (point: PlotPoint) => string;
  getPointRadius: (point: PlotPoint) => number;
}

export function EmbeddingScatterChart({
  data,
  selectedId,
  zoomDomain,
  dataBounds,
  isPanning,
  plotRef,
  onPointClick,
  onHover,
  onPanStart,
  onPanMove,
  onPanEnd,
  getPointColor,
  getPointRadius,
}: EmbeddingScatterChartProps) {
  return (
    <div
      ref={plotRef}
      className="bg-white rounded-md p-2"
      style={{ cursor: zoomDomain ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
      onMouseDown={onPanStart}
      onMouseMove={onPanMove}
      onMouseUp={onPanEnd}
      onMouseLeave={onPanEnd}
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
          <Tooltip content={<EmbeddingTooltip selectedId={selectedId} />} />
          <Scatter
            data={data}
            onMouseEnter={(point: PlotPoint) => onHover(point.id)}
            onMouseLeave={() => onHover(null)}
            style={{ cursor: 'pointer' }}
          >
            {data.map((point) => (
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
  );
}
