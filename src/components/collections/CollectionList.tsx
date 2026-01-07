import { useState, useMemo } from 'react';
import { Search, RefreshCw, Plus, FolderOpen, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useCollections, useDeleteCollection } from '../../hooks/use-chromadb';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Skeleton } from '../ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import type { Collection } from '../../../shared/schemas';

interface CollectionListProps {
  selectedCollection?: string;
  onSelectCollection: (collectionName: string) => void;
  onCreateCollection: () => void;
  onEditCollection: (collection: Collection) => void;
}

export function CollectionList({
  selectedCollection,
  onSelectCollection,
  onCreateCollection,
  onEditCollection,
}: CollectionListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null);

  // Query collections
  const { data: collections = [], isLoading, error, refetch } = useCollections();

  // Delete mutation
  const deleteCollection = useDeleteCollection();

  // Filter collections by search query (debounced)
  const filteredCollections = useMemo(() => {
    if (!searchQuery.trim()) {
      return collections;
    }

    const query = searchQuery.toLowerCase();
    return collections.filter((col) => col.name.toLowerCase().includes(query));
  }, [collections, searchQuery]);

  // Handle delete confirmation
  const handleDeleteClick = (collection: Collection, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollectionToDelete(collection);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (collectionToDelete) {
      await deleteCollection.mutateAsync(collectionToDelete.name);
      setDeleteDialogOpen(false);
      setCollectionToDelete(null);
    }
  };

  // Handle edit click
  const handleEditClick = (collection: Collection, e: React.MouseEvent) => {
    e.stopPropagation();
    onEditCollection(collection);
  };

  return (
    <div className="flex h-full flex-col border-r bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Collections</h2>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => refetch()}
              title="Refresh collections"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="icon" onClick={onCreateCollection} title="Create collection">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Collection List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <p className="text-sm text-destructive">
                {error instanceof Error ? error.message : 'Failed to load collections'}
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">
                Try Again
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && collections.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-sm font-medium">No collections yet</h3>
              <p className="mb-4 text-xs text-muted-foreground">
                Create your first collection to get started
              </p>
              <Button size="sm" onClick={onCreateCollection}>
                <Plus className="mr-2 h-4 w-4" />
                Create Collection
              </Button>
            </div>
          )}

          {/* No Results State */}
          {!isLoading &&
            !error &&
            collections.length > 0 &&
            filteredCollections.length === 0 && (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No collections match &quot;{searchQuery}&quot;
                </p>
              </div>
            )}

          {/* Collections List */}
          {!isLoading && !error && filteredCollections.length > 0 && (
            <div className="space-y-1">
              {filteredCollections.map((collection) => (
                <div
                  key={collection.name}
                  className={`group relative flex cursor-pointer items-center justify-between rounded-md p-3 transition-colors hover:bg-accent ${
                    selectedCollection === collection.name ? 'bg-accent' : ''
                  }`}
                  onClick={() => onSelectCollection(collection.name)}
                >
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <p className="truncate text-sm font-medium">{collection.name}</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {collection.count ?? 0} documents
                    </p>
                  </div>

                  {/* Context Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => handleEditClick(collection, e)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => handleDeleteClick(collection, e)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Collection?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the collection &quot;{collectionToDelete?.name}&quot;?
              This action cannot be undone and will delete all documents in this collection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
