import { useState } from 'react';
import { Copy, Check, Edit, Trash2, AlertCircle } from 'lucide-react';
import { useCollection } from '../../hooks/use-chromadb';
import { Button } from '../ui/button';
import { SlidingPanel, SlidingPanelSection } from '../ui/sliding-panel';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import type { Collection } from '../../../shared/schemas';

interface CollectionDetailPanelProps {
  collectionName: string;
  open: boolean;
  onClose: () => void;
  onEdit?: (collection: Collection) => void;
  onDelete?: (collection: Collection) => void;
}

/**
 * CollectionDetailPanel component - side panel showing full collection details
 *
 * Features:
 * - Collection name and ID (copyable)
 * - Document count
 * - Embedding dimension and distance function
 * - Full metadata (JSON viewer with copy)
 * - Action buttons: Edit, Delete, Close
 */
export function CollectionDetailPanel({
  collectionName,
  open,
  onClose,
  onEdit,
  onDelete,
}: CollectionDetailPanelProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedName, setCopiedName] = useState(false);
  const [copiedMetadata, setCopiedMetadata] = useState(false);

  const { data: collection, isLoading, error } = useCollection(collectionName);

  const copyToClipboard = async (
    text: string,
    setter: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      setTimeout(() => setter(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Format metadata as JSON string
  const metadataStr = collection?.metadata
    ? JSON.stringify(collection.metadata, null, 2)
    : '{}';

  // Error content
  if (error) {
    return (
      <SlidingPanel
        open={open}
        onClose={onClose}
        title="Collection Details"
      >
        <div className="flex h-full flex-col items-center justify-center p-8 text-center">
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : 'Failed to load collection'}
          </p>
        </div>
      </SlidingPanel>
    );
  }

  // Not found content
  if (!isLoading && !collection) {
    return (
      <SlidingPanel
        open={open}
        onClose={onClose}
        title="Collection Details"
      >
        <div className="flex h-full flex-col items-center justify-center p-8 text-center">
          <p className="text-muted-foreground">Collection not found</p>
        </div>
      </SlidingPanel>
    );
  }

  // Footer with action buttons
  const footer = collection ? (
    <>
      {onDelete && (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(collection)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      )}
      {onEdit && (
        <Button variant="outline" size="sm" onClick={() => onEdit(collection)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      )}
      <Button variant="outline" size="sm" onClick={onClose}>
        Close
      </Button>
    </>
  ) : null;

  return (
    <SlidingPanel
      open={open}
      onClose={onClose}
      title="Collection Details"
      badge={collection?.name}
      isLoading={isLoading}
      footer={footer}
    >
      {collection && (
        <SlidingPanelSection>
          {/* Collection Name */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Collection Name</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(collection.name, setCopiedName)}
                  className="h-7 w-7 p-0"
                >
                  {copiedName ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="break-all font-mono text-xs">{collection.name}</p>
            </CardContent>
          </Card>

          {/* Collection ID */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Collection ID</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(collection.id || '', setCopiedId)}
                  className="h-7 w-7 p-0"
                  disabled={!collection.id}
                >
                  {copiedId ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="break-all font-mono text-xs">{collection.id || 'N/A'}</p>
            </CardContent>
          </Card>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            {/* Document Count */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">{collection.count ?? 0}</p>
              </CardContent>
            </Card>

            {/* Embedding Dimension */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Dimension
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">
                  {collection.metadata?.embedding_dimension ?? 'N/A'}
                </p>
              </CardContent>
            </Card>

            {/* Distance Function */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Distance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="text-xs">
                  {collection.metadata?.distance_function ?? collection.metadata?.hnsw_space ?? 'l2'}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Embedding Configuration */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Embedding Config
              </CardTitle>
            </CardHeader>
            <CardContent>
              {collection.metadata?.embedding_config ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {collection.metadata.embedding_provider === 'openai' ? 'OpenAI' :
                       collection.metadata.embedding_provider === 'huggingface' ? 'HuggingFace' :
                       'Unknown'}
                    </Badge>
                  </div>
                  {collection.metadata.embedding_model && (
                    <p className="text-xs text-muted-foreground">
                      Model: {collection.metadata.embedding_model}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <div>
                    <p className="text-xs font-medium">Not configured</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Documents must have pre-computed embeddings
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Metadata</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(metadataStr, setCopiedMetadata)}
                  className="h-7 w-7 p-0"
                >
                  {copiedMetadata ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                <pre className="whitespace-pre-wrap font-mono text-xs">
                  {metadataStr}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </SlidingPanelSection>
      )}
    </SlidingPanel>
  );
}
