import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { PlayCircle, XCircle, ChevronDown, ChevronUp, Search, Filter, FileText } from 'lucide-react';
import { useQueryStore } from '@/stores/query-store';
import { SimilaritySearchSection } from './SimilaritySearchSection';
import { MetadataFilterSection } from './MetadataFilterSection';
import { DocumentFilterSection } from './DocumentFilterSection';
import { QueryResults } from './QueryResults';
import { QueryTemplates } from './QueryTemplates';
import { useExecuteQuery } from '@/hooks/use-chromadb';
import type { ChromaDBQueryObject, ChromaDBWhereClause, ChromaDBWhereDocument } from '@/types/chromadb.types';
import { ExternalCollectionConfigDialog } from '../embeddings/ExternalCollectionConfigDialog';
import { useAvailableModels } from '../../hooks/use-embedding';
import type { EmbeddingConfig } from '../../../shared/schemas';

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
    setError,
  } = useQueryStore();

  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [similarityOpen, setSimilarityOpen] = useState(true);
  const [metadataOpen, setMetadataOpen] = useState(true);
  const [documentOpen, setDocumentOpen] = useState(true);
  const [externalConfigPrompt, setExternalConfigPrompt] = useState<{
    collectionName: string;
    detectedDimensions: number | null;
  } | null>(null);
  const [configRetryAttempted, setConfigRetryAttempted] = useState(false);
  const executeQuery = useExecuteQuery();
  const { data: availableModels = [] } = useAvailableModels();

  // Count active filters
  const activeMetadataFilters = metadataFilters.filter(f => f.field && f.value).length;
  const activeDocumentFilters = documentFilters.filter(f => f.value).length;
  const hasSimilarityQuery = !!queryText.trim();

  // Generate query preview JSON
  const generateQueryPreview = (): ChromaDBQueryObject => {
    const query: ChromaDBQueryObject = {
      nResults,
    };

    if (queryText) {
      query.queryText = queryText;
    }

    if (metadataFilters.length > 0) {
      const where: ChromaDBWhereClause = {};
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
      const whereDocument: ChromaDBWhereDocument = {};
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

    try {
      await executeQuery.mutateAsync({
        collectionName,
        queryType,
        queryText: queryText || undefined,
        nResults,
        metadataFilters: metadataFilters.length > 0 ? metadataFilters : undefined,
        documentFilters: documentFilters.length > 0 ? documentFilters : undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (
        !configRetryAttempted &&
        (message.includes('does not have an embedding configuration') ||
          message.includes('no embedding config'))
      ) {
        setConfigRetryAttempted(true);
        setExternalConfigPrompt({
          collectionName,
          detectedDimensions: null,
        });
        // Clear the error that onError already wrote to the store so the toast
        // and the inline error banner don't appear alongside the config dialog.
        setError(null);
        // Don't re-throw — the dialog handles recovery
        return;
      }
      // Other errors are handled by useExecuteQuery's onError (store + toast)
    }
  };

  const isQueryEmpty = !queryText && metadataFilters.length === 0 && documentFilters.length === 0;
  const totalActiveFilters = (hasSimilarityQuery ? 1 : 0) + activeMetadataFilters + activeDocumentFilters;

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
            {totalActiveFilters > 0 && (
              <Badge variant="secondary" className="text-xs">
                {totalActiveFilters} active {totalActiveFilters === 1 ? 'filter' : 'filters'}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <QueryTemplates />
          </div>
        </div>
      </div>

      {/* Main Content - Side by Side Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Filters */}
        <div className="w-[380px] border-r flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {/* Similarity Search Section */}
              <Collapsible open={similarityOpen} onOpenChange={setSimilarityOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between h-auto py-3 px-4 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      <span className="font-medium">Similarity Search</span>
                      {hasSimilarityQuery && (
                        <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">
                          1
                        </Badge>
                      )}
                    </div>
                    {similarityOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pt-2 pb-4">
                    <SimilaritySearchSection />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Metadata Filters Section */}
              <Collapsible open={metadataOpen} onOpenChange={setMetadataOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between h-auto py-3 px-4 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <span className="font-medium">Metadata Filters</span>
                      {activeMetadataFilters > 0 && (
                        <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">
                          {activeMetadataFilters}
                        </Badge>
                      )}
                    </div>
                    {metadataOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pt-2 pb-4">
                    <MetadataFilterSection collectionName={collectionName} />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Document Filters Section */}
              <Collapsible open={documentOpen} onOpenChange={setDocumentOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between h-auto py-3 px-4 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="font-medium">Document Filters</span>
                      {activeDocumentFilters > 0 && (
                        <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">
                          {activeDocumentFilters}
                        </Badge>
                      )}
                    </div>
                    {documentOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pt-2 pb-4">
                    <DocumentFilterSection />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Query JSON Preview */}
              <Collapsible open={showJsonPreview} onOpenChange={setShowJsonPreview}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between text-muted-foreground"
                  >
                    <span className="text-xs">Query Preview (JSON)</span>
                    {showJsonPreview ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <pre className="rounded-md bg-slate-950 p-4 text-xs text-slate-50 overflow-x-auto mt-2">
                    {JSON.stringify(generateQueryPreview(), null, 2)}
                  </pre>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </ScrollArea>

          {/* Unified Action Bar */}
          <div className="border-t bg-background p-4 space-y-2">
            <Button
              className="w-full"
              onClick={handleExecute}
              disabled={isExecuting || !collectionName || isQueryEmpty}
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              {isExecuting ? 'Executing...' : 'Execute Query'}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={clearQuery}
              disabled={isExecuting || isQueryEmpty}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Clear All Filters
            </Button>
          </div>
        </div>

        {/* Right Panel - Results */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="p-4">
              <QueryResults collectionName={collectionName} />
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="border-t bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {externalConfigPrompt && (
        <ExternalCollectionConfigDialog
          open={!!externalConfigPrompt}
          collectionName={externalConfigPrompt.collectionName}
          detectedDimensions={externalConfigPrompt.detectedDimensions}
          availableModels={availableModels}
          onSaved={(_config: EmbeddingConfig) => {
            setExternalConfigPrompt(null);
            // Retry the query — config is now saved to collection metadata
            handleExecute();
          }}
          onCancel={() => {
            setExternalConfigPrompt(null);
            setConfigRetryAttempted(false);
          }}
        />
      )}
    </div>
  );
}
