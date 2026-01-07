import { useState } from 'react';
import { CollectionList } from '../components/collections/CollectionList';
import { CollectionDetail } from '../components/collections/CollectionDetail';
import { CollectionDialog } from '../components/collections/CollectionDialog';
import type { Collection } from '../../shared/schemas';

function CollectionsPage() {
  const [selectedCollection, setSelectedCollection] = useState<string | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [collectionToEdit, setCollectionToEdit] = useState<Collection | undefined>();

  const handleCreateCollection = () => {
    setCollectionToEdit(undefined);
    setDialogOpen(true);
  };

  const handleEditCollection = (collection: Collection) => {
    setCollectionToEdit(collection);
    setDialogOpen(true);
  };

  const handleSelectCollection = (collectionName: string) => {
    setSelectedCollection(collectionName);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar: Collection List */}
      <div className="w-80 flex-shrink-0">
        <CollectionList
          selectedCollection={selectedCollection}
          onSelectCollection={handleSelectCollection}
          onCreateCollection={handleCreateCollection}
          onEditCollection={handleEditCollection}
        />
      </div>

      {/* Main Content: Collection Detail */}
      <div className="flex-1">
        {selectedCollection ? (
          <CollectionDetail
            collectionName={selectedCollection}
            onAddDocument={() => {
              // TODO: Implement in Phase 6
              console.log('Add document');
            }}
            onQuery={() => {
              // TODO: Implement in Phase 5
              console.log('Query');
            }}
            onEdit={(collection) => handleEditCollection(collection)}
            onDelete={(collection) => {
              // TODO: Implement delete confirmation
              console.log('Delete', collection.name);
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-muted-foreground">
                Select a collection to view details
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Or create a new collection to get started
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Collection Dialog (Create/Edit) */}
      <CollectionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        collection={collectionToEdit}
      />
    </div>
  );
}

export default CollectionsPage;
