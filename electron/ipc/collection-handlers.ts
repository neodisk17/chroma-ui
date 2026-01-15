import { ipcMain } from 'electron';
import {
  CreateCollectionRequestSchema,
  UpdateCollectionRequestSchema,
  DeleteCollectionRequestSchema,
  GetCollectionRequestSchema,
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
      if (request.embeddingFunction && request.embeddingFunction !== 'default') {
        metadata['embedding_function'] = request.embeddingFunction;
      }

      const collection = await client.createCollection({
        name: request.name,
        metadata: { ...metadata, created_at: new Date().toISOString() },
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

  console.log('Collection IPC handlers registered');
}
