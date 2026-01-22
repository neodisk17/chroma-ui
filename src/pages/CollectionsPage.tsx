import { useState } from 'react';
import { useNavigate, useParams, Outlet } from 'react-router-dom';
import { Database } from 'lucide-react';
import { CollectionList } from '../components/collections/CollectionList';
import { CollectionDetailPanel } from '../components/collections/CollectionDetailPanel';
import { CollectionDialog } from '../components/collections/CollectionDialog';
import { AddEditDocumentDialog } from '../components/documents/AddEditDocumentDialog';
import { Button } from '../components/ui/button';
import { useConnectionStore } from '@/stores/connection-store';
import type { Collection } from '../../shared/schemas';

function CollectionsPage() {
  const navigate = useNavigate();
  const { collectionId } = useParams<{ collectionId: string }>();
  const { activeConnectionId } = useConnectionStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [collectionToEdit, setCollectionToEdit] = useState<Collection | undefined>();
  const [addDocumentDialogOpen, setAddDocumentDialogOpen] = useState(false);

  // Metadata panel state
  const [showMetadataPanel, setShowMetadataPanel] = useState(false);
  const [metadataPanelCollection, setMetadataPanelCollection] = useState<string | undefined>();

  // Determine which collection to highlight - from URL params
  const highlightedCollection = collectionId;

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

  const handleViewMetadata = (collection: Collection) => {
    setMetadataPanelCollection(collection.name);
    setShowMetadataPanel(true);
  };

  const handleCloseMetadataPanel = () => {
    setShowMetadataPanel(false);
    setMetadataPanelCollection(undefined);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar: Collection List - Only show when no collection is selected */}
      {!collectionId && (
        <div className="w-80 flex-shrink-0">
          <CollectionList
            selectedCollection={highlightedCollection}
            onCreateCollection={handleCreateCollection}
            onEditCollection={handleEditCollection}
            onViewMetadata={handleViewMetadata}
          />
        </div>
      )}

      {/* Main Content: Outlet for nested routes */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {collectionId ? (
          // Nested route - render DocumentsPage via Outlet
          <Outlet />
        ) : (
          // No selection - show empty state
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
      {metadataPanelCollection && (
        <AddEditDocumentDialog
          open={addDocumentDialogOpen}
          onClose={() => setAddDocumentDialogOpen(false)}
          collectionName={metadataPanelCollection}
        />
      )}

      {/* Collection Metadata Panel (sliding from right) */}
      {metadataPanelCollection && (
        <CollectionDetailPanel
          collectionName={metadataPanelCollection}
          open={showMetadataPanel}
          onClose={handleCloseMetadataPanel}
          onEdit={(collection) => {
            handleCloseMetadataPanel();
            handleEditCollection(collection);
          }}
          onDelete={(collection) => {
            // TODO: Implement delete confirmation
            console.log('Delete', collection.name);
          }}
        />
      )}
    </div>
  );
}

export default CollectionsPage;
