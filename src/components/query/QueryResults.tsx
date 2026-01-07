import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQueryStore } from '@/stores/query-store';
import { useDocument } from '@/hooks/use-chromadb';
import { FileDown, Search, Eye } from 'lucide-react';
import { useState } from 'react';
import { DocumentDetail } from '../documents/DocumentDetail';

interface QueryResultsProps {
  collectionName?: string;
}

export function QueryResults({ collectionName }: QueryResultsProps) {
  const { results, isExecuting, error } = useQueryStore();
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const exportToJSON = () => {
    if (!results) return;

    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `query-results-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    if (!results) return;

    // CSV headers
    const headers = ['ID', 'Document', 'Metadata', 'Distance'];
    const rows = results.map((result) => [
      result.id,
      result.document ? `"${result.document.replace(/"/g, '""')}"` : '',
      result.metadata ? `"${JSON.stringify(result.metadata).replace(/"/g, '""')}"` : '',
      result.distance?.toString() || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const dataBlob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `query-results-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatDistance = (distance?: number): string => {
    if (distance === undefined) return 'N/A';
    // Convert distance to similarity percentage (assuming distance is between 0-2)
    const similarity = Math.max(0, (1 - distance / 2) * 100);
    return `${similarity.toFixed(1)}%`;
  };

  // Loading state
  if (isExecuting) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Executing query...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="rounded-full bg-destructive/10 p-3">
              <Search className="h-6 w-6 text-destructive" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-destructive">Query Failed</h3>
              <p className="text-sm text-muted-foreground max-w-md">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No results yet
  if (!results) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="rounded-full bg-muted p-3">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-semibold">No Results Yet</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Configure your query in the other tabs and click "Execute Query" to see results here.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No results found
  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="rounded-full bg-muted p-3">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-semibold">No Results Found</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                No documents match your query. Try adjusting your filters or search criteria.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Results found
  return (
    <div className="space-y-4">
      {/* Results Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Query Results</CardTitle>
              <CardDescription>
                Found {results.length} {results.length === 1 ? 'document' : 'documents'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={exportToJSON} variant="outline" size="sm">
                <FileDown className="mr-2 h-4 w-4" />
                Export JSON
              </Button>
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <FileDown className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Results Table */}
      <div className="space-y-2">
        {results.map((result, index) => (
          <Card key={result.id} className="hover:bg-muted/50 transition-colors">
            <CardContent className="pt-6">
              <div className="space-y-3">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {result.id}
                      </Badge>
                      {result.distance !== undefined && (
                        <Badge variant="secondary" className="text-xs">
                          Similarity: {formatDistance(result.distance)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDocId(result.id)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                </div>

                {/* Document Text */}
                {result.document && (
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">Document</Label>
                    <p className="text-sm line-clamp-3">
                      {result.document.substring(0, 300)}
                      {result.document.length > 300 && '...'}
                    </p>
                  </div>
                )}

                {/* Metadata */}
                {result.metadata && Object.keys(result.metadata).length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">Metadata</Label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(result.metadata).slice(0, 5).map(([key, value]) => (
                        <Badge key={key} variant="outline" className="text-xs">
                          <span className="font-medium">{key}:</span>{' '}
                          <span className="ml-1">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </Badge>
                      ))}
                      {Object.keys(result.metadata).length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{Object.keys(result.metadata).length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Document Detail Panel */}
      {selectedDocId && collectionName && <DocumentDetailPanel collectionName={collectionName} documentId={selectedDocId} onClose={() => setSelectedDocId(null)} />}
    </div>
  );
}

function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={`text-sm font-medium ${className}`}>{children}</span>;
}

function DocumentDetailPanel({
  collectionName,
  documentId,
  onClose,
}: {
  collectionName: string;
  documentId: string;
  onClose: () => void;
}) {
  const { data: document, isLoading } = useDocument(collectionName, documentId);

  return <DocumentDetail document={document || null} isLoading={isLoading} onClose={onClose} />;
}
