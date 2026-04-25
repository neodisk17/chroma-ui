import { useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Database, ChevronRight, FolderOpen, Pencil, Plus } from 'lucide-react';
import { useConnectionStore } from '@/stores/connection-store';
import { useCollections } from '@/hooks/use-chromadb';
import { Button } from '@/components/ui/button';
import { CollectionDialog } from '@/components/collections/CollectionDialog';

interface ContextBarProps {
  onNewConnection: () => void;
  onNewCollection: () => void;
}

export function ContextBar({ onNewConnection, onNewCollection: _onNewCollection }: ContextBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { collectionId } = useParams<{ collectionId: string }>();

  const {
    connections,
    activeConnectionId,
  } = useConnectionStore();

  const { data: collections = [] } = useCollections();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const activeConnection = connections.find((c) => c.id === activeConnectionId);

  // Route detection flags
  const isHomePage = location.pathname === '/';
  const isCollectionsPage = location.pathname === '/collections';
  const isDocumentsPage = location.pathname.includes('/collections/') &&
                          location.pathname.includes('/documents') &&
                          !!collectionId;

  // Get the current collection object for editing
  const currentCollection = collections.find((c) => c.name === collectionId);

  const handleConnectionClick = () => {
    navigate('/');
  };

  const handleCollectionsClick = () => {
    if (isDocumentsPage) {
      navigate('/collections');
    }
  };

  // Don't render if no active connection
  if (!activeConnection) {
    return (
      <div className="flex items-center justify-between px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 border-b border-yellow-300 dark:border-yellow-700">
        <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
          <Database className="h-4 w-4" />
          <span className="text-sm font-medium">No connection active</span>
        </div>
        <Button variant="outline" size="sm" onClick={onNewConnection}>
          <Plus className="h-4 w-4 mr-1" />
          Connect
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
      {/* Left: Breadcrumb navigation */}
      <div className="flex items-center gap-1">
        {/* Connection Breadcrumb - Hidden on home page */}
        {!isHomePage && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 font-medium hover:bg-accent"
            onClick={handleConnectionClick}
            title="Go to home"
          >
            <Database className="h-4 w-4 text-green-600" />
            <span className="max-w-[150px] truncate">{activeConnection.name}</span>
          </Button>
        )}

        {/* Collections Breadcrumb - Middle level */}
        {(isCollectionsPage || isDocumentsPage) && (
          <>
            {!isHomePage && <ChevronRight className="h-4 w-4 text-muted-foreground" />}

            {isDocumentsPage ? (
              // Clickable when viewing a specific collection
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 font-medium hover:bg-accent"
                onClick={handleCollectionsClick}
                title="Go to collections"
              >
                <FolderOpen className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Collections</span>
              </Button>
            ) : (
              // Non-clickable when on collections page (current location)
              <div className="flex items-center gap-2 px-3 py-1.5">
                <FolderOpen className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Collections</span>
              </div>
            )}
          </>
        )}

        {/* Collection Name Breadcrumb - Only on documents page */}
        {isDocumentsPage && collectionId && (
          <>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium max-w-[150px] truncate">
                {collectionId}
              </span>
              {currentCollection && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 hover:bg-accent"
                  onClick={() => setIsEditDialogOpen(true)}
                  title="Edit collection"
                >
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Right: Connection info */}
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span className="text-xs text-muted-foreground">
          {activeConnection.useSSL ? 'https://' : 'http://'}
          {activeConnection.host}:{activeConnection.port}
        </span>
      </div>

      {/* Edit Collection Dialog */}
      {currentCollection && (
        <CollectionDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          collection={currentCollection}
        />
      )}
    </div>
  );
}
