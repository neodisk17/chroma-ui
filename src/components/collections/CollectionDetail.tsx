import { FileText, Database, Edit, Trash2, Plus, Search as SearchIcon } from 'lucide-react';
import { useCollection } from '../../hooks/use-chromadb';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import type { Collection } from '../../../shared/schemas';

interface CollectionDetailProps {
  collectionName: string;
  onAddDocument?: () => void;
  onQuery?: () => void;
  onEdit?: (collection: Collection) => void;
  onDelete?: (collection: Collection) => void;
}

export function CollectionDetail({
  collectionName,
  onAddDocument,
  onQuery,
  onEdit,
  onDelete,
}: CollectionDetailProps) {
  const { data: collection, isLoading, error } = useCollection(collectionName);

  // Loading State
  if (isLoading) {
    return (
      <div className="flex h-full flex-col p-6">
        <div className="mb-6">
          <Skeleton className="mb-2 h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : 'Failed to load collection'}
          </p>
        </div>
      </div>
    );
  }

  // Not Found State
  if (!collection) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <Database className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Collection not found</p>
        </div>
      </div>
    );
  }

  // Format metadata as JSON string
  const metadataString = collection.metadata
    ? JSON.stringify(collection.metadata, null, 2)
    : '{}';

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="mb-2 text-2xl font-bold">{collection.name}</h1>
            <p className="text-sm text-muted-foreground">
              Collection ID: <code className="rounded bg-muted px-1 py-0.5">{collection.id}</code>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {onAddDocument && (
              <Button onClick={onAddDocument}>
                <Plus className="mr-2 h-4 w-4" />
                Add Document
              </Button>
            )}
            {onQuery && (
              <Button variant="outline" onClick={onQuery}>
                <SearchIcon className="mr-2 h-4 w-4" />
                Query
              </Button>
            )}
            {onEdit && (
              <Button variant="outline" onClick={() => onEdit(collection)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button variant="outline" onClick={() => onDelete(collection)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Document Count */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{collection.count ?? 0}</span>
                <span className="text-sm text-muted-foreground">total</span>
              </div>
            </CardContent>
          </Card>

          {/* Embedding Dimension */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Embedding Dimension</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  {collection.metadata?.embedding_dimension ?? 'N/A'}
                </span>
                <span className="text-sm text-muted-foreground">dimensions</span>
              </div>
            </CardContent>
          </Card>

          {/* Distance Function */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Distance Function</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="text-sm">
                {collection.metadata?.distance_function ?? collection.metadata?.hnsw_space ?? 'l2'}
              </Badge>
            </CardContent>
          </Card>

          {/* Collection Name */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Collection Name</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="break-all text-sm">{collection.name}</p>
            </CardContent>
          </Card>

          {/* Collection ID */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Collection ID</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="break-all font-mono text-xs">{collection.id}</p>
            </CardContent>
          </Card>
        </div>

        {/* Metadata Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Metadata</CardTitle>
            <CardDescription>
              Collection metadata stored in ChromaDB
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="overflow-auto rounded-md bg-muted p-4 text-xs">
              <code>{metadataString}</code>
            </pre>
          </CardContent>
        </Card>

        {/* Stats Visualization (Optional - Placeholder) */}
        {collection.count && collection.count > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Statistics</CardTitle>
              <CardDescription>
                Collection statistics and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                <FileText className="mr-2 h-4 w-4" />
                Chart visualization coming soon
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
