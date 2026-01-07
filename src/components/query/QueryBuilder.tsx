import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlayCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useQueryStore } from '@/stores/query-store';
import { SimilaritySearch } from './SimilaritySearch';
import { FilterBuilder } from './FilterBuilder';
import { DocumentFilterBuilder } from './DocumentFilterBuilder';
import { QueryResults } from './QueryResults';
import { QueryTemplates } from './QueryTemplates';
import { useExecuteQuery } from '@/hooks/use-chromadb';

interface QueryBuilderProps {
  collectionName?: string;
}

export function QueryBuilder({ collectionName }: QueryBuilderProps) {
  const {
    queryText,
    metadataFilters,
    documentFilters,
    nResults,
    isExecuting,
    error,
    clearQuery,
  } = useQueryStore();

  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const executeQuery = useExecuteQuery();

  // Generate query preview JSON
  const generateQueryPreview = () => {
    const query: any = {
      nResults,
    };

    if (queryText) {
      query.queryText = queryText;
    }

    if (metadataFilters.length > 0) {
      const where: any = {};
      metadataFilters.forEach((filter) => {
        if (filter.field && filter.value) {
          where[filter.field] = { [filter.operator]: filter.value };
        }
      });
      if (Object.keys(where).length > 0) {
        query.where = where;
      }
    }

    if (documentFilters.length > 0) {
      const whereDocument: any = {};
      documentFilters.forEach((filter, index) => {
        if (filter.value) {
          whereDocument[`condition_${index}`] = { [filter.operator]: filter.value };
        }
      });
      if (Object.keys(whereDocument).length > 0) {
        query.whereDocument = whereDocument;
      }
    }

    return query;
  };

  const handleExecute = async () => {
    if (!collectionName) {
      return;
    }

    // Determine query type
    let queryType: 'similarity' | 'filter' | 'combined' = 'similarity';
    if (queryText && (metadataFilters.length > 0 || documentFilters.length > 0)) {
      queryType = 'combined';
    } else if (!queryText && (metadataFilters.length > 0 || documentFilters.length > 0)) {
      queryType = 'filter';
    }

    await executeQuery.mutateAsync({
      collectionName,
      queryType,
      queryText: queryText || undefined,
      nResults,
      metadataFilters: metadataFilters.length > 0 ? metadataFilters : undefined,
      documentFilters: documentFilters.length > 0 ? documentFilters : undefined,
    });
  };

  const isQueryEmpty = !queryText && metadataFilters.length === 0 && documentFilters.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">Query Builder</h2>
            {collectionName && (
              <Badge variant="outline" className="font-mono text-xs">
                {collectionName}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <QueryTemplates />
            <Button
              variant="outline"
              size="sm"
              onClick={clearQuery}
              disabled={isExecuting || isQueryEmpty}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Clear Query
            </Button>
            <Button
              size="sm"
              onClick={handleExecute}
              disabled={isExecuting || !collectionName || isQueryEmpty}
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              {isExecuting ? 'Executing...' : 'Execute Query'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="similarity" className="h-full flex flex-col">
          <div className="border-b px-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="similarity">Similarity Search</TabsTrigger>
              <TabsTrigger value="metadata">Metadata Filters</TabsTrigger>
              <TabsTrigger value="document">Document Filters</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4">
                <TabsContent value="similarity" className="mt-0">
                  <SimilaritySearch />
                </TabsContent>

                <TabsContent value="metadata" className="mt-0">
                  <FilterBuilder />
                </TabsContent>

                <TabsContent value="document" className="mt-0">
                  <DocumentFilterBuilder />
                </TabsContent>

                <TabsContent value="results" className="mt-0">
                  <QueryResults collectionName={collectionName} />
                </TabsContent>
              </div>
            </ScrollArea>
          </div>
        </Tabs>
      </div>

      {/* Footer - Query JSON Preview */}
      <div className="border-t bg-muted/30">
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowJsonPreview(!showJsonPreview)}
            className="w-full justify-between"
          >
            <span className="text-xs font-medium">Query Preview (JSON)</span>
            {showJsonPreview ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>
        {showJsonPreview && (
          <div className="px-4 pb-4">
            <pre className="rounded-md bg-slate-950 p-4 text-xs text-slate-50 overflow-x-auto">
              {JSON.stringify(generateQueryPreview(), null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="border-t bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}
