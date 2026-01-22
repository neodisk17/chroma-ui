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
import { PlotPoint, CATEGORY_COLORS, CATEGORY_LABELS } from './types';
import { NeighborhoodTooltip } from './NeighborhoodTooltip';

interface NeighborhoodPlotProps {
  plotData: PlotPoint[];
  doc1Point?: PlotPoint;
  doc2Point?: PlotPoint;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  scatterKey: string;
}

export function NeighborhoodPlot({
  plotData,
  doc1Point,
  doc2Point,
  hoveredId,
  onHover,
  scatterKey,
}: NeighborhoodPlotProps) {
  return (
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
          <Tooltip content={<NeighborhoodTooltip />} />
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
            key={scatterKey}
            data={plotData}
            onMouseEnter={(data: PlotPoint) => onHover(data.id)}
            onMouseLeave={() => onHover(null)}
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
  );
}
