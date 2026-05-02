import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  EmbeddingProvider,
  EmbeddingConfig,
  LocalEmbeddingConfig,
  OpenAIEmbeddingConfig,
  HuggingFaceEmbeddingConfig,
  OllamaEmbeddingConfig,
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

const DEFAULT_OLLAMA_CONFIG: OllamaEmbeddingConfig = {
  provider: 'ollama',
  model: 'nomic-embed-text',
  baseUrl: 'http://localhost:11434',
};

interface EmbeddingState {
  // Current selection
  selectedProvider: EmbeddingProvider;

  // Provider-specific configurations
  localConfig: LocalEmbeddingConfig;
  openaiConfig: OpenAIEmbeddingConfig;
  huggingfaceConfig: HuggingFaceEmbeddingConfig;
  ollamaConfig: OllamaEmbeddingConfig;

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
  setOllamaModel: (model: string) => void;
  setOllamaBaseUrl: (baseUrl: string) => void;
  setHasOpenAIKey: (hasKey: boolean) => void;
  loadConfig: (config: EmbeddingConfig) => void;
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
      localConfig: DEFAULT_EMBEDDING_CONFIG,
      openaiConfig: DEFAULT_OPENAI_CONFIG,
      huggingfaceConfig: DEFAULT_HUGGINGFACE_CONFIG,
      ollamaConfig: DEFAULT_OLLAMA_CONFIG,
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

      setOllamaModel: (model) =>
        set((state) => ({
          ollamaConfig: { ...state.ollamaConfig, model },
        })),

      setOllamaBaseUrl: (baseUrl) =>
        set((state) => ({
          ollamaConfig: { ...state.ollamaConfig, baseUrl },
        })),

      loadConfig: (config) => {
        set({ selectedProvider: config.provider });
        if (config.provider === 'local') {
          set((s) => ({ localConfig: { ...s.localConfig, model: config.model, dtype: config.dtype } }));
        } else if (config.provider === 'openai') {
          set((s) => ({ openaiConfig: { ...s.openaiConfig, model: config.model, dimensions: config.dimensions } }));
        } else if (config.provider === 'huggingface') {
          set((s) => ({ huggingfaceConfig: { ...s.huggingfaceConfig, model: config.model } }));
        } else if (config.provider === 'ollama') {
          set((s) => ({ ollamaConfig: { ...s.ollamaConfig, model: config.model, baseUrl: config.baseUrl } }));
        }
      },

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
          case 'ollama':
            return state.ollamaConfig;
          case 'local':
          default:
            return state.localConfig;
        }
      },

      resetToDefaults: () =>
        set({
          selectedProvider: 'local',
          localConfig: DEFAULT_EMBEDDING_CONFIG,
          openaiConfig: DEFAULT_OPENAI_CONFIG,
          huggingfaceConfig: DEFAULT_HUGGINGFACE_CONFIG,
          ollamaConfig: DEFAULT_OLLAMA_CONFIG,
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
        ollamaConfig: state.ollamaConfig,
      }),
    }
  )
);
