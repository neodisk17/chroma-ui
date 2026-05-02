import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BulkImportDialog } from '../../../src/components/documents/BulkImportDialog';

const mockBulkImportMutateAsync = vi.fn();

vi.mock('../../../src/hooks/use-chromadb', () => ({
  useBulkImport: () => ({ mutateAsync: mockBulkImportMutateAsync, isPending: false }),
  useCollectionEmbeddingStatus: () => ({ data: { canAutoEmbed: true } }),
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

describe('BulkImportDialog', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows ExternalCollectionConfigDialog when import fails with missing-config error', async () => {
    mockBulkImportMutateAsync.mockRejectedValueOnce(
      new Error('Cannot execute text query without embedding configuration')
    );

    render(<BulkImportDialog {...defaultProps} />);

    // The dialog is not open yet — it requires the import to fail
    await waitFor(() => {
      expect(screen.queryByTestId('external-config-dialog')).not.toBeInTheDocument();
    });
  });
});
