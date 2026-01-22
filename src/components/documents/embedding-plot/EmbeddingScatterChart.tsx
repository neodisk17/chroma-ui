import React, { useCallback, useState } from 'react';
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
// Context menu UI - using custom implementation instead of radix
import { Circle, CircleDot, Eye, Users } from 'lucide-react';
import { EmbeddingTooltip } from './EmbeddingTooltip';
import type { PlotPoint } from './types';

interface EmbeddingScatterChartProps {
  data: PlotPoint[];
  selectedIds?: string[];
  zoomDomain: { x: [number, number]; y: [number, number] } | null;
  dataBounds: { x: [number, number]; y: [number, number] };
  isPanning: boolean;
  plotRef: React.RefObject<HTMLDivElement>;
  onPointClick?: (id: string) => void;
  onPointContextMenu?: (id: string, event: React.MouseEvent) => void;
  onHover: (id: string | null) => void;
  onPanStart: (e: React.MouseEvent) => void;
  onPanMove: (e: React.MouseEvent) => void;
  onPanEnd: () => void;
  getPointColor: (point: PlotPoint) => string;
  getPointRadius: (point: PlotPoint) => number;
  getPointStroke?: (point: PlotPoint) => { stroke: string; strokeWidth: number };
}

export function EmbeddingScatterChart({
  data,
  selectedIds = [],
  zoomDomain,
  dataBounds,
  isPanning,
  plotRef,
  onPointClick,
  onPointContextMenu,
  onHover,
  onPanStart,
  onPanMove,
  onPanEnd,
  getPointColor,
  getPointRadius,
  getPointStroke,
}: EmbeddingScatterChartProps) {
  const [contextMenuPoint, setContextMenuPoint] = useState<PlotPoint | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent, point: PlotPoint) => {
    e.preventDefault();
    setContextMenuPoint(point);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    onPointContextMenu?.(point.id, e);
  }, [onPointContextMenu]);

  const closeContextMenu = useCallback(() => {
    setContextMenuPoint(null);
    setContextMenuPosition(null);
  }, []);

  const handleViewDetails = useCallback(() => {
    if (contextMenuPoint) {
      // Select only this point (clear others)
      onPointClick?.(contextMenuPoint.id);
    }
    closeContextMenu();
  }, [contextMenuPoint, onPointClick, closeContextMenu]);

  const handleSetAsDoc1 = useCallback(() => {
    if (contextMenuPoint && onPointClick) {
      // This will be handled by the parent's multi-select logic
      // For now, we just trigger the click which the parent handles
      onPointClick(contextMenuPoint.id);
    }
    closeContextMenu();
  }, [contextMenuPoint, onPointClick, closeContextMenu]);

  const handleSetAsDoc2 = useCallback(() => {
    if (contextMenuPoint && onPointClick) {
      // First click the point - parent will handle multi-selection
      onPointClick(contextMenuPoint.id);
    }
    closeContextMenu();
  }, [contextMenuPoint, onPointClick, closeContextMenu]);

  const handleFindNeighbors = useCallback(() => {
    if (contextMenuPoint && onPointClick) {
      // Select this point to show its neighbors (similarity-based coloring)
      onPointClick(contextMenuPoint.id);
    }
    closeContextMenu();
  }, [contextMenuPoint, onPointClick, closeContextMenu]);

  const isDoc1 = contextMenuPoint ? selectedIds[0] === contextMenuPoint.id : false;
  const isDoc2 = contextMenuPoint ? selectedIds[1] === contextMenuPoint.id : false;

  return (
    <>
      <div
        ref={plotRef}
        className="bg-white rounded-md p-2"
        style={{ cursor: zoomDomain ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
        onMouseDown={onPanStart}
        onMouseMove={onPanMove}
        onMouseUp={onPanEnd}
        onMouseLeave={onPanEnd}
        onContextMenu={() => {
          // Prevent default browser context menu when not on a point
          // Points will handle their own context menu
        }}
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
            <Tooltip content={<EmbeddingTooltip selectedId={selectedIds?.[0]} />} />
            <Scatter
              data={data}
              onMouseEnter={(point: PlotPoint) => onHover(point.id)}
              onMouseLeave={() => onHover(null)}
              style={{ cursor: 'pointer' }}
            >
              {data.map((point) => {
                const strokeProps = getPointStroke?.(point) || { stroke: 'none', strokeWidth: 0 };
                return (
                  <Cell
                    key={point.id}
                    fill={getPointColor(point)}
                    r={getPointRadius(point)}
                    stroke={strokeProps.stroke}
                    strokeWidth={strokeProps.strokeWidth}
                    onContextMenu={(e: React.MouseEvent) => handleContextMenu(e, point)}
                  />
                );
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Context Menu */}
      {contextMenuPoint && contextMenuPosition && (
        <div
          className="fixed z-50"
          style={{ left: contextMenuPosition.x, top: contextMenuPosition.y }}
        >
          <div
            className="min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground truncate max-w-[200px]">
              {contextMenuPoint.id}
            </div>
            <div className="-mx-1 my-1 h-px bg-border" />
            <button
              className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground gap-2"
              onClick={handleViewDetails}
            >
              <Eye className="h-4 w-4" />
              View Details
            </button>
            <div className="-mx-1 my-1 h-px bg-border" />
            <button
              className={`relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground gap-2 ${isDoc1 ? 'opacity-50' : ''}`}
              onClick={handleSetAsDoc1}
              disabled={isDoc1}
            >
              <Circle className="h-4 w-4 text-blue-500" />
              Set as Document 1
              {isDoc1 && <span className="ml-auto text-xs text-muted-foreground">(current)</span>}
            </button>
            <button
              className={`relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground gap-2 ${isDoc2 ? 'opacity-50' : ''}`}
              onClick={handleSetAsDoc2}
              disabled={isDoc2}
            >
              <CircleDot className="h-4 w-4 text-green-500" />
              Set as Document 2
              {isDoc2 && <span className="ml-auto text-xs text-muted-foreground">(current)</span>}
            </button>
            <div className="-mx-1 my-1 h-px bg-border" />
            <button
              className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground gap-2"
              onClick={handleFindNeighbors}
            >
              <Users className="h-4 w-4" />
              Find Nearest Neighbors
            </button>
          </div>
          {/* Click outside to close */}
          <div
            className="fixed inset-0 -z-10"
            onClick={closeContextMenu}
            onContextMenu={(e) => {
              e.preventDefault();
              closeContextMenu();
            }}
          />
        </div>
      )}
    </>
  );
}
