import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { IPC_CHANNELS } from '../../../shared/constants';
import type { AvailableModel, EmbeddingConfig } from '../../../shared/schemas';

interface ExternalCollectionConfigDialogProps {
  open: boolean;
  collectionName: string;
  detectedDimensions: number | null;
  availableModels: AvailableModel[];
  onSaved: (config: EmbeddingConfig) => void;
  onCancel: () => void;
}

export function ExternalCollectionConfigDialog({
  open,
  collectionName,
  detectedDimensions,
  availableModels,
  onSaved,
  onCancel,
}: ExternalCollectionConfigDialogProps) {
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter models by detected dimensions
  const filteredModels = detectedDimensions
    ? availableModels.filter((m) => m.dimensions === detectedDimensions)
    : availableModels;

  const handleSave = async () => {
    if (!selectedModelId) return;
    setIsSaving(true);
    setError(null);

    const config: EmbeddingConfig = {
      provider: 'local',
      model: selectedModelId,
      dtype: 'fp32',
    };

    try {
      // Save embedding_config to collection metadata
      const response = await window.electronAPI.invoke(
        IPC_CHANNELS.COLLECTION_UPDATE,
        {
          name: collectionName,
          metadata: {
            embedding_config: JSON.stringify(config),
            embedding_provider: config.provider,
            embedding_model: config.model,
          },
        }
      );

      if (!response.success) throw new Error(response.error);
      onSaved(config);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Configure Embedding Model</DialogTitle>
          <DialogDescription>
            Collection <strong>{collectionName}</strong> was created outside this app and has no
            embedding configuration stored.
            {detectedDimensions && (
              <span className="block mt-1">
                Detected embedding dimensions: <strong>{detectedDimensions}</strong>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Select the model used to create this collection</Label>
            <div className="space-y-2">
              {filteredModels.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedModelId(m.id)}
                  className={[
                    'w-full flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-left transition-colors',
                    selectedModelId === m.id
                      ? 'border-primary bg-primary/5'
                      : 'border-input hover:bg-accent',
                  ].join(' ')}
                >
                  {m.isDownloaded && <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />}
                  <span>{m.name}</span>
                  <span className="ml-auto text-muted-foreground">
                    {m.sizeLabel}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950 p-3 flex gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
            <p className="text-sm text-orange-700 dark:text-orange-300">
              Selecting the <strong>wrong model</strong> produces incorrect search results even
              if no error is shown. Dimensions must match exactly.
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onCancel} className="sm:mr-auto">
            Provide vectors manually
          </Button>
          <Button onClick={handleSave} disabled={!selectedModelId || isSaving}>
            {isSaving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              'Save to collection'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
