import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useConnectionStore } from '@/stores/connection-store';
import { useCollections } from '@/hooks/use-chromadb';
import { QueryBuilder } from '@/components/query/QueryBuilder';
import { useQueryStore } from '@/stores/query-store';

function QueryPage() {
  const navigate = useNavigate();
  const { activeConnectionId } = useConnectionStore();
  const { data: collections } = useCollections();
  const [selectedCollection, setSelectedCollection] = useState<string | undefined>();
  const clearQuery = useQueryStore((s) => s.clearQuery);

  function handleCollectionChange(name: string) {
    clearQuery();
    setSelectedCollection(name);
  }

  // Show empty state if no connection is active
  if (!activeConnectionId) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center space-y-4">
          <Search className="h-16 w-16 mx-auto text-muted-foreground" />
          <h2 className="text-2xl font-semibold">No Connection Selected</h2>
          <p className="text-muted-foreground">
            Please select or create a connection to access Query
          </p>
          <Button onClick={() => navigate('/')}>Go to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Collection Selector Header */}
      <div className="border-b border-border bg-card/40 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Collection</span>
        <Select value={selectedCollection} onValueChange={handleCollectionChange}>
          <SelectTrigger className="w-[260px] h-8 text-sm">
            <SelectValue placeholder="Select a collection…" />
          </SelectTrigger>
          <SelectContent>
            {collections?.map((collection) => (
              <SelectItem key={collection.name} value={collection.name}>
                {collection.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedCollection && (
          <span className="text-xs text-muted-foreground">
            {collections?.find(c => c.name === selectedCollection)?.count ?? 0} documents
          </span>
        )}
      </div>

      {/* Query Builder */}
      <div className="flex-1 overflow-hidden">
        <QueryBuilder collectionName={selectedCollection} />
      </div>
    </div>
  );
}

export default QueryPage;
