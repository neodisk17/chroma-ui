import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { IPC_CHANNELS } from '../../shared/constants';
import type {
  ApiKeyStatus,
  AvailableModelsResponse,
  TestEmbeddingResponse,
  EmbeddingConfig,
  ModelDownloadProgress,
  CollectionApiKeyStatus,
} from '../../shared/schemas';
import { useEmbeddingStore } from '../stores/embedding-store';

// Query keys
const EMBEDDING_QUERY_KEYS = {
  openaiKeyStatus: () => ['embedding', 'openai-key-status'] as const,
  availableModels: () => ['embedding', 'available-models'] as const,
  collectionKeyStatus: (collectionName: string) => ['embedding', 'collection-key-status', collectionName] as const,
};

/**
 * Hook to check OpenAI API key status
 */
export function useOpenAIKeyStatus() {
  const setHasOpenAIKey = useEmbeddingStore((state) => state.setHasOpenAIKey);

  const query = useQuery({
    queryKey: EMBEDDING_QUERY_KEYS.openaiKeyStatus(),
    queryFn: async (): Promise<ApiKeyStatus> => {
      const response = await window.electronAPI.invoke<ApiKeyStatus>(
        IPC_CHANNELS.EMBEDDING_GET_API_KEY_STATUS,
        { provider: 'openai' }
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to check API key status');
      }

      return response.data!;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update store when query succeeds
  useEffect(() => {
    if (query.data) {
      setHasOpenAIKey(query.data.hasKey);
    }
  }, [query.data, setHasOpenAIKey]);

  return query;
}

/**
 * Hook to save OpenAI API key
 */
export function useSaveOpenAIKey() {
  const queryClient = useQueryClient();
  const setHasOpenAIKey = useEmbeddingStore((state) => state.setHasOpenAIKey);

  return useMutation({
    mutationFn: async (apiKey: string): Promise<{ success: boolean }> => {
      const response = await window.electronAPI.invoke<{ success: boolean }>(
        IPC_CHANNELS.EMBEDDING_SET_API_KEY,
        { provider: 'openai', apiKey }
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to save API key');
      }

      return response.data!;
    },
    onSuccess: () => {
      // Update cached status
      queryClient.invalidateQueries({ queryKey: EMBEDDING_QUERY_KEYS.openaiKeyStatus() });
      setHasOpenAIKey(true);
      toast.success('OpenAI API key saved successfully');
    },
    onError: (error) => {
      toast.error(`Failed to save API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });
}

/**
 * Hook to delete OpenAI API key
 */
export function useDeleteOpenAIKey() {
  const queryClient = useQueryClient();
  const setHasOpenAIKey = useEmbeddingStore((state) => state.setHasOpenAIKey);

  return useMutation({
    mutationFn: async (): Promise<{ deleted: boolean }> => {
      const response = await window.electronAPI.invoke<{ deleted: boolean }>(
        IPC_CHANNELS.EMBEDDING_DELETE_API_KEY,
        { provider: 'openai' }
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete API key');
      }

      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMBEDDING_QUERY_KEYS.openaiKeyStatus() });
      setHasOpenAIKey(false);
      toast.success('OpenAI API key deleted');
    },
    onError: (error) => {
      toast.error(`Failed to delete API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });
}

/**
 * Hook to get available HuggingFace models
 */
export function useAvailableModels() {
  return useQuery({
    queryKey: EMBEDDING_QUERY_KEYS.availableModels(),
    queryFn: async (): Promise<AvailableModelsResponse> => {
      const response = await window.electronAPI.invoke<AvailableModelsResponse>(
        IPC_CHANNELS.MODEL_LIST_AVAILABLE
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch available models');
      }

      return response.data!;
    },
    staleTime: Infinity, // Models list is static
  });
}

/**
 * Hook to test embedding configuration
 */
export function useTestEmbedding() {
  return useMutation({
    mutationFn: async ({
      config,
      testText,
    }: {
      config: EmbeddingConfig;
      testText?: string;
    }): Promise<TestEmbeddingResponse> => {
      const response = await window.electronAPI.invoke<TestEmbeddingResponse>(
        IPC_CHANNELS.EMBEDDING_TEST,
        { config, testText }
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to test embedding');
      }

      return response.data!;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Embedding test successful! Dimensions: ${data.dimensions}`);
      } else {
        toast.error(`Embedding test failed: ${data.error}`);
      }
    },
    onError: (error) => {
      toast.error(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });
}

/**
 * Hook to listen for model download progress
 */
export function useModelDownloadProgress() {
  const { setDownloadProgress, clearDownloadProgress } = useEmbeddingStore();

  useEffect(() => {
    const cleanup = window.electronAPI.onModelDownloadProgress((progress: unknown) => {
      const p = progress as ModelDownloadProgress;
      if (p.status === 'complete' || p.status === 'error' || p.status === 'cancelled') {
        clearDownloadProgress(p.modelId);
      } else {
        setDownloadProgress(p.modelId, p);
      }
    });

    return cleanup;
  }, [setDownloadProgress, clearDownloadProgress]);

  return useEmbeddingStore((state) => state.downloadProgress);
}

/**
 * Hook to warm up (pre-download) an embedding model.
 * This triggers model initialization and download before actual use.
 */
export function useWarmupModel() {
  return useMutation({
    mutationFn: async (config: EmbeddingConfig): Promise<{ success: boolean }> => {
      const response = await window.electronAPI.invoke<{ success: boolean }>(
        IPC_CHANNELS.EMBEDDING_WARMUP,
        config
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to warm up model');
      }

      return response.data!;
    },
  });
}

/**
 * Hook to check if an embedding model is ready (downloaded/cached).
 */
export function useIsModelReady() {
  return useMutation({
    mutationFn: async (config: EmbeddingConfig): Promise<{ ready: boolean }> => {
      const response = await window.electronAPI.invoke<{ ready: boolean }>(
        IPC_CHANNELS.EMBEDDING_IS_READY,
        config
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to check model status');
      }

      return response.data!;
    },
  });
}

// ============================================================================
// Collection-Level API Key Hooks
// ============================================================================

/**
 * Hook to check collection-specific OpenAI API key status
 */
export function useCollectionOpenAIKeyStatus(collectionName: string) {
  return useQuery({
    queryKey: EMBEDDING_QUERY_KEYS.collectionKeyStatus(collectionName),
    queryFn: async (): Promise<CollectionApiKeyStatus> => {
      const response = await window.electronAPI.invoke<CollectionApiKeyStatus>(
        IPC_CHANNELS.COLLECTION_GET_API_KEY_STATUS,
        { collectionName }
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to check collection API key status');
      }

      return response.data!;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!collectionName, // Only run query if collection name is provided
  });
}

/**
 * Hook to save collection-specific OpenAI API key
 */
export function useSaveCollectionOpenAIKey(collectionName: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (apiKey: string): Promise<{ success: boolean }> => {
      const response = await window.electronAPI.invoke<{ success: boolean }>(
        IPC_CHANNELS.COLLECTION_SET_API_KEY,
        { collectionName, apiKey }
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to save collection API key');
      }

      return response.data!;
    },
    onSuccess: () => {
      // Invalidate collection key status query
      queryClient.invalidateQueries({
        queryKey: EMBEDDING_QUERY_KEYS.collectionKeyStatus(collectionName)
      });
      toast.success('Collection API key saved successfully');
    },
    onError: (error) => {
      toast.error(`Failed to save collection API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });
}

/**
 * Hook to delete collection-specific OpenAI API key
 */
export function useDeleteCollectionOpenAIKey(collectionName: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<{ deleted: boolean }> => {
      const response = await window.electronAPI.invoke<{ deleted: boolean }>(
        IPC_CHANNELS.COLLECTION_DELETE_API_KEY,
        { collectionName }
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete collection API key');
      }

      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: EMBEDDING_QUERY_KEYS.collectionKeyStatus(collectionName)
      });
      toast.success('Collection API key deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete collection API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });
}
