import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import type { EmbeddingFunction } from 'chromadb';
import type { AvailableModel, DType } from '../../shared/schemas';

const CURATED_MODELS: Omit<AvailableModel, 'isDownloaded'>[] = [
  {
    id: 'Xenova/all-MiniLM-L6-v2',
    name: 'all-MiniLM-L6-v2',
    sizeLabel: '22MB',
    dimensions: 384,
    description: 'Default — fast, general purpose',
    isDefault: true,
  },
  {
    id: 'Xenova/all-MiniLM-L12-v2',
    name: 'all-MiniLM-L12-v2',
    sizeLabel: '33MB',
    dimensions: 384,
    description: 'Better quality than L6',
    isDefault: false,
  },
  {
    id: 'Xenova/all-mpnet-base-v2',
    name: 'all-mpnet-base-v2',
    sizeLabel: '86MB',
    dimensions: 768,
    description: 'High quality English',
    isDefault: false,
  },
  {
    id: 'Xenova/paraphrase-multilingual-MiniLM-L12-v2',
    name: 'paraphrase-multilingual-MiniLM-L12-v2',
    sizeLabel: '117MB',
    dimensions: 384,
    description: 'Multilingual support',
    isDefault: false,
  },
  {
    id: 'Xenova/bge-small-en-v1.5',
    name: 'bge-small-en-v1.5',
    sizeLabel: '33MB',
    dimensions: 384,
    description: 'Best quality/size ratio',
    isDefault: false,
  },
];

export const DEFAULT_LOCAL_MODEL_ID = 'Xenova/all-MiniLM-L6-v2';

// Loaded pipeline cache — avoid re-loading the same model
const pipelineCache = new Map<string, unknown>();

export type ModelProgressCallback = (progress: {
  modelId: string;
  percentage: number;
  status: 'downloading' | 'complete' | 'error' | 'cancelled';
  error?: string;
}) => void;

function getModelCacheDir(): string {
  return path.join(app.getPath('userData'), 'models');
}

function initCacheDir(): void {
  const dir = getModelCacheDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function checkModelIntegrity(modelId: string): boolean {
  // @xenova/transformers v2 stores model as: cacheDir/org/repo/config.json
  const parts = modelId.split('/');
  const modelDir = path.join(getModelCacheDir(), ...parts);
  const configPath = path.join(modelDir, 'config.json');
  return fs.existsSync(configPath);
}

async function listAvailableModels(): Promise<AvailableModel[]> {
  return CURATED_MODELS.map((m) => ({
    ...m,
    isDownloaded: checkModelIntegrity(m.id),
  }));
}

async function downloadModel(
  modelId: string,
  progressCallback: ModelProgressCallback
): Promise<void> {
  // Dynamic import to avoid loading transformers at module init time
  const { pipeline, env } = await import('@xenova/transformers');

  initCacheDir();
  env.cacheDir = getModelCacheDir();

  progressCallback({ modelId, percentage: 0, status: 'downloading' });

  try {
    const extractor = await (pipeline as Function)('feature-extraction', modelId, {
      progress_callback: (data: { status: string; progress?: number }) => {
        if (data.status === 'progress' && typeof data.progress === 'number') {
          progressCallback({
            modelId,
            percentage: Math.round(data.progress),
            status: 'downloading',
          });
        }
      },
    });

    pipelineCache.set(`${modelId}:fp32`, extractor);
    progressCallback({ modelId, percentage: 100, status: 'complete' });
  } catch (error) {
    progressCallback({
      modelId,
      percentage: 0,
      status: 'error',
      error: error instanceof Error ? error.message : 'Download failed',
    });
    throw error;
  }
}

async function cleanPartialDownload(modelId: string): Promise<void> {
  const parts = modelId.split('/');
  const modelDir = path.join(getModelCacheDir(), ...parts);
  if (fs.existsSync(modelDir)) {
    fs.rmSync(modelDir, { recursive: true, force: true });
  }
}

async function createLocalEmbeddingFunction(
  modelId: string,
  dtype: DType = 'fp32'
): Promise<EmbeddingFunction> {
  const { pipeline, env } = await import('@xenova/transformers');

  initCacheDir();
  env.cacheDir = getModelCacheDir();

  const cacheKey = `${modelId}:${dtype}`;
  let extractor = pipelineCache.get(cacheKey);

  if (!extractor) {
    extractor = await (pipeline as Function)('feature-extraction', modelId, { dtype });
    pipelineCache.set(cacheKey, extractor);
  }

  return {
    generate: async (texts: string[]): Promise<number[][]> => {
      const fn = extractor as (
        texts: string[],
        opts: Record<string, unknown>
      ) => Promise<{ tolist: () => number[][] }>;
      const output = await fn(texts, { pooling: 'mean', normalize: true });
      return output.tolist();
    },
  };
}

export const localModelService = {
  getModelCacheDir,
  initCacheDir,
  checkModelIntegrity,
  listAvailableModels,
  downloadModel,
  cleanPartialDownload,
  createLocalEmbeddingFunction,
  DEFAULT_LOCAL_MODEL_ID,
  CURATED_MODELS,
};
