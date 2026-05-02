import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExternalCollectionConfigDialog } from '../../../src/components/embeddings/ExternalCollectionConfigDialog';

// Mock EmbeddingConfigPanel — it has its own tests; here we just verify it renders
vi.mock('../../../src/components/embeddings/EmbeddingConfigPanel', () => ({
  EmbeddingConfigPanel: ({ collectionName }: { collectionName: string }) => (
    <div data-testid="embedding-config-panel">EmbeddingConfigPanel:{collectionName}</div>
  ),
}));

const mockBuildEmbeddingConfig = vi.fn().mockReturnValue({
  provider: 'openai',
  model: 'text-embedding-3-small',
});

vi.mock('../../../src/stores/embedding-store', () => ({
  useEmbeddingStore: (selector?: (s: any) => any) => {
    const state = { buildEmbeddingConfig: mockBuildEmbeddingConfig };
    return selector ? selector(state) : state;
  },
}));

const defaultProps = {
  open: true,
  collectionName: 'my-collection',
  onSaved: vi.fn(),
  onCancel: vi.fn(),
};

describe('ExternalCollectionConfigDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.electronAPI.invoke = vi.fn().mockResolvedValue({ success: true });
  });

  it('renders EmbeddingConfigPanel with the collection name', () => {
    render(<ExternalCollectionConfigDialog {...defaultProps} />);
    expect(screen.getByTestId('embedding-config-panel')).toHaveTextContent('EmbeddingConfigPanel:my-collection');
  });

  it('shows the collection name in the dialog heading', () => {
    render(<ExternalCollectionConfigDialog {...defaultProps} />);
    expect(screen.getAllByText(/my-collection/).length).toBeGreaterThan(0);
  });

  it('calls onCancel when "Provide vectors manually" is clicked', () => {
    render(<ExternalCollectionConfigDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /provide vectors manually/i }));
    expect(defaultProps.onCancel).toHaveBeenCalledOnce();
  });

  it('calls buildEmbeddingConfig and COLLECTION_UPDATE IPC on save', async () => {
    render(<ExternalCollectionConfigDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /save to collection/i }));

    await waitFor(() => {
      expect(mockBuildEmbeddingConfig).toHaveBeenCalled();
      expect(window.electronAPI.invoke).toHaveBeenCalledWith(
        'collection:update',
        expect.objectContaining({
          name: 'my-collection',
          metadata: expect.objectContaining({
            embedding_config: JSON.stringify({ provider: 'openai', model: 'text-embedding-3-small' }),
          }),
        })
      );
    });
  });

  it('calls onSaved with config after successful save', async () => {
    render(<ExternalCollectionConfigDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /save to collection/i }));

    await waitFor(() =>
      expect(defaultProps.onSaved).toHaveBeenCalledWith({
        provider: 'openai',
        model: 'text-embedding-3-small',
      })
    );
  });

  it('shows error message when IPC call fails', async () => {
    window.electronAPI.invoke = vi.fn().mockResolvedValue({ success: false, error: 'Permission denied' });
    render(<ExternalCollectionConfigDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /save to collection/i }));

    await waitFor(() => expect(screen.getByText(/Permission denied/i)).toBeInTheDocument());
    expect(defaultProps.onSaved).not.toHaveBeenCalled();
  });
});
