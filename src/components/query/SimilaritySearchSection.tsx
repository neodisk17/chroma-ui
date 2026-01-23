import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useQueryStore } from '@/stores/query-store';

export function SimilaritySearchSection() {
  const { queryText, nResults, setQueryText, setNResults } = useQueryStore();

  const handleNResultsChange = (value: number[]) => {
    if (value[0] !== undefined) {
      setNResults(value[0]);
    }
  };

  const handleNResultsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= 100) {
      setNResults(value);
    }
  };

  return (
    <div className="space-y-4 px-4">
      {/* Query Text */}
      <div className="space-y-2">
        <Label htmlFor="query-text" className="text-sm">Query Text</Label>
        <Textarea
          id="query-text"
          placeholder="Enter text to find similar documents..."
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          rows={3}
          className="resize-none font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          {queryText.length} characters
        </p>
      </div>

      {/* Number of Results */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="n-results" className="text-sm">Number of Results</Label>
          <Input
            id="n-results"
            type="number"
            min={1}
            max={100}
            value={nResults}
            onChange={handleNResultsInputChange}
            className="w-16 h-8 text-center text-sm"
          />
        </div>
        <Slider
          value={[nResults]}
          onValueChange={handleNResultsChange}
          min={1}
          max={100}
          step={1}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Top {nResults} most similar documents
        </p>
      </div>
    </div>
  );
}
