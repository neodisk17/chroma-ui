import React, { useState } from 'react';
import { Copy, Check, Edit, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { SlidingPanel, SlidingPanelSection } from '../ui/sliding-panel';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { EmbeddingViewer } from './EmbeddingViewer';
import { useDocument } from '../../hooks/use-chromadb';
import type { Document } from '../../../shared/schemas';

interface DocumentDetailProps {
  document: Document | null;
  collectionName?: string;
  isLoading?: boolean;
  onClose: () => void;
  onEdit?: (document: Document) => void;
  onDelete?: (documentId: string) => void;
}

/**
 * DocumentDetail component - side panel showing full document details
 *
 * Features:
 * - Document ID (copyable)
 * - Full document text (scrollable, monospace font)
 * - Metadata (JSON viewer with syntax highlighting)
 * - Embedding (expandable section with EmbeddingViewer)
 * - Action buttons: Edit, Delete, Close
 * - Copy to clipboard buttons for each section
 */
export function DocumentDetail({
  document,
  collectionName,
  isLoading = false,
  onClose,
  onEdit,
  onDelete,
}: DocumentDetailProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedDocument, setCopiedDocument] = useState(false);
  const [copiedMetadata, setCopiedMetadata] = useState(false);

  // Lazy load the full document (with embedding) when the detail panel opens
  const { data: fullDocument, isLoading: isLoadingFullDoc } = useDocument(
    collectionName,
    document?.id
  );

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
  const metadataStr = document?.metadata
    ? JSON.stringify(document.metadata, null, 2)
    : 'No metadata';

  // Custom loading skeleton for document detail
  const loadingSkeleton = (
    <div className="space-y-4 p-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );

  // No document content
  if (!isLoading && !document) {
    return (
      <SlidingPanel
        open={true}
        onClose={onClose}
        title="Document Details"
      >
        <div className="flex h-full flex-col items-center justify-center p-8 text-center">
          <p className="text-muted-foreground">No document selected</p>
        </div>
      </SlidingPanel>
    );
  }

  // Footer with action buttons
  const footer = document ? (
    <>
      {onDelete && (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(document.id)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      )}
      {onEdit && (
        <Button variant="outline" size="sm" onClick={() => onEdit(document)}>
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
      open={true}
      onClose={onClose}
      title="Document Details"
      badge={document?.id}
      isLoading={isLoading}
      loadingSkeleton={loadingSkeleton}
      footer={footer}
    >
      {document && (
        <SlidingPanelSection>
          {/* Document ID */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Document ID</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(document.id, setCopiedId)}
                  className="h-7 w-7 p-0"
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
              <p className="break-all font-mono text-xs">{document.id}</p>
            </CardContent>
          </Card>

          {/* Document Text */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Document Text</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(document.document || '', setCopiedDocument)
                  }
                  className="h-7 w-7 p-0"
                  disabled={!document.document}
                >
                  {copiedDocument ? (
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
                  {document.document || 'No document text'}
                </pre>
              </ScrollArea>
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
                  disabled={!document.metadata}
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
              <ScrollArea className="h-32">
                <pre className="whitespace-pre-wrap font-mono text-xs">
                  {metadataStr}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Embedding - lazy loaded */}
          {isLoadingFullDoc ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Embedding</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <EmbeddingViewer embedding={fullDocument?.embedding ?? document.embedding} />
          )}
        </SlidingPanelSection>
      )}
    </SlidingPanel>
  );
}
