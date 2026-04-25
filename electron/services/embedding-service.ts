import * as keytar from 'keytar';
import type { EmbeddingFunction } from 'chromadb';
import type {
  EmbeddingConfig,
  DefaultEmbeddingConfig,
  OpenAIEmbeddingConfig,
  HuggingFaceEmbeddingConfig,
  HuggingFaceModelInfo,
  TestEmbeddingResponse,
  ModelDownloadProgress,
} from '../../shared/schemas';
import { EmbeddingConfigSchema } from '../../shared/schemas';
import { BrowserWindow } from 'electron';

const SERVICE_NAME = 'chromadb-ui-embeddings';
const OPENAI_KEY_ACCOUNT = 'openai-api-key';

// Predefined HuggingFace models
const PREDEFINED_MODELS: HuggingFaceModelInfo[] = [
  {
    id: 'Xenova/all-MiniLM-L6-v2',
    name: 'MiniLM L6 v2',
    dimensions: 384,
    size: '90MB',
    description: 'Fast and lightweight model, good for general use',
  },
  {
    id: 'Xenova/all-mpnet-base-v2',
    name: 'MPNet Base v2',
    dimensions: 768,
    size: '420MB',
    description: 'High-quality embeddings, balanced performance',
  },
  {
    id: 'Xenova/bge-small-en-v1.5',
    name: 'BGE Small EN',
    dimensions: 384,
    size: '130MB',
    description: 'Optimized for retrieval tasks, English only',
  },
  {
    id: 'Xenova/bge-base-en-v1.5',
    name: 'BGE Base EN',
    dimensions: 768,
    size: '440MB',
    description: 'High-quality retrieval model, English only',
  },
];

/**
 * OpenAI Embedding Function implementation
 */
class OpenAEmbeddingFunction implements EmbeddingFunction {
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
 * Default Embedding Function using @chroma-core/default-embed
 */
class DefaultEmbedFunction implements EmbeddingFunction {
  private embedder: { generate: (texts: string[]) => Promise<number[][]> } | null = null;
  private modelId: string;
  private dtype: string;
  private initPromise: Promise<void> | null = null;
  private progressCallback?: (progress: ModelDownloadProgress) => void;

  constructor(
    modelId: string,
    dtype: string,
    progressCallback?: (progress: ModelDownloadProgress) => void
  ) {
    this.modelId = modelId;
    this.dtype = dtype;
    this.progressCallback = progressCallback;
  }

  private async initialize(): Promise<void> {
    if (this.embedder) return;
    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = (async () => {
      try {
        this.progressCallback?.({
          modelId: this.modelId,
          status: 'downloading',
          progress: 0,
        });

        // Dynamic import to handle ESM module
        const { DefaultEmbeddingFunction } = await import('@chroma-core/default-embed');

        // Create instance with model configuration
        const embedFn = new DefaultEmbeddingFunction({
          modelName: this.modelId,
          dtype: this.dtype as 'fp32' | 'fp16' | 'q8' | 'int8',
        });

        this.embedder = embedFn;

        this.progressCallback?.({
          modelId: this.modelId,
          status: 'completed',
          progress: 100,
        });
      } catch (error) {
        this.progressCallback?.({
          modelId: this.modelId,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    })();

    await this.initPromise;
  }

  async generate(texts: string[]): Promise<number[][]> {
    await this.initialize();
    if (!this.embedder) {
      throw new Error('Embedder not initialized');
    }
    return this.embedder.generate(texts);
  }
}

/**
 * EmbeddingService - Singleton service for managing embedding functions
 */
export class EmbeddingService {
  private mainWindow: BrowserWindow | null = null;
  private activeEmbedders: Map<string, EmbeddingFunction> = new Map();

  /**
   * Set the main window reference for IPC communication
   */
  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  /**
   * Send download progress to renderer
   */
  private sendProgress(progress: ModelDownloadProgress): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('model:download-progress', progress);
    }
  }

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

  /**
   * Get list of available HuggingFace models
   */
  getAvailableModels(): HuggingFaceModelInfo[] {
    return PREDEFINED_MODELS;
  }

  /**
   * Create an embedding function from configuration
   */
  async createEmbeddingFunction(config: EmbeddingConfig): Promise<EmbeddingFunction> {
    // Validate config
    const parsed = EmbeddingConfigSchema.parse(config);
    const cacheKey = JSON.stringify(parsed);

    // Check cache
    const cached = this.activeEmbedders.get(cacheKey);
    if (cached) {
      return cached;
    }

    let embedder: EmbeddingFunction;

    switch (parsed.provider) {
      case 'openai': {
        const openaiConfig = parsed as OpenAIEmbeddingConfig;
        const apiKey = await this.getOpenAIApiKey();
        if (!apiKey) {
          throw new Error('OpenAI API key not configured. Please set your API key first.');
        }
        embedder = new OpenAEmbeddingFunction(
          apiKey,
          openaiConfig.model,
          openaiConfig.dimensions
        );
        break;
      }

      case 'huggingface': {
        const hfConfig = parsed as HuggingFaceEmbeddingConfig;
        embedder = new DefaultEmbedFunction(
          hfConfig.model,
          hfConfig.dtype,
          (progress) => this.sendProgress(progress)
        );
        break;
      }

      case 'default':
      default: {
        const defaultConfig = parsed as DefaultEmbeddingConfig;
        embedder = new DefaultEmbedFunction(
          defaultConfig.model,
          defaultConfig.dtype,
          (progress) => this.sendProgress(progress)
        );
        break;
      }
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

  /**
   * Clear cached embedders
   */
  clearCache(): void {
    this.activeEmbedders.clear();
  }

  /**
   * Check if a model is ready (cached and initialized)
   * For OpenAI, this checks if API key exists
   * For local models, this checks if the embedder is already cached
   */
  isModelReady(config: EmbeddingConfig): boolean {
    if (config.provider === 'openai') {
      // OpenAI is "ready" if we have the API key (actual check is async)
      return false; // Need to call hasOpenAIApiKey() for accurate result
    }

    const cacheKey = JSON.stringify(config);
    return this.activeEmbedders.has(cacheKey);
  }

  /**
   * Pre-download/warm up a model by initializing it and generating a test embedding.
   * This ensures the model is downloaded and ready for use before actual operations.
   */
  async warmupModel(config: EmbeddingConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const embedder = await this.createEmbeddingFunction(config);
      // Trigger initialization by generating a test embedding
      await embedder.generate(['warmup test']);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during model warmup',
      };
    }
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService();
