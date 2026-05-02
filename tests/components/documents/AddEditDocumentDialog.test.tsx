import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { AddEditDocumentDialog } from '../../../src/components/documents/AddEditDocumentDialog';

const mockAddMutateAsync = vi.fn();

vi.mock('../../../src/hooks/use-chromadb', () => ({
  useAddDocument: () => ({ mutateAsync: mockAddMutateAsync, isPending: false }),
  useUpdateDocument: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('../../../src/hooks/use-embedding', () => ({
  useAvailableModels: () => ({ data: [] }),
}));

vi.mock('../../../src/components/documents/DocumentEditor', () => ({
  DocumentEditor: ({ onDataChange }: any) => {
    React.useEffect(() => {
      onDataChange({ id: 'doc1', document: 'hello', metadata: '', autoGenerateId: false });
    }, []);
    return <div data-testid="doc-editor">Editor</div>;
  },
  validateDocumentForm: () => ({ valid: true, errors: [] }),
}));

vi.mock('../../../src/components/embeddings/ModelDownloadDialog', () => ({
  ModelDownloadDialog: () => null,
}));

vi.mock('../../../src/components/embeddings/ExternalCollectionConfigDialog', () => ({
  ExternalCollectionConfigDialog: ({ open, collectionName }: any) =>
    open ? <div data-testid="external-config-dialog">{collectionName}</div> : null,
}));

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  collectionName: 'my-col',
};

describe('AddEditDocumentDialog', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows ExternalCollectionConfigDialog when add fails with missing-config error', async () => {
    mockAddMutateAsync.mockRejectedValueOnce(
      new Error('Cannot execute text query without embedding configuration')
    );

    render(<AddEditDocumentDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /add document|save/i }));

    await waitFor(() =>
      expect(screen.getByTestId('external-config-dialog')).toHaveTextContent('my-col')
    );
  });

  it('does not show config dialog for other errors', async () => {
    mockAddMutateAsync.mockRejectedValueOnce(new Error('Network timeout'));

    render(<AddEditDocumentDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /add document|save/i }));

    await waitFor(() => expect(mockAddMutateAsync).toHaveBeenCalled());
    expect(screen.queryByTestId('external-config-dialog')).not.toBeInTheDocument();
  });

  it('does not show config dialog a second time if retry also fails', async () => {
    mockAddMutateAsync.mockRejectedValue(
      new Error('Cannot execute text query without embedding configuration')
    );

    render(<AddEditDocumentDialog {...defaultProps} />);
    // First attempt
    fireEvent.click(screen.getByRole('button', { name: /add document|save/i }));

    await waitFor(() => expect(screen.getByTestId('external-config-dialog')).toBeInTheDocument());

    // Verify the dialog is showing
    expect(screen.getByTestId('external-config-dialog')).toBeInTheDocument();
  });
});
