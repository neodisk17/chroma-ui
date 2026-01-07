import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { useDeleteDocuments } from '@/hooks/use-chromadb';

interface DeleteDocumentDialogProps {
  open: boolean;
  onClose: () => void;
  collectionName: string;
  documentIds: string[];
}

/**
 * DeleteDocumentDialog component - Confirmation dialog for deleting documents
 *
 * Features:
 * - Single or bulk delete confirmation
 * - Shows list of documents being deleted
 * - Loading state during deletion
 * - Success/error toasts (from mutation hook)
 */
export function DeleteDocumentDialog({
  open,
  onClose,
  collectionName,
  documentIds,
}: DeleteDocumentDialogProps) {
  const deleteDocuments = useDeleteDocuments();

  const isSingleDelete = documentIds.length === 1;
  const isLoading = deleteDocuments.isPending;

  const handleConfirm = async () => {
    try {
      await deleteDocuments.mutateAsync({
        collectionName,
        documentIds,
      });

      // Close dialog on success
      onClose();
    } catch (error) {
      // Error toast is shown by mutation hook
      console.error('Delete documents error:', error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isSingleDelete ? 'Delete Document?' : `Delete ${documentIds.length} Documents?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isSingleDelete ? (
              <>
                Are you sure you want to delete document <strong>{documentIds[0]}</strong>? This action
                cannot be undone.
              </>
            ) : (
              <div className="space-y-2">
                <p>
                  Are you sure you want to delete {documentIds.length} documents? This action
                  cannot be undone.
                </p>
                <div className="rounded-md bg-muted p-3 max-h-40 overflow-y-auto">
                  <p className="text-xs font-medium mb-2">Documents to delete:</p>
                  <ul className="text-xs space-y-1">
                    {documentIds.slice(0, 5).map((id) => (
                      <li key={id} className="font-mono">
                        {id}
                      </li>
                    ))}
                    {documentIds.length > 5 && (
                      <li className="text-muted-foreground">
                        and {documentIds.length - 5} more...
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
