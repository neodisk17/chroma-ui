import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { Document } from '../../../shared/schemas';

interface DocumentEditorProps {
  document?: Document | null;
  onDataChange?: (data: DocumentFormData) => void;
}

export interface DocumentFormData {
  id: string;
  document: string;
  metadata: string; // JSON string
  embedding: string; // JSON string
  autoGenerateId: boolean;
  autoGenerateEmbedding: boolean;
}

/**
 * DocumentEditor component - form for creating/editing documents
 *
 * Features:
 * - Document ID (with auto-generate option)
 * - Document text (large textarea)
 * - Metadata (JSON editor with validation)
 * - Embedding (JSON array with validation, with auto-generate option)
 * - Real-time validation
 * - Character count
 */
export function DocumentEditor({ document, onDataChange }: DocumentEditorProps) {
  const [formData, setFormData] = useState<DocumentFormData>({
    id: document?.id || '',
    document: document?.document || '',
    metadata: document?.metadata ? JSON.stringify(document.metadata, null, 2) : '{}',
    embedding: document?.embedding ? JSON.stringify(document.embedding) : '[]',
    autoGenerateId: !document?.id,
    autoGenerateEmbedding: true,
  });

  const [errors, setErrors] = useState<{
    metadata?: string;
    embedding?: string;
    document?: string;
  }>({});

  // Validate JSON fields
  const validateMetadata = (value: string): boolean => {
    if (!value.trim()) {
      setErrors((prev) => ({ ...prev, metadata: undefined }));
      return true;
    }

    try {
      const parsed = JSON.parse(value);
      if (typeof parsed !== 'object' || Array.isArray(parsed)) {
        setErrors((prev) => ({ ...prev, metadata: 'Metadata must be a JSON object' }));
        return false;
      }
      setErrors((prev) => ({ ...prev, metadata: undefined }));
      return true;
    } catch (error) {
      setErrors((prev) => ({ ...prev, metadata: 'Invalid JSON format' }));
      return false;
    }
  };

  const validateEmbedding = (value: string): boolean => {
    if (!value.trim() || formData.autoGenerateEmbedding) {
      setErrors((prev) => ({ ...prev, embedding: undefined }));
      return true;
    }

    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) {
        setErrors((prev) => ({ ...prev, embedding: 'Embedding must be a JSON array' }));
        return false;
      }
      if (!parsed.every((item) => typeof item === 'number')) {
        setErrors((prev) => ({ ...prev, embedding: 'Embedding must be an array of numbers' }));
        return false;
      }
      setErrors((prev) => ({ ...prev, embedding: undefined }));
      return true;
    } catch (error) {
      setErrors((prev) => ({ ...prev, embedding: 'Invalid JSON format' }));
      return false;
    }
  };

  const validateDocument = (value: string): boolean => {
    if (!value.trim()) {
      setErrors((prev) => ({ ...prev, document: 'Document text is required' }));
      return false;
    }
    setErrors((prev) => ({ ...prev, document: undefined }));
    return true;
  };

  // Update form data and notify parent
  const updateFormData = (updates: Partial<DocumentFormData>) => {
    const newData = { ...formData, ...updates };
    setFormData(newData);
    if (onDataChange) {
      onDataChange(newData);
    }
  };

  // Validate on change
  useEffect(() => {
    validateMetadata(formData.metadata);
    validateEmbedding(formData.embedding);
    validateDocument(formData.document);
  }, [formData.metadata, formData.embedding, formData.document, formData.autoGenerateEmbedding]);

  return (
    <div className="space-y-6">
      {/* Document ID */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="doc-id">Document ID</Label>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="auto-id"
              checked={formData.autoGenerateId}
              onCheckedChange={(checked) =>
                updateFormData({ autoGenerateId: checked as boolean })
              }
              disabled={!!document} // Can't change for existing documents
            />
            <label
              htmlFor="auto-id"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Auto-generate
            </label>
          </div>
        </div>
        <Input
          id="doc-id"
          value={formData.id}
          onChange={(e) => updateFormData({ id: e.target.value })}
          disabled={formData.autoGenerateId || !!document}
          placeholder="Leave empty to auto-generate"
          className="font-mono text-sm"
        />
        {document && (
          <p className="text-xs text-muted-foreground">
            Document ID cannot be changed for existing documents
          </p>
        )}
      </div>

      {/* Document Text */}
      <div className="space-y-2">
        <Label htmlFor="doc-text">
          Document Text <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="doc-text"
          value={formData.document}
          onChange={(e) => updateFormData({ document: e.target.value })}
          rows={10}
          className="resize-none font-mono text-sm"
          placeholder="Enter document text..."
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formData.document.length} characters</span>
          {errors.document && (
            <span className="text-destructive">{errors.document}</span>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="space-y-2">
        <Label htmlFor="doc-metadata">Metadata (JSON Object)</Label>
        <Textarea
          id="doc-metadata"
          value={formData.metadata}
          onChange={(e) => updateFormData({ metadata: e.target.value })}
          rows={5}
          className={`resize-none font-mono text-xs ${errors.metadata ? 'border-destructive' : ''}`}
          placeholder='{"key": "value", "author": "John Doe"}'
        />
        {errors.metadata && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.metadata}</AlertDescription>
          </Alert>
        )}
        <p className="text-xs text-muted-foreground">
          Optional: Enter metadata as a JSON object
        </p>
      </div>

      {/* Embedding */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="doc-embedding">Embedding Vector (JSON Array)</Label>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="auto-embedding"
              checked={formData.autoGenerateEmbedding}
              onCheckedChange={(checked) =>
                updateFormData({ autoGenerateEmbedding: checked as boolean })
              }
            />
            <label
              htmlFor="auto-embedding"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Auto-generate from text
            </label>
          </div>
        </div>
        <Textarea
          id="doc-embedding"
          value={formData.embedding}
          onChange={(e) => updateFormData({ embedding: e.target.value })}
          rows={3}
          disabled={formData.autoGenerateEmbedding}
          className={`resize-none font-mono text-xs ${errors.embedding ? 'border-destructive' : ''}`}
          placeholder='[0.1, 0.2, 0.3, ...]'
        />
        {errors.embedding && !formData.autoGenerateEmbedding && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.embedding}</AlertDescription>
          </Alert>
        )}
        <p className="text-xs text-muted-foreground">
          {formData.autoGenerateEmbedding
            ? 'Embedding will be automatically generated from the document text'
            : 'Optional: Enter a custom embedding vector as a JSON array of numbers'}
        </p>
      </div>
    </div>
  );
}

/**
 * Validate form data before submission
 */
export function validateDocumentForm(data: DocumentFormData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate document text
  if (!data.document.trim()) {
    errors.push('Document text is required');
  }

  // Validate metadata JSON
  if (data.metadata.trim()) {
    try {
      const parsed = JSON.parse(data.metadata);
      if (typeof parsed !== 'object' || Array.isArray(parsed)) {
        errors.push('Metadata must be a JSON object');
      }
    } catch (error) {
      errors.push('Invalid metadata JSON format');
    }
  }

  // Validate embedding JSON (if not auto-generating)
  if (!data.autoGenerateEmbedding && data.embedding.trim()) {
    try {
      const parsed = JSON.parse(data.embedding);
      if (!Array.isArray(parsed)) {
        errors.push('Embedding must be a JSON array');
      } else if (!parsed.every((item) => typeof item === 'number')) {
        errors.push('Embedding must be an array of numbers');
      }
    } catch (error) {
      errors.push('Invalid embedding JSON format');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
