import { useState } from 'react';
import { CollectionList } from '../components/collections/CollectionList';
import { DocumentGrid } from '../components/documents/DocumentGrid';

function DocumentsPage() {
  const [selectedCollection, setSelectedCollection] = useState<string | undefined>();

  const handleSelectCollection = (collectionName: string) => {
    setSelectedCollection(collectionName);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar: Collection List */}
      <div className="w-80 flex-shrink-0 border-r">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Collections</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Select a collection to view documents
          </p>
        </div>
        <CollectionList
          selectedCollection={selectedCollection}
          onSelectCollection={handleSelectCollection}
          onCreateCollection={() => {
            // Not needed here, users can go to Collections page
          }}
          onEditCollection={() => {
            // Not needed here, users can go to Collections page
          }}
        />
      </div>

      {/* Main Content: Document Grid */}
      <div className="flex-1">
        {selectedCollection ? (
          <DocumentGrid collectionName={selectedCollection} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-muted-foreground">
                Select a collection to view documents
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Choose a collection from the sidebar to get started
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DocumentsPage;
