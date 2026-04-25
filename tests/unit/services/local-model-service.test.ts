import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('electron', () => ({
  app: { getPath: vi.fn(() => '/tmp/test-userData') },
}));

vi.mock('@xenova/transformers', () => ({
  pipeline: vi.fn(),
  env: { cacheDir: '' },
}));

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
  },
}));

import { localModelService } from '../../../electron/services/local-model-service';
import fs from 'fs';

describe('localModelService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('listAvailableModels', () => {
    it('returns all curated models', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      const models = await localModelService.listAvailableModels();
      expect(models.length).toBeGreaterThanOrEqual(5);
      expect(models[0].id).toBe('Xenova/all-MiniLM-L6-v2');
      expect(models[0].isDefault).toBe(true);
    });

    it('marks model as downloaded when config.json exists', async () => {
      vi.mocked(fs.existsSync).mockImplementation((p) =>
        String(p).includes('all-MiniLM-L6-v2')
      );
      const models = await localModelService.listAvailableModels();
      const defaultModel = models.find((m) => m.id === 'Xenova/all-MiniLM-L6-v2');
      expect(defaultModel?.isDownloaded).toBe(true);
    });
  });

  describe('checkModelIntegrity', () => {
    it('returns false when config.json does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      const result = localModelService.checkModelIntegrity('Xenova/all-MiniLM-L6-v2');
      expect(result).toBe(false);
    });

    it('returns true when config.json exists', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      const result = localModelService.checkModelIntegrity('Xenova/all-MiniLM-L6-v2');
      expect(result).toBe(true);
    });
  });

  describe('getModelCacheDir', () => {
    it('returns path under userData/models', () => {
      const dir = localModelService.getModelCacheDir();
      expect(dir).toContain('models');
      expect(dir).toContain('test-userData');
    });
  });
});
