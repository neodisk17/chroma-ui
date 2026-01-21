import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScatterChart, BarChart, ArrowLeftRight } from 'lucide-react';
import { EmbeddingPlot, EmbeddingData } from './EmbeddingPlot';
import { EmbeddingCompare } from './EmbeddingCompare';
import { EmbeddingStats } from './EmbeddingStats';
import { useDocuments } from '@/hooks/use-chromadb';

interface EmbeddingsVisualizationProps {
  collectionName: string;
}

/**
 * EmbeddingsVisualization component - Main container for all embedding visualization features
 *
 * Features:
 * - 2D scatter plot visualization with PCA
 * - Embedding comparison tool
 * - Embedding statistics view
 * - Data loading from collection
 */
export function EmbeddingsVisualization({ collectionName }: EmbeddingsVisualizationProps) {
  const [activeTab, setActiveTab] = useState('plot');
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

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

  const handlePointClick = (id: string) => {
    setSelectedId(id === selectedId ? undefined : id);
  };

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

  return (
    <div className="p-4 space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="plot" className="gap-2">
            <ScatterChart className="h-4 w-4" />
            2D Plot
          </TabsTrigger>
          <TabsTrigger value="compare" className="gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            Compare
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <BarChart className="h-4 w-4" />
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plot" className="mt-4">
          <EmbeddingPlot
            embeddings={embeddings}
            selectedId={selectedId}
            onPointClick={handlePointClick}
          />
        </TabsContent>

        <TabsContent value="compare" className="mt-4">
          <EmbeddingCompare embeddings={embeddings} />
        </TabsContent>

        <TabsContent value="stats" className="mt-4">
          <EmbeddingStats embeddings={embeddings} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
