import React, { useState } from 'react';
import { X, Copy, Check, Edit, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { EmbeddingViewer } from './EmbeddingViewer';
import type { Document } from '../../../shared/schemas';

interface DocumentDetailProps {
  document: Document | null;
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
  isLoading = false,
  onClose,
  onEdit,
  onDelete,
}: DocumentDetailProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedDocument, setCopiedDocument] = useState(false);
  const [copiedMetadata, setCopiedMetadata] = useState(false);

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

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="fixed right-0 top-0 h-full w-[600px] border-l bg-background shadow-lg">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>

          {/* Content */}
          <div className="flex-1 space-y-4 p-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // No document
  if (!document) {
    return (
      <div className="fixed right-0 top-0 h-full w-[600px] border-l bg-background shadow-lg">
        <div className="flex h-full flex-col items-center justify-center p-8 text-center">
          <p className="text-muted-foreground">No document selected</p>
        </div>
      </div>
    );
  }

  // Format metadata as JSON string
  const metadataStr = document.metadata
    ? JSON.stringify(document.metadata, null, 2)
    : 'No metadata';

  return (
    <div className="fixed right-0 top-0 z-50 h-full w-[600px] border-l bg-background shadow-lg">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Document Details</h2>
            <Badge variant="outline" className="font-mono text-xs">
              {document.id}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="space-y-4 p-4">
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

            {/* Embedding */}
            <EmbeddingViewer embedding={document.embedding} />
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 border-t p-4">
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
        </div>
      </div>
    </div>
  );
}
