import * as keytar from 'keytar';
import type { EmbeddingFunction } from 'chromadb';
import type {
  EmbeddingConfig,
  LocalEmbeddingConfig,
  OpenAIEmbeddingConfig,
  HuggingFaceEmbeddingConfig,
  HuggingFaceModelPreset,
  TestEmbeddingResponse,
} from '../../shared/schemas';
import { EmbeddingConfigSchema } from '../../shared/schemas';
import { localModelService } from './local-model-service';

const SERVICE_NAME = 'chromadb-ui-embeddings';
const OPENAI_KEY_ACCOUNT = 'openai-api-key';
const HUGGINGFACE_KEY_ACCOUNT = 'huggingface-api-key';

/**
 * Generate collection-specific key account name
 */
function getCollectionKeyAccount(collectionName: string): string {
  return `${OPENAI_KEY_ACCOUNT}:collection:${collectionName}`;
}

// Predefined HuggingFace models (popular models on HuggingFace Inference API)
export const HUGGINGFACE_MODEL_PRESETS: HuggingFaceModelPreset[] = [
  {
    id: 'sentence-transformers/all-MiniLM-L6-v2',
    name: 'MiniLM L6 v2',
    dimensions: 384,
    description: 'Fast and lightweight model, good for general use',
  },
  {
    id: 'sentence-transformers/all-mpnet-base-v2',
    name: 'MPNet Base v2',
    dimensions: 768,
    description: 'High-quality embeddings, balanced performance',
  },
  {
    id: 'BAAI/bge-small-en-v1.5',
    name: 'BGE Small EN',
    dimensions: 384,
    description: 'Optimized for retrieval tasks, English only',
  },
  {
    id: 'intfloat/e5-small-v2',
    name: 'E5 Small v2',
    dimensions: 384,
    description: 'Multilingual capable, good for search',
  },
  {
    id: 'intfloat/multilingual-e5-small',
    name: 'Multilingual E5 Small',
    dimensions: 384,
    description: 'Supports 100+ languages',
  },
];

/**
 * OpenAI Embedding Function implementation
 */
class OpenAIEmbeddingFunction implements EmbeddingFunction {
  private apiKey: string;
  private model: string;
  private dimensions?: number;

  constructor(apiKey: string, model: string, dimensions?: number) {
    this.apiKey = apiKey;
    this.model = model;
    this.dimensions = dimensions;
  }

  async generate(texts: string[]): Promise<number[][]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        input: texts,
        model: this.model,
        ...(this.dimensions && { dimensions: this.dimensions }),
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `OpenAI API error: ${response.status} - ${error.error?.message || 'Unknown error'}`
      );
    }

    const data = (await response.json()) as {
      data: { embedding: number[]; index: number }[];
    };

    // Sort by index to ensure correct order
    const sorted = data.data.sort((a, b) => a.index - b.index);
    return sorted.map((item) => item.embedding);
  }
}

/**
 * HuggingFace Inference API Embedding Function implementation
 */
class HuggingFaceInferenceEmbeddingFunction implements EmbeddingFunction {
  private apiKey: string;
  private modelId: string;

  constructor(apiKey: string, modelId: string) {
    this.apiKey = apiKey;
    this.modelId = modelId;
  }

  async generate(texts: string[]): Promise<number[][]> {
    const url = `https://api-inference.huggingface.co/pipeline/feature-extraction/${this.modelId}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        inputs: texts,
        options: {
          wait_for_model: true,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `HuggingFace API error: ${response.status} - ${error.error || 'Unknown error'}`
      );
    }

    const data = await response.json();

    // Handle nested arrays (some models return [[embedding]] for single input)
    // The API returns either number[][] or number[][][] depending on input
    if (Array.isArray(data) && data.length > 0) {
      // Check if it's 3D array (model returns [batch, tokens, embedding])
      // For sentence embeddings, we typically want mean pooling
      if (Array.isArray(data[0]) && Array.isArray(data[0][0])) {
        // 3D array: perform mean pooling over token dimension
        return data.map((tokenEmbeddings: number[][]) => {
          const numTokens = tokenEmbeddings.length;
          const embeddingDim = tokenEmbeddings[0].length;
          const pooled = new Array(embeddingDim).fill(0);

          for (const tokenEmb of tokenEmbeddings) {
            for (let i = 0; i < embeddingDim; i++) {
              pooled[i] += tokenEmb[i];
            }
          }

          return pooled.map((val) => val / numTokens);
        });
      }
      // 2D array: already in correct format
      return data as number[][];
    }

    throw new Error('Unexpected response format from HuggingFace API');
  }
}

/**
 * EmbeddingService - Singleton service for managing embedding functions
 */
export class EmbeddingService {
  private activeEmbedders: Map<string, EmbeddingFunction> = new Map();

  // ============================================================================
  // OpenAI API Key Management
  // ============================================================================

  /**
   * Store OpenAI API key in OS keychain
   */
  async setOpenAIApiKey(apiKey: string): Promise<void> {
    try {
      await keytar.setPassword(SERVICE_NAME, OPENAI_KEY_ACCOUNT, apiKey);
    } catch (error) {
      throw new Error(
        `Failed to save OpenAI API key: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Retrieve OpenAI API key from OS keychain
   */
  async getOpenAIApiKey(): Promise<string | null> {
    try {
      return await keytar.getPassword(SERVICE_NAME, OPENAI_KEY_ACCOUNT);
    } catch (error) {
      console.error('Failed to retrieve OpenAI API key:', error);
      return null;
    }
  }

  /**
   * Check if OpenAI API key exists
   */
  async hasOpenAIApiKey(): Promise<boolean> {
    const key = await this.getOpenAIApiKey();
    return key !== null && key.length > 0;
  }

  /**
   * Delete OpenAI API key from OS keychain
   */
  async deleteOpenAIApiKey(): Promise<boolean> {
    try {
      return await keytar.deletePassword(SERVICE_NAME, OPENAI_KEY_ACCOUNT);
    } catch (error) {
      console.error('Failed to delete OpenAI API key:', error);
      return false;
    }
  }

  // ============================================================================
  // Collection-Specific OpenAI API Key Management
  // ============================================================================

  /**
   * Store collection-specific OpenAI API key in OS keychain
   */
  async setCollectionOpenAIApiKey(collectionName: string, apiKey: string): Promise<void> {
    try {
      const account = getCollectionKeyAccount(collectionName);
      await keytar.setPassword(SERVICE_NAME, account, apiKey);
    } catch (error) {
      throw new Error(
        `Failed to save collection OpenAI API key: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Retrieve collection-specific OpenAI API key from OS keychain
   */
  async getCollectionOpenAIApiKey(collectionName: string): Promise<string | null> {
    try {
      const account = getCollectionKeyAccount(collectionName);
      return await keytar.getPassword(SERVICE_NAME, account);
    } catch (error) {
      console.error(`Failed to retrieve collection OpenAI API key for ${collectionName}:`, error);
      return null;
    }
  }

  /**
   * Check if collection-specific OpenAI API key exists
   */
  async hasCollectionOpenAIApiKey(collectionName: string): Promise<boolean> {
    const key = await this.getCollectionOpenAIApiKey(collectionName);
    return key !== null && key.length > 0;
  }

  /**
   * Delete collection-specific OpenAI API key from OS keychain
   */
  async deleteCollectionOpenAIApiKey(collectionName: string): Promise<boolean> {
    try {
      const account = getCollectionKeyAccount(collectionName);
      return await keytar.deletePassword(SERVICE_NAME, account);
    } catch (error) {
      console.error(`Failed to delete collection OpenAI API key for ${collectionName}:`, error);
      return false;
    }
  }

  /**
   * Get OpenAI API key for a collection with fallback logic
   * Priority: collection-specific key → global key → error
   */
  async getOpenAIApiKeyForCollection(collectionName?: string): Promise<string> {
    // Try collection-specific key first if collection name is provided
    if (collectionName) {
      const collectionKey = await this.getCollectionOpenAIApiKey(collectionName);
      if (collectionKey) {
        return collectionKey;
      }
    }

    // Fall back to global key
    const globalKey = await this.getOpenAIApiKey();
    if (globalKey) {
      return globalKey;
    }

    // No key available
    throw new Error('OpenAI API key not configured. Please set your API key first.');
  }

  // ============================================================================
  // HuggingFace API Key Management
  // ============================================================================

  /**
   * Store HuggingFace API key in OS keychain
   */
  async setHuggingFaceApiKey(apiKey: string): Promise<void> {
    try {
      await keytar.setPassword(SERVICE_NAME, HUGGINGFACE_KEY_ACCOUNT, apiKey);
    } catch (error) {
      throw new Error(
        `Failed to save HuggingFace API key: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Retrieve HuggingFace API key from OS keychain
   */
  async getHuggingFaceApiKey(): Promise<string | null> {
    try {
      return await keytar.getPassword(SERVICE_NAME, HUGGINGFACE_KEY_ACCOUNT);
    } catch (error) {
      console.error('Failed to retrieve HuggingFace API key:', error);
      return null;
    }
  }

  /**
   * Check if HuggingFace API key exists
   */
  async hasHuggingFaceApiKey(): Promise<boolean> {
    const key = await this.getHuggingFaceApiKey();
    return key !== null && key.length > 0;
  }

  /**
   * Delete HuggingFace API key from OS keychain
   */
  async deleteHuggingFaceApiKey(): Promise<boolean> {
    try {
      return await keytar.deletePassword(SERVICE_NAME, HUGGINGFACE_KEY_ACCOUNT);
    } catch (error) {
      console.error('Failed to delete HuggingFace API key:', error);
      return false;
    }
  }

  // ============================================================================
  // Embedding Function Creation
  // ============================================================================

  /**
   * Get list of available HuggingFace model presets
   */
  getModelPresets(): HuggingFaceModelPreset[] {
    return HUGGINGFACE_MODEL_PRESETS;
  }

  /**
   * Create an embedding function from configuration
   * @param config - Embedding configuration
   * @param collectionName - Optional collection name for collection-specific key resolution
   */
  async createEmbeddingFunction(
    config: EmbeddingConfig,
    collectionName?: string
  ): Promise<EmbeddingFunction> {
    // Validate config
    const parsed = EmbeddingConfigSchema.parse(config);
    // Include collection name in cache key to support collection-specific keys
    const cacheKey = JSON.stringify({ config: parsed, collection: collectionName });

    // Check cache
    const cached = this.activeEmbedders.get(cacheKey);
    if (cached) {
      return cached;
    }

    let embedder: EmbeddingFunction;

    switch (parsed.provider) {
      case 'local': {
        const localConfig = parsed as LocalEmbeddingConfig;
        embedder = await localModelService.createLocalEmbeddingFunction(
          localConfig.model,
          localConfig.dtype
        );
        break;
      }

      case 'openai': {
        const openaiConfig = parsed as OpenAIEmbeddingConfig;
        // Use fallback logic: collection key → global key → error
        const apiKey = await this.getOpenAIApiKeyForCollection(collectionName);
        embedder = new OpenAIEmbeddingFunction(
          apiKey,
          openaiConfig.model,
          openaiConfig.dimensions
        );
        break;
      }

      case 'huggingface': {
        const hfConfig = parsed as HuggingFaceEmbeddingConfig;
        const apiKey = await this.getHuggingFaceApiKey();
        if (!apiKey) {
          throw new Error('HuggingFace API key not configured. Please set your API key first.');
        }
        embedder = new HuggingFaceInferenceEmbeddingFunction(apiKey, hfConfig.model);
        break;
      }

      default:
        throw new Error(`Unknown embedding provider: ${(parsed as { provider: string }).provider}`);
    }

    // Cache the embedder
    this.activeEmbedders.set(cacheKey, embedder);
    return embedder;
  }

  /**
   * Test an embedding configuration
   */
  async testEmbeddingFunction(
    config: EmbeddingConfig,
    testText: string = 'This is a test sentence for embedding.'
  ): Promise<TestEmbeddingResponse> {
    try {
      const embedder = await this.createEmbeddingFunction(config);
      const embeddings = await embedder.generate([testText]);

      if (!embeddings || embeddings.length === 0 || !embeddings[0]) {
        return {
          success: false,
          error: 'Embedding generation returned empty result',
        };
      }

      const embedding = embeddings[0];
      return {
        success: true,
        dimensions: embedding.length,
        sampleEmbedding: embedding.slice(0, 10), // Return first 10 values as sample
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async warmupModel(config: EmbeddingConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const parsed = EmbeddingConfigSchema.parse(config);
      if (parsed.provider === 'local') {
        await this.createEmbeddingFunction(parsed);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Clear cached embedders
   */
  clearCache(): void {
    this.activeEmbedders.clear();
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService();
