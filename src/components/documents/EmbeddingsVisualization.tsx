import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScatterChart, Hash, Ruler, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmbeddingPlot } from './EmbeddingPlot';
import { SingleDocumentPanel } from './SingleDocumentPanel';
import { ComparisonPanel } from './ComparisonPanel';
import { StatsOverviewPanel } from './StatsOverviewPanel';
import { DimensionOutliersDialog } from './DimensionOutliersDialog';
import { useDocuments } from '@/hooks/use-chromadb';
import type { EmbeddingData } from './embedding-plot';

interface EmbeddingsVisualizationProps {
  collectionName: string;
}

/**
 * EmbeddingsVisualization component - Main container for all embedding visualization features
 *
 * Features:
 * - Integrated split-panel layout (plot on left, dynamic sidebar on right)
 * - Multi-selection support (select up to 2 documents for comparison)
 * - Dynamic sidebar showing:
 *   - Single document details when 1 selected
 *   - Comparison view when 2 selected
 *   - Stats overview when none selected
 * - Color by metadata field
 * - Right-click context menu on points
 * - Interactive statistics with clickable variance bars
 */
export function EmbeddingsVisualization({ collectionName }: EmbeddingsVisualizationProps) {
  // Multi-selection state (max 2 IDs)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [outlierDialogDimension, setOutlierDialogDimension] = useState<number | null>(null);

  // Fetch documents with embeddings
  const { data: documentsData, isLoading, error } = useDocuments(collectionName, {
    limit: 2000, // Fetch more for visualization
    offset: 0,
    includeEmbeddings: true,
  });

  // Transform documents data to embedding data format
  const embeddings: EmbeddingData[] = useMemo(() => {
    if (!documentsData || !documentsData.embeddings) {
      return [];
    }

    return documentsData.ids.map((id, index) => ({
      id,
      vector: documentsData.embeddings?.[index] || [],
      document: documentsData.documents?.[index] || '',
      metadata: documentsData.metadatas?.[index] || undefined,
    })).filter(e => e.vector.length > 0);
  }, [documentsData]);

  // Get selected documents
  const selectedDocument1 = useMemo(() => {
    if (selectedIds.length === 0) return null;
    return embeddings.find(e => e.id === selectedIds[0]) || null;
  }, [embeddings, selectedIds]);

  const selectedDocument2 = useMemo(() => {
    if (selectedIds.length < 2) return null;
    return embeddings.find(e => e.id === selectedIds[1]) || null;
  }, [embeddings, selectedIds]);

  // Handle point click with multi-selection logic
  const handlePointClick = useCallback((id: string) => {
    setSelectedIds(prev => {
      // If clicking on already selected doc1, deselect it
      if (prev[0] === id) {
        return prev.slice(1); // Remove first, keep second if exists
      }
      // If clicking on already selected doc2, deselect it
      if (prev[1] === id) {
        return [prev[0]!]; // Keep first, remove second
      }
      // If nothing selected, select as doc1
      if (prev.length === 0) {
        return [id];
      }
      // If 1 selected, add as doc2
      if (prev.length === 1) {
        return [prev[0]!, id];
      }
      // If 2 already selected, replace doc2
      return [prev[0]!, id];
    });
  }, []);

  // Handle clear selection
  const handleClearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  // Handle swap documents in comparison
  const handleSwapDocuments = useCallback(() => {
    setSelectedIds(prev => {
      if (prev.length === 2) {
        return [prev[1]!, prev[0]!];
      }
      return prev;
    });
  }, []);

  // Handle selecting a document for comparison from sidebar
  const handleSelectForCompare = useCallback((id: string, slot: 1 | 2) => {
    setSelectedIds(prev => {
      if (slot === 1) {
        return [id, prev[1]].filter(Boolean) as string[];
      } else {
        return [prev[0] || id, id];
      }
    });
  }, []);

  // Handle dimension click from stats panel
  const handleDimensionClick = useCallback((dimension: number) => {
    setOutlierDialogDimension(dimension);
  }, []);

  // Handle document selection from outliers dialog
  const handleSelectFromOutliers = useCallback((id: string) => {
    setSelectedIds([id]);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <Card className="m-4">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="m-4">
        <CardHeader>
          <CardTitle>Error Loading Embeddings</CardTitle>
          <CardDescription className="text-destructive">
            {error instanceof Error ? error.message : 'Failed to load documents'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // No embeddings state
  if (embeddings.length === 0) {
    return (
      <Card className="m-4">
        <CardHeader>
          <CardTitle>Embeddings Visualization</CardTitle>
          <CardDescription>
            No embeddings available in this collection
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <ScatterChart className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            Documents in this collection do not have embeddings stored,
            or the collection is empty.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Determine what to show in the sidebar
  const sidebarContent = () => {
    // Two documents selected -> Comparison panel
    if (selectedDocument1 && selectedDocument2) {
      return (
        <ComparisonPanel
          document1={selectedDocument1}
          document2={selectedDocument2}
          allEmbeddings={embeddings}
          onSwap={handleSwapDocuments}
          onClear={handleClearSelection}
          onSelectForCompare={handleSelectForCompare}
        />
      );
    }

    // One document selected -> Single document panel
    if (selectedDocument1) {
      return (
        <SingleDocumentPanel
          document={selectedDocument1}
          onClose={handleClearSelection}
        />
      );
    }

    // Nothing selected -> Stats overview
    return (
      <StatsOverviewPanel
        embeddings={embeddings}
        onDimensionClick={handleDimensionClick}
      />
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Compact Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{embeddings.length}</span>
            <span className="text-xs text-muted-foreground">documents</span>
          </div>
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{embeddings[0]?.vector.length || 0}</span>
            <span className="text-xs text-muted-foreground">dimensions</span>
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Selected:</span>
            {selectedIds.map((id, idx) => (
              <Badge
                key={id}
                variant={idx === 0 ? 'default' : 'secondary'}
                className={`text-xs ${idx === 0 ? 'bg-blue-500' : 'bg-green-500'}`}
              >
                {id.length > 12 ? `${id.slice(0, 12)}...` : id}
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleClearSelection}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Main Content - Split Panel Layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left Panel - Plot (60%) */}
        <div className="w-[60%] p-4 overflow-hidden">
          <EmbeddingPlot
            embeddings={embeddings}
            selectedIds={selectedIds}
            onPointClick={handlePointClick}
          />
        </div>

        {/* Right Panel - Dynamic Sidebar (40%) */}
        <div className="w-[40%] border-l p-4 overflow-hidden">
          {sidebarContent()}
        </div>
      </div>

      {/* Dimension Outliers Dialog */}
      <DimensionOutliersDialog
        open={outlierDialogDimension !== null}
        onOpenChange={(open) => !open && setOutlierDialogDimension(null)}
        dimension={outlierDialogDimension}
        embeddings={embeddings}
        onSelectDocument={handleSelectFromOutliers}
      />
    </div>
  );
}
