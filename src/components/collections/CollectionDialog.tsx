import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useCreateCollection, useUpdateCollection } from '../../hooks/use-chromadb';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import type { Collection, DistanceFunction, EmbeddingFunction } from '../../../shared/schemas';

// Form schema
const formSchema = z.object({
  name: z
    .string()
    .min(1, 'Collection name is required')
    .max(63, 'Collection name must be at most 63 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Collection name must be alphanumeric and underscores only'),
  embeddingFunction: z.enum(['default', 'openai', 'sentence-transformers']).optional(),
  distanceFunction: z.enum(['l2', 'cosine', 'ip']).optional(),
  metadata: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection?: Collection; // If provided, edit mode; otherwise, create mode
}

export function CollectionDialog({ open, onOpenChange, collection }: CollectionDialogProps) {
  const isEditMode = !!collection;
  const [metadataError, setMetadataError] = useState<string | null>(null);

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      name: collection?.name || '',
      embeddingFunction: 'default',
      distanceFunction: 'l2',
      metadata: collection?.metadata ? JSON.stringify(collection.metadata, null, 2) : '{}',
    },
  });

  // Watch metadata field for validation
  const metadataValue = watch('metadata');

  // Validate JSON metadata
  useEffect(() => {
    if (metadataValue) {
      try {
        JSON.parse(metadataValue);
        setMetadataError(null);
      } catch (error) {
        setMetadataError(error instanceof Error ? error.message : 'Invalid JSON');
      }
    } else {
      setMetadataError(null);
    }
  }, [metadataValue]);

  // Mutations
  const createCollection = useCreateCollection();
  const updateCollection = useUpdateCollection();

  // Reset form when dialog opens/closes or collection changes
  useEffect(() => {
    if (open) {
      reset({
        name: collection?.name || '',
        embeddingFunction: 'default',
        distanceFunction: 'l2',
        metadata: collection?.metadata ? JSON.stringify(collection.metadata, null, 2) : '{}',
      });
      setMetadataError(null);
    }
  }, [open, collection, reset]);

  // Handle form submission
  const onSubmit = async (data: FormData) => {
    // Parse metadata
    let parsedMetadata = {};
    if (data.metadata) {
      try {
        parsedMetadata = JSON.parse(data.metadata);
      } catch (error) {
        setMetadataError(error instanceof Error ? error.message : 'Invalid JSON');
        return;
      }
    }

    try {
      if (isEditMode) {
        // Update existing collection (only metadata can be updated)
        await updateCollection.mutateAsync({
          name: data.name,
          metadata: parsedMetadata,
        });
      } else {
        // Create new collection
        await createCollection.mutateAsync({
          name: data.name,
          metadata: parsedMetadata,
          embeddingFunction: data.embeddingFunction,
          distanceFunction: data.distanceFunction,
        });
      }

      // Close dialog on success
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation hooks (toast notification)
      console.error('Form submission error:', error);
    }
  };

  const isSubmitting = createCollection.isPending || updateCollection.isPending;
  const isFormValid = isValid && !metadataError;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? `Edit Collection: ${collection.name}` : 'Create New Collection'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the collection metadata. Note: Collection name cannot be changed.'
              : 'Create a new collection for storing documents and embeddings.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Collection Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Collection Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="my_collection"
              disabled={isEditMode} // Cannot change name in edit mode
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Alphanumeric characters and underscores only (max 63 characters)
            </p>
          </div>

          {/* Embedding Function (Create mode only) */}
          {!isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="embeddingFunction">Embedding Function</Label>
              <Select
                defaultValue="default"
                onValueChange={(value) =>
                  setValue('embeddingFunction', value as EmbeddingFunction)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="sentence-transformers">Sentence Transformers</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The embedding function to use for generating embeddings
              </p>
            </div>
          )}

          {/* Distance Function (Create mode only) */}
          {!isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="distanceFunction">Distance Function</Label>
              <Select
                defaultValue="l2"
                onValueChange={(value) =>
                  setValue('distanceFunction', value as DistanceFunction)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="l2">L2 (Euclidean)</SelectItem>
                  <SelectItem value="cosine">Cosine Similarity</SelectItem>
                  <SelectItem value="ip">Inner Product</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The distance function to use for similarity search
              </p>
            </div>
          )}

          {/* Metadata */}
          <div className="space-y-2">
            <Label htmlFor="metadata">Metadata (JSON)</Label>
            <Textarea
              id="metadata"
              {...register('metadata')}
              placeholder="{}"
              rows={6}
              className={`font-mono text-xs ${metadataError ? 'border-destructive' : ''}`}
            />
            {metadataError && (
              <p className="text-xs text-destructive">Invalid JSON: {metadataError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Optional metadata to store with the collection (must be valid JSON)
            </p>
          </div>

          {/* Form Actions */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isFormValid || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Save Changes' : 'Create Collection'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
