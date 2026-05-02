import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Download, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateCollection, useUpdateCollection } from '../../hooks/use-chromadb';
import { useWarmupModel, useModelDownloadProgress, useCollectionOpenAIKeyStatus } from '../../hooks/use-embedding';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Progress } from '../ui/progress';
import { EmbeddingConfigPanel } from '../embeddings/EmbeddingConfigPanel';
import { CollectionApiKeyPanel } from '../embeddings/CollectionApiKeyPanel';
import { ExternalCollectionConfigDialog } from '../embeddings/ExternalCollectionConfigDialog';
import { useEmbeddingStore } from '../../stores/embedding-store';
import type { Collection, DistanceFunction, EmbeddingConfig } from '../../../shared/schemas';

// Form schema
const formSchema = z.object({
  name: z
    .string()
    .min(1, 'Collection name is required')
    .max(63, 'Collection name must be at most 63 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Collection name must be alphanumeric and underscores only'),
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
  const [isEmbeddingOpen, setIsEmbeddingOpen] = useState(false);
  const [isEmbeddingConfigOpen, setIsEmbeddingConfigOpen] = useState(false);
  const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);
  const [isWarmingUp, setIsWarmingUp] = useState(false);
  const [showModelChangeWarning, setShowModelChangeWarning] = useState(false);
  const [pendingConfig, setPendingConfig] = useState<EmbeddingConfig | null>(null);

  // Track the original model when the dialog opened (for create mode)
  const originalModelRef = useRef<string>('');

  // Get embedding config from store
  const { buildEmbeddingConfig, resetToDefaults, loadConfig, selectedProvider, hasOpenAIKey } =
    useEmbeddingStore();

  // Model warmup and download progress
  const warmupModel = useWarmupModel();
  const downloadProgressMap = useModelDownloadProgress();
  const downloadProgress = Object.values(downloadProgressMap).find(
    (p) => p.status === 'downloading'
  );

  // Check collection-specific API key status (only in edit mode for OpenAI collections)
  const { data: collectionKeyStatus } = useCollectionOpenAIKeyStatus(
    isEditMode && collection?.metadata?.embedding_provider === 'openai' ? collection.name : ''
  );

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
      distanceFunction: 'l2',
      metadata: collection?.metadata ? JSON.stringify(collection.metadata, null, 2) : '{}',
    },
  });

  const distanceFunction = watch('distanceFunction');

  // Register metadata with custom onChange for JSON validation
  const { onChange: metadataOnChange, ...metadataRest } = register('metadata');

  const validateMetadata = (value: string) => {
    if (value) {
      try {
        JSON.parse(value);
        setMetadataError(null);
      } catch (error) {
        setMetadataError(error instanceof Error ? error.message : 'Invalid JSON');
      }
    } else {
      setMetadataError(null);
    }
  };

  const handleMetadataChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    metadataOnChange(e);
    validateMetadata(e.target.value);
  };

  // Mutations
  const createCollection = useCreateCollection();
  const updateCollection = useUpdateCollection();

  // Reset form when dialog opens/closes or collection changes
  useEffect(() => {
    if (open) {
      reset({
        name: collection?.name || '',
        distanceFunction: 'l2',
        metadata: collection?.metadata ? JSON.stringify(collection.metadata, null, 2) : '{}',
      });
      setMetadataError(null);
      setIsEmbeddingOpen(false);
      setIsWarmingUp(false);
      setShowModelChangeWarning(false);
      setPendingConfig(null);
      // Reset embedding config to defaults when opening create dialog
      if (!isEditMode) {
        resetToDefaults();
        setIsApiKeyOpen(false);
        // Capture the original model at dialog open time (after resetToDefaults)
        originalModelRef.current = useEmbeddingStore.getState().localConfig.model;
      }
    }
  }, [open, collection, reset, isEditMode, resetToDefaults]);

  // Auto-expand API key section if collection has an OpenAI key
  useEffect(() => {
    if (open && isEditMode && collectionKeyStatus?.hasKey) {
      setIsApiKeyOpen(true);
    } else if (open && isEditMode && !collectionKeyStatus?.hasKey) {
      setIsApiKeyOpen(false);
    }
  }, [open, isEditMode, collectionKeyStatus?.hasKey]);

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
        // Create new collection with embedding config
        const embeddingConfig = buildEmbeddingConfig();

        // For local models (default/huggingface), warm up the model first
        // This ensures the model is downloaded before collection creation
        if (embeddingConfig.provider !== 'openai') {
          setIsWarmingUp(true);
          try {
            await warmupModel.mutateAsync(embeddingConfig);
          } catch (error) {
            setIsWarmingUp(false);
            console.error("Model warmup error:", error);
            toast.error(
              `Failed to download embedding model: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
            return;
          }
          setIsWarmingUp(false);
        }

        await createCollection.mutateAsync({
          name: data.name,
          metadata: parsedMetadata,
          distanceFunction: data.distanceFunction,
          embeddingConfig,
        });
      }

      // Close dialog on success
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation hooks (toast notification)
      console.error('Form submission error:', error);
    }
  };

  const isSubmitting = createCollection.isPending || updateCollection.isPending || isWarmingUp;
  const isFormValid =
    isValid &&
    !metadataError &&
    // If using OpenAI, require API key
    (selectedProvider !== 'openai' || hasOpenAIKey);

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
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

          {/* Distance Function (Create mode only) */}
          {!isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="distanceFunction">Distance Function</Label>
              <Select
                value={distanceFunction}
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

          {/* Embedding Configuration (Create mode only) */}
          {!isEditMode && (
            <Collapsible open={isEmbeddingOpen} onOpenChange={setIsEmbeddingOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" type="button" className="w-full justify-between">
                  <span>
                    Embedding Configuration
                    <span className="ml-2 text-muted-foreground text-xs">
                      ({selectedProvider === 'local'
                        ? 'Default (Local)'
                        : selectedProvider === 'openai'
                          ? 'OpenAI'
                          : selectedProvider === 'ollama'
                            ? 'Ollama'
                            : 'HuggingFace'}
                      )
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    {isEmbeddingOpen ? '−' : '+'}
                  </span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <div className="space-y-4">
                  <EmbeddingConfigPanel />

                  {/* Collection-specific API key (only shown for OpenAI provider) */}
                  {selectedProvider === 'openai' && watch('name') && (
                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-medium mb-3">Collection-Specific OpenAI API Key</h4>
                      <CollectionApiKeyPanel collectionName={watch('name')} />
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Model Download Progress (shown during warmup) */}
          {isWarmingUp && (
            <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300">
                <Download className="h-4 w-4 animate-pulse" />
                Downloading embedding model...
              </div>
              {downloadProgress && (
                <>
                  <Progress value={downloadProgress.percentage || 0} className="h-2" />
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {downloadProgress.percentage.toFixed(0)}% complete
                  </p>
                </>
              )}
              <p className="text-xs text-muted-foreground">
                This may take a moment for first-time model downloads.
              </p>
            </div>
          )}

          {/* OpenAI API Key Settings (Edit mode only, for OpenAI collections) */}
          {isEditMode && collection.metadata?.embedding_provider === 'openai' && (
            <Collapsible open={isApiKeyOpen} onOpenChange={setIsApiKeyOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" type="button" className="w-full justify-between">
                  <span>OpenAI API Key Settings</span>
                  <span className="text-muted-foreground">
                    {isApiKeyOpen ? '−' : '+'}
                  </span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <CollectionApiKeyPanel collectionName={collection.name} />
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Metadata */}
          <div className="space-y-2">
            <Label htmlFor="metadata">Metadata (JSON)</Label>
            <Textarea
              id="metadata"
              {...metadataRest}
              onChange={isEditMode ? undefined : handleMetadataChange}
              readOnly={isEditMode}
              placeholder="{}"
              rows={4}
              className={`font-mono text-xs ${isEditMode ? 'bg-muted text-muted-foreground cursor-default select-text' : ''} ${metadataError ? 'border-destructive' : ''}`}
            />
            {metadataError && (
              <p className="text-xs text-destructive">Invalid JSON: {metadataError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {isEditMode
                ? 'Collection metadata is read-only. Use the Update Embedding Configuration button below to change the embedding model.'
                : 'Optional metadata to store with the collection (must be valid JSON)'}
            </p>
          </div>

          {/* Update Embedding Config (Edit mode only) */}
          {isEditMode && (
            <div className="rounded-lg border p-4 space-y-3">
              <div>
                <p className="text-sm font-medium">Embedding Configuration</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {collection.metadata?.embedding_provider
                    ? `Provider: ${collection.metadata.embedding_provider}${collection.metadata.embedding_model ? ` · Model: ${collection.metadata.embedding_model}` : ''}`
                    : 'No embedding configuration stored on this collection.'}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const configStr = collection?.metadata?.embedding_config;
                  if (configStr && typeof configStr === 'string') {
                    try {
                      loadConfig(JSON.parse(configStr));
                    } catch {
                      resetToDefaults();
                    }
                  } else {
                    resetToDefaults();
                  }
                  setIsEmbeddingConfigOpen(true);
                }}
              >
                <Settings className="mr-2 h-4 w-4" />
                Update Embedding Configuration
              </Button>
            </div>
          )}

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
              {isWarmingUp
                ? 'Downloading model...'
                : isEditMode
                  ? 'Save Changes'
                  : 'Create Collection'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {isEditMode && collection && (
      <ExternalCollectionConfigDialog
        open={isEmbeddingConfigOpen}
        collectionName={collection.name}
        isUpdate
        onSaved={() => {
          setIsEmbeddingConfigOpen(false);
          toast.success('Embedding configuration updated');
        }}
        onCancel={() => setIsEmbeddingConfigOpen(false)}
      />
    )}

    <AlertDialog open={showModelChangeWarning} onOpenChange={setShowModelChangeWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Change embedding model?</AlertDialogTitle>
          <AlertDialogDescription>
            This collection already has <strong>{collection?.count ?? 0}</strong> documents embedded
            with the current model. Changing the model will make existing and new documents
            incompatible for similarity search. Existing documents will not be re-embedded
            automatically.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setPendingConfig(null)}>
            Keep current model
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (pendingConfig) {
                // Apply the pending config change
              }
              setPendingConfig(null);
              setShowModelChangeWarning(false);
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Change anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
