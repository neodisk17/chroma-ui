import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Search, ScatterChart } from 'lucide-react';
import { DocumentGrid } from '../components/documents/DocumentGrid';
import { QueryBuilder } from '@/components/query/QueryBuilder';
import { EmbeddingsVisualization } from '@/components/documents/EmbeddingsVisualization';

function DocumentsPage() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const [activeTab, setActiveTab] = useState('documents');

  if (!collectionId) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-muted-foreground">
            No collection selected
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <div className="border-b px-4 flex-shrink-0">
          <TabsList className="h-12">
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="query" className="gap-2">
              <Search className="h-4 w-4" />
              Query Builder
            </TabsTrigger>
            <TabsTrigger value="embeddings" className="gap-2">
              <ScatterChart className="h-4 w-4" />
              Embeddings
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="documents" className="flex-1 mt-0 overflow-hidden">
          <DocumentGrid collectionName={collectionId} />
        </TabsContent>

        <TabsContent value="query" className="flex-1 mt-0 overflow-hidden">
          <QueryBuilder collectionName={collectionId} />
        </TabsContent>

        <TabsContent value="embeddings" className="flex-1 mt-0 overflow-auto">
          <EmbeddingsVisualization collectionName={collectionId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default DocumentsPage;
