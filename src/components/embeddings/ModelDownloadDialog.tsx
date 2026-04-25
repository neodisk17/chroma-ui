import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Download, Loader2 } from 'lucide-react';
import { IPC_CHANNELS } from '../../../shared/constants';
import type { ModelDownloadProgress } from '../../../shared/schemas';

interface ModelDownloadDialogProps {
  open: boolean;
  modelId: string;
  modelName: string;
  sizeLabel: string;
  onDownloadComplete: () => void;
  onCancel: () => void;
}

export function ModelDownloadDialog({
  open,
  modelId,
  modelName,
  sizeLabel,
  onDownloadComplete,
  onCancel,
}: ModelDownloadDialogProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [percentage, setPercentage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDownloadCompleteRef = useRef(onDownloadComplete);
  useEffect(() => { onDownloadCompleteRef.current = onDownloadComplete; });

  useEffect(() => {
    if (!open) {
      setIsDownloading(false);
      setPercentage(0);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    // Listen for download progress events from main process
    const cleanup = window.electronAPI.onModelDownloadProgress(
      (raw: unknown) => {
        const progress = raw as ModelDownloadProgress;
        if (progress.modelId !== modelId) return;

        if (progress.status === 'downloading') {
          setPercentage(progress.percentage);
        } else if (progress.status === 'complete') {
          setPercentage(100);
          setIsDownloading(false);
          onDownloadCompleteRef.current();
        } else if (progress.status === 'error') {
          setError(progress.error ?? 'Download failed');
          setIsDownloading(false);
        } else if (progress.status === 'cancelled') {
          setIsDownloading(false);
          onCancel();
        }
      }
    );
    return cleanup;
  }, [modelId, onCancel]);

  const handleDownload = async () => {
    setIsDownloading(true);
    setError(null);
    setPercentage(0);
    await window.electronAPI.invoke(IPC_CHANNELS.MODEL_DOWNLOAD, { modelId });
  };

  const handleCancel = async () => {
    if (isDownloading) {
      await window.electronAPI.invoke(IPC_CHANNELS.MODEL_CANCEL_DOWNLOAD, { modelId });
    }
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleCancel(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Download Embedding Model
          </DialogTitle>
          <DialogDescription>
            This operation requires the <strong>{modelName}</strong> model ({sizeLabel}).
            It will be downloaded once and cached locally.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {isDownloading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Downloading {modelName}...
                </span>
                <span className="font-medium">{percentage}%</span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {!isDownloading && !error && (
            <p className="text-sm text-muted-foreground">
              The model will be saved to your app data directory and available offline after download.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {isDownloading ? 'Cancel' : 'Close'}
          </Button>
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Downloading...</>
            ) : (
              <><Download className="mr-2 h-4 w-4" /> Download</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
