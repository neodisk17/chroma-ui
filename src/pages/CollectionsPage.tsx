import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database } from 'lucide-react';
import { CollectionList } from '../components/collections/CollectionList';
import { CollectionDetail } from '../components/collections/CollectionDetail';
import { CollectionDialog } from '../components/collections/CollectionDialog';
import { DocumentGrid } from '../components/documents/DocumentGrid';
import { AddEditDocumentDialog } from '../components/documents/AddEditDocumentDialog';
import { Button } from '../components/ui/button';
import { useConnectionStore } from '@/stores/connection-store';
import type { Collection } from '../../shared/schemas';

function CollectionsPage() {
  const navigate = useNavigate();
  const { activeConnectionId } = useConnectionStore();
  const [selectedCollection, setSelectedCollection] = useState<string | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [collectionToEdit, setCollectionToEdit] = useState<Collection | undefined>();
  const [addDocumentDialogOpen, setAddDocumentDialogOpen] = useState(false);

  // Show empty state if no connection is active
  if (!activeConnectionId) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center space-y-4">
          <Database className="h-16 w-16 mx-auto text-muted-foreground" />
          <h2 className="text-2xl font-semibold">No Connection Selected</h2>
          <p className="text-muted-foreground">
            Please select or create a connection to access Collections
          </p>
          <Button onClick={() => navigate('/')}>Go to Home</Button>
        </div>
      </div>
    );
  }

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
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedCollection ? (
          <>
            <CollectionDetail
              collectionName={selectedCollection}
              onAddDocument={() => setAddDocumentDialogOpen(true)}
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
            <div className="flex-1 overflow-hidden border-t">
              <DocumentGrid collectionName={selectedCollection} />
            </div>
          </>
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

      {/* Add Document Dialog */}
      {selectedCollection && (
        <AddEditDocumentDialog
          open={addDocumentDialogOpen}
          onClose={() => setAddDocumentDialogOpen(false)}
          collectionName={selectedCollection}
        />
      )}
    </div>
  );
}

export default CollectionsPage;
