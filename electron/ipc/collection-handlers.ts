import { ipcMain } from 'electron';
import {
  CreateCollectionRequestSchema,
  UpdateCollectionRequestSchema,
  DeleteCollectionRequestSchema,
  GetCollectionRequestSchema,
  EmbeddingConfigSchema,
  Collection,
} from '../../shared/schemas';
import {
  IpcResponse,
  errorResponse,
  successResponse,
  getClientOrError,
  getCollectionOrError,
  handleError,
  formatCollection,
} from './helpers/ipc-helpers';
import { embeddingService } from '../services/embedding-service';

/**
 * Register collection-related IPC handlers
 */
export function registerCollectionHandlers(): void {
  // ============================================================================
  // collection:list - Get all collections
  // ============================================================================
  ipcMain.handle('collection:list', async (): Promise<IpcResponse<Collection[]>> => {
    try {
      const { client, error } = getClientOrError();
      if (error) return error;

      const collections = await client.listCollections();

      const formattedCollections: Collection[] = await Promise.all(
        collections.map(async (collection) => {
          try {
            const count = await collection.count();
            return formatCollection(collection, count);
          } catch (err) {
            console.warn(`Failed to get count for collection ${collection.name}:`, err);
            return formatCollection(collection, 0);
          }
        })
      );

      return successResponse(formattedCollections);
    } catch (error) {
      return handleError(error, 'collection:list', 'Failed to list collections');
    }
  });

  // ============================================================================
  // collection:get - Get collection by name (with metadata)
  // ============================================================================
  ipcMain.handle('collection:get', async (_, requestData): Promise<IpcResponse<Collection>> => {
    try {
      const request = GetCollectionRequestSchema.parse(requestData);
      const { client, error: clientError } = getClientOrError();
      if (clientError) return clientError;

      const { collection, error: collectionError } = await getCollectionOrError(client, request.name);
      if (collectionError) return collectionError;

      const count = await collection.count();
      return successResponse(formatCollection(collection, count));
    } catch (error) {
      const name = typeof requestData === 'object' && requestData !== null && 'name' in requestData
        ? (requestData as { name: unknown }).name
        : 'unknown';
      return handleError(error, 'collection:get', 'Failed to get collection', `collection '${name}'`);
    }
  });

  // ============================================================================
  // collection:create - Create new collection
  // ============================================================================
  ipcMain.handle('collection:create', async (_, requestData): Promise<IpcResponse<Collection>> => {
    try {
      const request = CreateCollectionRequestSchema.parse(requestData);
      const { client, error } = getClientOrError();
      if (error) return error;

      // Check if collection already exists
      try {
        const existing = await client.getCollection({ name: request.name });
        if (existing) {
          return errorResponse(`Collection with name '${request.name}' already exists`);
        }
      } catch {
        // Collection doesn't exist, which is what we want
      }

      // Prepare metadata
      const metadata = request.metadata || {};
      if (request.distanceFunction) {
        metadata['hnsw:space'] = request.distanceFunction;
      }

      // Handle embedding function configuration
      let embeddingFunction = undefined;

      // New: Use full embedding configuration if provided
      if (request.embeddingConfig) {
        try {
          const config = EmbeddingConfigSchema.parse(request.embeddingConfig);
          // Pass collection name for collection-specific API key resolution
          embeddingFunction = await embeddingService.createEmbeddingFunction(config, request.name);

          // Store embedding config in metadata for reference
          metadata['embedding_config'] = JSON.stringify(config);
          metadata['embedding_provider'] = config.provider;
          // Also store the model for display purposes
          if ('model' in config) {
            metadata['embedding_model'] = config.model;
          }
        } catch (embeddingError) {
          const errMsg = embeddingError instanceof Error ? embeddingError.message : 'Unknown error';
          return errorResponse(`Failed to create embedding function: ${errMsg}`);
        }
      } else if (request.embeddingFunction && request.embeddingFunction !== 'default') {
        // Legacy: Store as metadata for backward compatibility
        metadata['embedding_function'] = request.embeddingFunction;
      }

      const collection = await client.createCollection({
        name: request.name,
        metadata: { ...metadata, created_at: new Date().toISOString() },
        embeddingFunction,
      });

      return successResponse(formatCollection(collection, 0));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.toLowerCase().includes('already exists') || errorMessage.toLowerCase().includes('duplicate')) {
        const name = typeof requestData === 'object' && requestData !== null && 'name' in requestData
          ? (requestData as { name: unknown }).name
          : 'unknown';
        return errorResponse(`Collection with name '${name}' already exists`);
      }
      return handleError(error, 'collection:create', 'Failed to create collection');
    }
  });

  // ============================================================================
  // collection:update - Update collection metadata
  // ============================================================================
  ipcMain.handle('collection:update', async (_, requestData): Promise<IpcResponse<Collection>> => {
    try {
      const request = UpdateCollectionRequestSchema.parse(requestData);
      const { client, error: clientError } = getClientOrError();
      if (clientError) return clientError;

      const { collection, error: collectionError } = await getCollectionOrError(client, request.name);
      if (collectionError) return collectionError;

      await collection.modify({ metadata: request.metadata || {} });

      // Get updated collection
      const updated = await client.getCollection({ name: request.name });
      const count = await updated.count();

      return successResponse(formatCollection(updated, count));
    } catch (error) {
      const name = typeof requestData === 'object' && requestData !== null && 'name' in requestData
        ? (requestData as { name: unknown }).name
        : 'unknown';
      return handleError(error, 'collection:update', 'Failed to update collection', `collection '${name}'`);
    }
  });

  // ============================================================================
  // collection:delete - Delete collection
  // ============================================================================
  ipcMain.handle('collection:delete', async (_, requestData): Promise<IpcResponse<{ deletedName: string }>> => {
    try {
      const request = DeleteCollectionRequestSchema.parse(requestData);
      const { client, error } = getClientOrError();
      if (error) return error;

      await client.deleteCollection({ name: request.name });
      return successResponse({ deletedName: request.name });
    } catch (error) {
      const name = typeof requestData === 'object' && requestData !== null && 'name' in requestData
        ? (requestData as { name: unknown }).name
        : 'unknown';
      return handleError(error, 'collection:delete', 'Failed to delete collection', `collection '${name}'`);
    }
  });

  // ============================================================================
  // collection:set-api-key - Store collection-specific OpenAI API key
  // ============================================================================
  ipcMain.handle('collection:set-api-key', async (_, requestData): Promise<IpcResponse<{ success: boolean }>> => {
    try {
      const { collectionName, apiKey } = requestData as { collectionName: string; apiKey: string };

      if (!collectionName || typeof collectionName !== 'string') {
        return errorResponse('Collection name is required');
      }
      if (!apiKey || typeof apiKey !== 'string') {
        return errorResponse('API key is required');
      }

      const { client, error: clientError } = getClientOrError();
      if (clientError) return clientError;

      // Store the API key
      await embeddingService.setCollectionOpenAIApiKey(collectionName, apiKey);

      // Update collection metadata to indicate it has its own key
      const { collection, error: collectionError } = await getCollectionOrError(client, collectionName);
      if (collectionError) return collectionError;

      const currentMetadata = collection.metadata || {};
      await collection.modify({
        metadata: {
          ...currentMetadata,
          has_own_openai_key: true,
        },
      });

      return successResponse({ success: true });
    } catch (error) {
      return handleError(error, 'collection:set-api-key', 'Failed to set collection API key');
    }
  });

  // ============================================================================
  // collection:get-api-key-status - Check collection-specific API key status
  // ============================================================================
  ipcMain.handle('collection:get-api-key-status', async (_, requestData): Promise<IpcResponse<{ hasKey: boolean; hasGlobalKey: boolean }>> => {
    try {
      const { collectionName } = requestData as { collectionName: string };

      if (!collectionName || typeof collectionName !== 'string') {
        return errorResponse('Collection name is required');
      }

      const hasKey = await embeddingService.hasCollectionOpenAIApiKey(collectionName);
      const hasGlobalKey = await embeddingService.hasOpenAIApiKey();

      return successResponse({ hasKey, hasGlobalKey });
    } catch (error) {
      return handleError(error, 'collection:get-api-key-status', 'Failed to check API key status');
    }
  });

  // ============================================================================
  // collection:delete-api-key - Delete collection-specific OpenAI API key
  // ============================================================================
  ipcMain.handle('collection:delete-api-key', async (_, requestData): Promise<IpcResponse<{ deleted: boolean }>> => {
    try {
      const { collectionName } = requestData as { collectionName: string };

      if (!collectionName || typeof collectionName !== 'string') {
        return errorResponse('Collection name is required');
      }

      const { client, error: clientError } = getClientOrError();
      if (clientError) return clientError;

      // Delete the API key
      const deleted = await embeddingService.deleteCollectionOpenAIApiKey(collectionName);

      // Update collection metadata to remove the flag
      try {
        const { collection, error: collectionError } = await getCollectionOrError(client, collectionName);
        if (!collectionError && collection) {
          const currentMetadata = collection.metadata || {};
          const { has_own_openai_key, ...restMetadata } = currentMetadata as Record<string, unknown>;
          await collection.modify({ metadata: restMetadata });
        }
      } catch (metadataError) {
        console.warn('Failed to update collection metadata after key deletion:', metadataError);
        // Don't fail the operation if metadata update fails
      }

      return successResponse({ deleted });
    } catch (error) {
      return handleError(error, 'collection:delete-api-key', 'Failed to delete collection API key');
    }
  });

  console.log('Collection IPC handlers registered');
}
