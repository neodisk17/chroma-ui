import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useQueryStore } from '@/stores/query-store';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export function SimilaritySearch() {
  const { queryText, nResults, setQueryText, setNResults } = useQueryStore();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customEmbedding, setCustomEmbedding] = useState('');

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Similarity Search</CardTitle>
          <CardDescription>
            Find documents similar to your query text using semantic search
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Query Text */}
          <div className="space-y-2">
            <Label htmlFor="query-text">Query Text</Label>
            <Textarea
              id="query-text"
              placeholder="Enter text to find similar documents..."
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              rows={4}
              className="resize-none font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {queryText.length} characters
            </p>
          </div>

          {/* Number of Results */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="n-results">Number of Results</Label>
              <Input
                id="n-results"
                type="number"
                min={1}
                max={100}
                value={nResults}
                onChange={handleNResultsInputChange}
                className="w-20 text-center"
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
              Retrieve the top {nResults} most similar documents
            </p>
          </div>

          {/* Advanced Options */}
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full justify-between"
            >
              <span>Advanced Options</span>
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {showAdvanced && (
              <div className="mt-4 space-y-4 rounded-md border p-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-embedding">
                    Custom Embedding Vector (Optional)
                  </Label>
                  <Textarea
                    id="custom-embedding"
                    placeholder='Enter embedding as JSON array, e.g., [0.1, 0.2, 0.3, ...]'
                    value={customEmbedding}
                    onChange={(e) => setCustomEmbedding(e.target.value)}
                    rows={3}
                    className="resize-none font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    If provided, this embedding will be used instead of generating one from the query text
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Preview Section */}
          <div className="rounded-md bg-muted p-4 space-y-2">
            <h4 className="text-sm font-medium">Query Preview</h4>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>
                <span className="font-medium">Query Text:</span>{' '}
                {queryText ? `"${queryText.substring(0, 50)}${queryText.length > 50 ? '...' : ''}"` : 'Not set'}
              </p>
              <p>
                <span className="font-medium">Results:</span> Top {nResults} documents
              </p>
              {customEmbedding && (
                <p>
                  <span className="font-medium">Custom Embedding:</span> {customEmbedding.length} characters
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
