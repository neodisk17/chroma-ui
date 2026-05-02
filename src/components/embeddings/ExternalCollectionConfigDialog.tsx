import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Loader2 } from 'lucide-react';
import { IPC_CHANNELS } from '../../../shared/constants';
import { EmbeddingConfigPanel } from './EmbeddingConfigPanel';
import { useEmbeddingStore } from '../../stores/embedding-store';
import type { EmbeddingConfig } from '../../../shared/schemas';

interface ExternalCollectionConfigDialogProps {
  open: boolean;
  collectionName: string;
  onSaved: (config: EmbeddingConfig) => void;
  onCancel: () => void;
  isUpdate?: boolean;
}

export function ExternalCollectionConfigDialog({
  open,
  collectionName,
  onSaved,
  onCancel,
  isUpdate = false,
}: ExternalCollectionConfigDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const buildEmbeddingConfig = useEmbeddingStore((s) => s.buildEmbeddingConfig);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    const config = buildEmbeddingConfig();

    try {
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
      <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{isUpdate ? 'Update Embedding Configuration' : 'Configure Embedding Model'}</DialogTitle>
          <DialogDescription>
            {isUpdate
              ? <>Update the embedding provider and model for collection <strong>{collectionName}</strong>. Existing documents will not be re-embedded automatically.</>
              : <>Collection <strong>{collectionName}</strong> has no embedding configuration. Select the provider and model used to create this collection.</>}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <EmbeddingConfigPanel collectionName={collectionName} />
          {error && <p className="text-sm text-destructive mt-3">{error}</p>}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {!isUpdate && (
            <Button variant="outline" onClick={onCancel} className="sm:mr-auto">
              Provide vectors manually
            </Button>
          )}
          {isUpdate && (
            <Button variant="outline" onClick={onCancel} className="sm:mr-auto">
              Cancel
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving}>
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
