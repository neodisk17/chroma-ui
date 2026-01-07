import { useState, useRef } from 'react';
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
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Upload, FileJson, FileSpreadsheet, Loader2, CheckCircle } from 'lucide-react';
import { useBulkImport } from '@/hooks/use-chromadb';
import Papa from 'papaparse';

interface BulkImportDialogProps {
  open: boolean;
  onClose: () => void;
  collectionName: string;
}

interface ParsedDocument {
  id?: string;
  document: string;
  metadata?: Record<string, any>;
  embedding?: number[];
}

/**
 * BulkImportDialog component - Import multiple documents from JSON or CSV
 *
 * Features:
 * - File upload (drag & drop supported)
 * - JSON and CSV format support
 * - File validation and preview
 * - Progress indicator during import
 * - Error reporting
 */
export function BulkImportDialog({ open, onClose, collectionName }: BulkImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<ParsedDocument[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bulkImport = useBulkImport();

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setParseError(null);
    setIsParsing(true);

    try {
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'json') {
        await parseJsonFile(selectedFile);
      } else if (fileExtension === 'csv') {
        await parseCsvFile(selectedFile);
      } else {
        setParseError('Unsupported file format. Please upload a .json or .csv file.');
      }
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'Failed to parse file');
    } finally {
      setIsParsing(false);
    }
  };

  const parseJsonFile = async (file: File) => {
    const text = await file.text();
    const parsed = JSON.parse(text);

    if (!Array.isArray(parsed)) {
      throw new Error('JSON file must contain an array of documents');
    }

    // Validate document structure
    const docs: ParsedDocument[] = parsed.map((item, index) => {
      if (!item.document || typeof item.document !== 'string') {
        throw new Error(`Document at index ${index} must have a "document" field with text`);
      }

      return {
        id: item.id,
        document: item.document,
        metadata: item.metadata,
        embedding: item.embedding,
      };
    });

    setDocuments(docs);
  };

  const parseCsvFile = async (file: File) => {
    return new Promise<void>((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const docs: ParsedDocument[] = results.data.map((row: any, index) => {
              if (!row.document) {
                throw new Error(`Row ${index + 1} must have a "document" column`);
              }

              const doc: ParsedDocument = {
                id: row.id,
                document: row.document,
              };

              // Parse metadata if present
              if (row.metadata) {
                try {
                  doc.metadata = JSON.parse(row.metadata);
                } catch (error) {
                  console.warn(`Failed to parse metadata at row ${index + 1}`);
                }
              }

              // Parse embedding if present
              if (row.embedding) {
                try {
                  doc.embedding = JSON.parse(row.embedding);
                } catch (error) {
                  console.warn(`Failed to parse embedding at row ${index + 1}`);
                }
              }

              return doc;
            });

            setDocuments(docs);
            resolve();
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        },
      });
    });
  };

  const handleImport = async () => {
    if (documents.length === 0) return;

    try {
      await bulkImport.mutateAsync({
        collectionName,
        documents,
      });

      // Close dialog on success
      handleClose();
    } catch (error) {
      // Error toast is shown by mutation hook
      console.error('Bulk import error:', error);
    }
  };

  const handleClose = () => {
    setFile(null);
    setDocuments([]);
    setParseError(null);
    onClose();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Documents to {collectionName}</DialogTitle>
          <DialogDescription>
            Upload a JSON or CSV file containing documents to import in bulk
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Upload Area */}
          {!file && (
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-2">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Supported formats: JSON, CSV
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <FileJson className="h-4 w-4" />
                  <span>JSON</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>CSV</span>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />
            </div>
          )}

          {/* Parsing State */}
          {isParsing && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3">Parsing file...</span>
            </div>
          )}

          {/* Parse Error */}
          {parseError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{parseError}</AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {file && !isParsing && !parseError && documents.length > 0 && (
            <div className="space-y-3">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Successfully parsed <strong>{documents.length}</strong> documents from{' '}
                  <strong>{file.name}</strong>
                </AlertDescription>
              </Alert>

              <div className="rounded-md border p-4 max-h-60 overflow-y-auto">
                <h4 className="text-sm font-medium mb-3">Preview (first 5 documents):</h4>
                <div className="space-y-2">
                  {documents.slice(0, 5).map((doc, index) => (
                    <div key={index} className="rounded border p-2 text-xs">
                      <div className="font-mono text-muted-foreground">
                        {doc.id || '<auto-generated>'}
                      </div>
                      <div className="mt-1 line-clamp-2">{doc.document}</div>
                      {doc.metadata && (
                        <div className="mt-1 text-muted-foreground">
                          Metadata: {Object.keys(doc.metadata).length} fields
                        </div>
                      )}
                    </div>
                  ))}
                  {documents.length > 5 && (
                    <div className="text-center text-muted-foreground">
                      and {documents.length - 5} more...
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Import Progress */}
          {bulkImport.isPending && (
            <div className="space-y-2">
              <Progress value={undefined} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">
                Importing documents...
              </p>
            </div>
          )}

          {/* Format Help */}
          <Alert>
            <AlertDescription className="text-xs space-y-2">
              <p><strong>JSON format:</strong></p>
              <pre className="bg-muted p-2 rounded text-[10px] overflow-x-auto">
                {`[
  { "id": "doc1", "document": "text", "metadata": {...}, "embedding": [...] },
  { "document": "text" }
]`}
              </pre>
              <p><strong>CSV format:</strong> Columns: id, document, metadata (JSON), embedding (JSON array)</p>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={bulkImport.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={documents.length === 0 || bulkImport.isPending || isParsing}
          >
            {bulkImport.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import {documents.length > 0 && `${documents.length} Documents`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
