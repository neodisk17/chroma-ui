import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { DocumentEditor, DocumentFormData, validateDocumentForm } from './DocumentEditor';
import { useAddDocument, useUpdateDocument } from '@/hooks/use-chromadb';
import type { Document } from '../../../shared/schemas';

interface AddEditDocumentDialogProps {
  open: boolean;
  onClose: () => void;
  collectionName: string;
  document?: Document | null; // If provided, edit mode; otherwise, add mode
}

/**
 * AddEditDocumentDialog component - Modal for adding or editing documents
 *
 * Features:
 * - Add new document or edit existing
 * - Form validation
 * - Loading states
 * - Error handling
 * - Success/error toasts (from mutation hooks)
 */
export function AddEditDocumentDialog({
  open,
  onClose,
  collectionName,
  document,
}: AddEditDocumentDialogProps) {
  const [formData, setFormData] = useState<DocumentFormData | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const addDocument = useAddDocument();
  const updateDocument = useUpdateDocument();

  const isEditMode = !!document;
  const isLoading = addDocument.isPending || updateDocument.isPending;

  // Reset form when dialog opens/closes or document changes
  useEffect(() => {
    if (open) {
      setValidationErrors([]);
    }
  }, [open, document]);

  const handleSubmit = async () => {
    if (!formData) return;

    // Validate form
    const validation = validateDocumentForm(formData);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    setValidationErrors([]);

    try {
      // Parse metadata and embedding
      let metadata: Record<string, any> | undefined;
      let embedding: number[] | undefined;

      if (formData.metadata.trim()) {
        metadata = JSON.parse(formData.metadata);
      }

      if (!formData.autoGenerateEmbedding && formData.embedding.trim()) {
        embedding = JSON.parse(formData.embedding);
      }

      if (isEditMode) {
        // Update existing document
        await updateDocument.mutateAsync({
          collectionName,
          documentId: formData.id,
          document: formData.document,
          metadata,
          embedding,
        });
      } else {
        // Add new document
        await addDocument.mutateAsync({
          collectionName,
          id: formData.autoGenerateId ? undefined : formData.id,
          document: formData.document,
          metadata,
          embedding,
        });
      }

      // Close dialog on success
      onClose();
    } catch (error) {
      // Error toast is shown by mutation hook
      console.error('Document operation error:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Document' : 'Add Document to'} {collectionName}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the document fields below. ID cannot be changed.'
              : 'Fill in the document details. Fields marked with * are required.'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <DocumentEditor
            document={document}
            onDataChange={setFormData}
          />

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !formData}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Update Document' : 'Add Document'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
