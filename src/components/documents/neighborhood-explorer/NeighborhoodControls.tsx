import { Slider } from '@/components/ui/slider';

interface NeighborhoodControlsProps {
  neighborCount: number;
  onNeighborCountChange: (value: number) => void;
  minSharedSimilarity: number;
  onMinSharedSimilarityChange: (value: number) => void;
}

export function NeighborhoodControls({
  neighborCount,
  onNeighborCountChange,
  minSharedSimilarity,
  onMinSharedSimilarityChange,
}: NeighborhoodControlsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Neighbors per document: {neighborCount}
        </label>
        <Slider
          value={[neighborCount]}
          onValueChange={([val]) => onNeighborCountChange(val || 5)}
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
          onValueChange={([val]) => onMinSharedSimilarityChange(val || 0.5)}
          min={0.3}
          max={0.9}
          step={0.05}
          className="w-full"
        />
      </div>
    </div>
  );
}
