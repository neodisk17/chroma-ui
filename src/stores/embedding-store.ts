import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  EmbeddingProvider,
  EmbeddingConfig,
  LocalEmbeddingConfig,
  OpenAIEmbeddingConfig,
  HuggingFaceEmbeddingConfig,
  DType,
  OpenAIModel,
  ModelDownloadProgress,
} from '../../shared/schemas';
import { DEFAULT_EMBEDDING_CONFIG } from '../../shared/schemas';

const DEFAULT_OPENAI_CONFIG: OpenAIEmbeddingConfig = {
  provider: 'openai',
  model: 'text-embedding-3-small',
  dimensions: undefined,
};

const DEFAULT_HUGGINGFACE_CONFIG: HuggingFaceEmbeddingConfig = {
  provider: 'huggingface',
  model: 'Xenova/all-MiniLM-L6-v2',
};

interface EmbeddingState {
  // Current selection
  selectedProvider: EmbeddingProvider;

  // Provider-specific configurations
  localConfig: LocalEmbeddingConfig;
  openaiConfig: OpenAIEmbeddingConfig;
  huggingfaceConfig: HuggingFaceEmbeddingConfig;

  // Computed: the currently-active config
  selectedEmbeddingConfig: EmbeddingConfig;

  // API key status (cached)
  hasOpenAIKey: boolean;

  // Download progress for models, keyed by modelId
  downloadProgress: Record<string, ModelDownloadProgress>;

  // Actions
  setProvider: (provider: EmbeddingProvider) => void;
  setLocalModel: (model: string) => void;
  setLocalDType: (dtype: DType) => void;
  setOpenAIModel: (model: OpenAIModel) => void;
  setOpenAIDimensions: (dimensions: number | undefined) => void;
  setHuggingFaceModel: (model: string) => void;
  setHasOpenAIKey: (hasKey: boolean) => void;
  setDownloadProgress: (modelId: string, progress: ModelDownloadProgress) => void;
  clearDownloadProgress: (modelId: string) => void;

  // Utility
  buildEmbeddingConfig: () => EmbeddingConfig;
  resetToDefaults: () => void;
}

export const useEmbeddingStore = create<EmbeddingState>()(
  persist(
    (set, get) => ({
      // Initial state
      selectedProvider: 'local',
      localConfig: DEFAULT_EMBEDDING_CONFIG as LocalEmbeddingConfig,
      openaiConfig: DEFAULT_OPENAI_CONFIG,
      huggingfaceConfig: DEFAULT_HUGGINGFACE_CONFIG,
      selectedEmbeddingConfig: DEFAULT_EMBEDDING_CONFIG as EmbeddingConfig,
      hasOpenAIKey: false,
      downloadProgress: {},

      // Actions
      setProvider: (provider) => set({ selectedProvider: provider }),

      setLocalModel: (model) =>
        set((state) => ({
          localConfig: { ...state.localConfig, model },
        })),

      setLocalDType: (dtype) =>
        set((state) => ({
          localConfig: { ...state.localConfig, dtype },
        })),

      setOpenAIModel: (model) =>
        set((state) => ({
          openaiConfig: { ...state.openaiConfig, model },
        })),

      setOpenAIDimensions: (dimensions) =>
        set((state) => ({
          openaiConfig: { ...state.openaiConfig, dimensions },
        })),

      setHuggingFaceModel: (model) =>
        set((state) => ({
          huggingfaceConfig: { ...state.huggingfaceConfig, model },
        })),

      setHasOpenAIKey: (hasKey) => set({ hasOpenAIKey: hasKey }),

      setDownloadProgress: (modelId, progress) =>
        set((state) => ({
          downloadProgress: { ...state.downloadProgress, [modelId]: progress },
        })),

      clearDownloadProgress: (modelId) =>
        set((state) => {
          const { [modelId]: _, ...rest } = state.downloadProgress;
          return { downloadProgress: rest };
        }),

      buildEmbeddingConfig: (): EmbeddingConfig => {
        const state = get();
        switch (state.selectedProvider) {
          case 'openai':
            return state.openaiConfig;
          case 'huggingface':
            return state.huggingfaceConfig;
          case 'local':
          default:
            return state.localConfig;
        }
      },

      resetToDefaults: () =>
        set({
          selectedProvider: 'local',
          localConfig: DEFAULT_EMBEDDING_CONFIG as LocalEmbeddingConfig,
          openaiConfig: DEFAULT_OPENAI_CONFIG,
          huggingfaceConfig: DEFAULT_HUGGINGFACE_CONFIG,
          selectedEmbeddingConfig: DEFAULT_EMBEDDING_CONFIG as EmbeddingConfig,
          downloadProgress: {},
        }),
    }),
    {
      name: 'embedding-storage',
      // Persist provider selection and configurations
      partialize: (state) => ({
        selectedProvider: state.selectedProvider,
        localConfig: state.localConfig,
        openaiConfig: state.openaiConfig,
        huggingfaceConfig: state.huggingfaceConfig,
      }),
    }
  )
);
