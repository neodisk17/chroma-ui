import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmbeddingConfigPanel } from '../../../src/components/embeddings/EmbeddingConfigPanel';

// Mock embedding store — return openai provider so API key section renders
vi.mock('../../../src/stores/embedding-store', () => ({
  useEmbeddingStore: (selector?: (s: any) => any) => {
    const state = {
      selectedProvider: 'openai',
      localConfig: { model: 'Xenova/all-MiniLM-L6-v2', dtype: 'fp32' },
      openaiConfig: { model: 'text-embedding-3-small' },
      huggingfaceConfig: { model: 'Xenova/all-MiniLM-L6-v2' },
      hasOpenAIKey: false,
      setProvider: vi.fn(),
      setLocalModel: vi.fn(),
      setLocalDType: vi.fn(),
      setOpenAIModel: vi.fn(),
      setOpenAIDimensions: vi.fn(),
      setHuggingFaceModel: vi.fn(),
      setHasOpenAIKey: vi.fn(),
      buildEmbeddingConfig: vi.fn().mockReturnValue({ provider: 'openai', model: 'text-embedding-3-small' }),
    };
    return selector ? selector(state) : state;
  },
}));

const mockCollectionKeyStatus = vi.fn().mockReturnValue({ data: { hasKey: true, hasGlobalKey: false }, isLoading: false });
const mockGlobalKeyStatus = vi.fn().mockReturnValue({ data: { hasKey: false }, isLoading: false });
const mockSaveGlobal = { mutateAsync: vi.fn(), isPending: false };
const mockSaveCollection = { mutateAsync: vi.fn(), isPending: false };

vi.mock('../../../src/hooks/use-embedding', () => ({
  useOpenAIKeyStatus: () => mockGlobalKeyStatus(),
  useSaveOpenAIKey: () => mockSaveGlobal,
  useDeleteOpenAIKey: () => ({ mutateAsync: vi.fn() }),
  useCollectionOpenAIKeyStatus: (name: string) => mockCollectionKeyStatus(name),
  useSaveCollectionOpenAIKey: (name: string) => mockSaveCollection,
  useDeleteCollectionOpenAIKey: () => ({ mutateAsync: vi.fn() }),
  useAvailableModels: () => ({ data: [], isLoading: false }),
  useDownloadModel: () => ({ mutateAsync: vi.fn() }),
  useTestEmbedding: () => ({ mutate: vi.fn(), isPending: false, data: null }),
  useModelDownloadProgress: () => ({}),
}));

describe('EmbeddingConfigPanel', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('without collectionName (global mode)', () => {
    it('shows "API key not configured" when global key is absent', () => {
      render(<EmbeddingConfigPanel />);
      expect(screen.getByText(/API key not configured/i)).toBeInTheDocument();
    });
  });

  describe('with collectionName (per-collection mode)', () => {
    it('checks collection key status with the collection name', () => {
      render(<EmbeddingConfigPanel collectionName="my-col" />);
      expect(mockCollectionKeyStatus).toHaveBeenCalledWith('my-col');
    });

    it('shows "API key configured" when collection has a key', () => {
      render(<EmbeddingConfigPanel collectionName="my-col" />);
      expect(screen.getByText(/API key configured/i)).toBeInTheDocument();
    });

    it('saves via collection hook when Save is clicked', async () => {
      // collection has no key — show input
      mockCollectionKeyStatus.mockReturnValue({ data: { hasKey: false, hasGlobalKey: false }, isLoading: false });
      render(<EmbeddingConfigPanel collectionName="my-col" />);
      fireEvent.change(screen.getByPlaceholderText('sk-...'), { target: { value: 'sk-test' } });
      fireEvent.click(screen.getByRole('button', { name: /save/i }));
      await waitFor(() => expect(mockSaveCollection.mutateAsync).toHaveBeenCalledWith('sk-test'));
      expect(mockSaveGlobal.mutateAsync).not.toHaveBeenCalled();
    });
  });
});
