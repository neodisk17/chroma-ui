import { ipcMain } from 'electron';
import { z } from 'zod';
import { embeddingService } from '../services/embedding-service';
import {
  EmbeddingConfigSchema,
  TestEmbeddingRequestSchema,
  type ApiKeyStatus,
  type AvailableModelsResponse,
  type TestEmbeddingResponse,
} from '../../shared/schemas';
import {
  IpcResponse,
  errorResponse,
  successResponse,
  handleError,
} from './helpers/ipc-helpers';

// Schema for setting API key
const SetApiKeyRequestSchema = z.object({
  provider: z.enum(['openai']),
  apiKey: z.string().min(1, 'API key is required'),
});

// Schema for getting API key status
const GetApiKeyStatusRequestSchema = z.object({
  provider: z.enum(['openai']),
});

// Schema for deleting API key
const DeleteApiKeyRequestSchema = z.object({
  provider: z.enum(['openai']),
});

/**
 * Register embedding-related IPC handlers
 */
export function registerEmbeddingHandlers(): void {
  // ============================================================================
  // embedding:set-api-key - Store API key in OS keychain
  // ============================================================================
  ipcMain.handle(
    'embedding:set-api-key',
    async (_, requestData): Promise<IpcResponse<{ success: boolean }>> => {
      try {
        const request = SetApiKeyRequestSchema.parse(requestData);

        if (request.provider === 'openai') {
          await embeddingService.setOpenAIApiKey(request.apiKey);
          return successResponse({ success: true });
        }

        return errorResponse(`Unsupported provider: ${request.provider}`);
      } catch (error) {
        return handleError(error, 'embedding:set-api-key', 'Failed to save API key');
      }
    }
  );

  // ============================================================================
  // embedding:get-api-key-status - Check if API key is configured
  // ============================================================================
  ipcMain.handle(
    'embedding:get-api-key-status',
    async (_, requestData): Promise<IpcResponse<ApiKeyStatus>> => {
      try {
        const request = GetApiKeyStatusRequestSchema.parse(requestData);

        if (request.provider === 'openai') {
          const hasKey = await embeddingService.hasOpenAIApiKey();
          return successResponse({
            provider: request.provider,
            hasKey,
          });
        }

        return errorResponse(`Unsupported provider: ${request.provider}`);
      } catch (error) {
        return handleError(
          error,
          'embedding:get-api-key-status',
          'Failed to check API key status'
        );
      }
    }
  );

  // ============================================================================
  // embedding:delete-api-key - Remove API key from keychain
  // ============================================================================
  ipcMain.handle(
    'embedding:delete-api-key',
    async (_, requestData): Promise<IpcResponse<{ deleted: boolean }>> => {
      try {
        const request = DeleteApiKeyRequestSchema.parse(requestData);

        if (request.provider === 'openai') {
          const deleted = await embeddingService.deleteOpenAIApiKey();
          return successResponse({ deleted });
        }

        return errorResponse(`Unsupported provider: ${request.provider}`);
      } catch (error) {
        return handleError(error, 'embedding:delete-api-key', 'Failed to delete API key');
      }
    }
  );

  // ============================================================================
  // embedding:test - Test embedding configuration
  // ============================================================================
  ipcMain.handle(
    'embedding:test',
    async (_, requestData): Promise<IpcResponse<TestEmbeddingResponse>> => {
      try {
        const request = TestEmbeddingRequestSchema.parse(requestData);
        const config = EmbeddingConfigSchema.parse(request.config);

        const result = await embeddingService.testEmbeddingFunction(config, request.testText);
        return successResponse(result);
      } catch (error) {
        return handleError(error, 'embedding:test', 'Failed to test embedding');
      }
    }
  );

  // ============================================================================
  // model:list-available - Get available HuggingFace models
  // ============================================================================
  ipcMain.handle(
    'model:list-available',
    async (): Promise<IpcResponse<AvailableModelsResponse>> => {
      try {
        const models = embeddingService.getAvailableModels();
        return successResponse({ models });
      } catch (error) {
        return handleError(error, 'model:list-available', 'Failed to list models');
      }
    }
  );

  // ============================================================================
  // embedding:warmup - Pre-download/warm up a model
  // ============================================================================
  ipcMain.handle(
    'embedding:warmup',
    async (_, requestData): Promise<IpcResponse<{ success: boolean }>> => {
      try {
        const config = EmbeddingConfigSchema.parse(requestData);
        const result = await embeddingService.warmupModel(config);

        if (!result.success) {
          return errorResponse(result.error || 'Failed to warm up model');
        }

        return successResponse({ success: true });
      } catch (error) {
        return handleError(error, 'embedding:warmup', 'Failed to warm up model');
      }
    }
  );

  // ============================================================================
  // embedding:is-ready - Check if a model is ready (cached/downloaded)
  // ============================================================================
  ipcMain.handle(
    'embedding:is-ready',
    async (_, requestData): Promise<IpcResponse<{ ready: boolean }>> => {
      try {
        const config = EmbeddingConfigSchema.parse(requestData);

        if (config.provider === 'openai') {
          // For OpenAI, check if API key exists
          const hasKey = await embeddingService.hasOpenAIApiKey();
          return successResponse({ ready: hasKey });
        }

        // For local models, check if already cached
        const ready = embeddingService.isModelReady(config);
        return successResponse({ ready });
      } catch (error) {
        return handleError(error, 'embedding:is-ready', 'Failed to check model status');
      }
    }
  );

  console.log('Embedding IPC handlers registered');
}
