import { useState } from 'react';
import { Button } from '../../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../../ui/dialog';
import { ScrollArea } from '../../../ui/scroll-area';
import { Copy, Check } from 'lucide-react';
import type { DocumentCellRendererParams } from './types';

export const DocumentCellRenderer = (params: DocumentCellRendererParams) => {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const text = params.value || '';
  const PREVIEW_LENGTH = 200;
  const shouldTruncate = text.length > PREVIEW_LENGTH;
  const preview = shouldTruncate ? text.substring(0, PREVIEW_LENGTH) + '...' : text;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="flex h-full items-center gap-2" title={text}>
        <span className="truncate flex-1">{preview}</span>
        {shouldTruncate && (
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs text-primary shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              setShowModal(true);
            }}
          >
            Load more
          </Button>
        )}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-8">
              <span>Document Content</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </DialogTitle>
            <DialogDescription>
              Full document content ({text.length.toLocaleString()} characters)
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="rounded-md bg-muted p-4">
              <pre className="whitespace-pre-wrap text-sm font-mono break-words">
                {text}
              </pre>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};
