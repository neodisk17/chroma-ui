import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  EmbeddingProvider,
  EmbeddingConfig,
  DefaultEmbeddingConfig,
  OpenAIEmbeddingConfig,
  HuggingFaceEmbeddingConfig,
  DType,
  OpenAIModel,
  ModelDownloadProgress,
} from '../../shared/schemas';

// Default configurations
const DEFAULT_EMBEDDING_CONFIG: DefaultEmbeddingConfig = {
  provider: 'default',
  model: 'Xenova/all-MiniLM-L6-v2',
  dtype: 'fp32',
};

const DEFAULT_OPENAI_CONFIG: OpenAIEmbeddingConfig = {
  provider: 'openai',
  model: 'text-embedding-3-small',
  dimensions: undefined,
};

const DEFAULT_HUGGINGFACE_CONFIG: HuggingFaceEmbeddingConfig = {
  provider: 'huggingface',
  model: 'Xenova/all-MiniLM-L6-v2',
  dtype: 'fp32',
};

interface EmbeddingState {
  // Current selection
  selectedProvider: EmbeddingProvider;

  // Provider-specific configurations
  defaultConfig: DefaultEmbeddingConfig;
  openaiConfig: OpenAIEmbeddingConfig;
  huggingfaceConfig: HuggingFaceEmbeddingConfig;

  // API key status (cached)
  hasOpenAIKey: boolean;

  // Download progress for models
  downloadProgress: ModelDownloadProgress | null;

  // Actions
  setProvider: (provider: EmbeddingProvider) => void;
  setDefaultModel: (model: string) => void;
  setDefaultDType: (dtype: DType) => void;
  setOpenAIModel: (model: OpenAIModel) => void;
  setOpenAIDimensions: (dimensions: number | undefined) => void;
  setHuggingFaceModel: (model: string) => void;
  setHuggingFaceDType: (dtype: DType) => void;
  setHasOpenAIKey: (hasKey: boolean) => void;
  setDownloadProgress: (progress: ModelDownloadProgress | null) => void;

  // Utility
  buildEmbeddingConfig: () => EmbeddingConfig;
  resetToDefaults: () => void;
}

export const useEmbeddingStore = create<EmbeddingState>()(
  persist(
    (set, get) => ({
      // Initial state
      selectedProvider: 'default',
      defaultConfig: DEFAULT_EMBEDDING_CONFIG,
      openaiConfig: DEFAULT_OPENAI_CONFIG,
      huggingfaceConfig: DEFAULT_HUGGINGFACE_CONFIG,
      hasOpenAIKey: false,
      downloadProgress: null,

      // Actions
      setProvider: (provider) => set({ selectedProvider: provider }),

      setDefaultModel: (model) =>
        set((state) => ({
          defaultConfig: { ...state.defaultConfig, model },
        })),

      setDefaultDType: (dtype) =>
        set((state) => ({
          defaultConfig: { ...state.defaultConfig, dtype },
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

      setHuggingFaceDType: (dtype) =>
        set((state) => ({
          huggingfaceConfig: { ...state.huggingfaceConfig, dtype },
        })),

      setHasOpenAIKey: (hasKey) => set({ hasOpenAIKey: hasKey }),

      setDownloadProgress: (progress) => set({ downloadProgress: progress }),

      buildEmbeddingConfig: (): EmbeddingConfig => {
        const state = get();
        switch (state.selectedProvider) {
          case 'openai':
            return state.openaiConfig;
          case 'huggingface':
            return state.huggingfaceConfig;
          case 'default':
          default:
            return state.defaultConfig;
        }
      },

      resetToDefaults: () =>
        set({
          selectedProvider: 'default',
          defaultConfig: DEFAULT_EMBEDDING_CONFIG,
          openaiConfig: DEFAULT_OPENAI_CONFIG,
          huggingfaceConfig: DEFAULT_HUGGINGFACE_CONFIG,
          downloadProgress: null,
        }),
    }),
    {
      name: 'embedding-storage',
      // Persist provider selection and configurations
      partialize: (state) => ({
        selectedProvider: state.selectedProvider,
        defaultConfig: state.defaultConfig,
        openaiConfig: state.openaiConfig,
        huggingfaceConfig: state.huggingfaceConfig,
      }),
    }
  )
);
