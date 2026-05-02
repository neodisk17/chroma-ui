import { useState } from 'react';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  useCollectionOpenAIKeyStatus,
  useSaveCollectionOpenAIKey,
  useDeleteCollectionOpenAIKey,
} from '../../hooks/use-embedding';

interface CollectionApiKeyPanelProps {
  collectionName: string;
  readonly?: boolean;
}

export function CollectionApiKeyPanel({ collectionName, readonly = false }: CollectionApiKeyPanelProps) {
  const [apiKey, setApiKey] = useState('');

  // Query hooks
  const { data: keyStatus, isLoading: isLoadingStatus } = useCollectionOpenAIKeyStatus(collectionName);

  // Mutation hooks
  const saveKey = useSaveCollectionOpenAIKey(collectionName);
  const deleteKey = useDeleteCollectionOpenAIKey(collectionName);

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    await saveKey.mutateAsync(apiKey);
    setApiKey(''); // Clear input after successful save
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this collection\'s OpenAI API key?')) {
      await deleteKey.mutateAsync();
    }
  };

  if (isLoadingStatus) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking API key status...
      </div>
    );
  }

  const hasCollectionKey = keyStatus?.hasKey || false;
  const hasGlobalKey = keyStatus?.hasGlobalKey || false;

  return (
    <div className="space-y-4">
      {/* Status Indicator */}
      <div className="rounded-lg border p-4 space-y-2">
        <div className="flex items-start gap-2">
          {hasCollectionKey ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Collection-specific key configured</p>
                <p className="text-xs text-muted-foreground">
                  This collection uses its own OpenAI API key
                </p>
              </div>
            </>
          ) : hasGlobalKey ? (
            <>
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Using global API key</p>
                <p className="text-xs text-muted-foreground">
                  This collection falls back to the global OpenAI API key
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">No API key configured</p>
                <p className="text-xs text-muted-foreground">
                  Set a collection-specific key or configure a global key in Embedding Configuration
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Key Management (not shown in readonly mode) */}
      {!readonly && (
        <>
          {/* Add/Update Key Section */}
          <div className="space-y-2">
            <Label htmlFor={`collection-api-key-${collectionName}`}>
              {hasCollectionKey ? 'Update Collection API Key' : 'Add Collection API Key'}
            </Label>
            <div className="flex gap-2">
              <Input
                id={`collection-api-key-${collectionName}`}
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                disabled={saveKey.isPending}
                className="flex-1"
              />
              <Button
                onClick={handleSave}
                disabled={!apiKey.trim() || saveKey.isPending}
                size="sm"
              >
                {saveKey.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {hasCollectionKey ? 'Update' : 'Save'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Collection-specific keys take priority over global keys
            </p>
          </div>

          {/* Delete Key Section */}
          {hasCollectionKey && (
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={deleteKey.isPending}
                className="text-destructive hover:text-destructive"
              >
                {deleteKey.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Remove Collection API Key
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                After removal, this collection will fall back to the global API key
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
