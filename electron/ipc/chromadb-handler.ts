import { ipcMain } from 'electron';
import {
  CreateCollectionRequestSchema,
  UpdateCollectionRequestSchema,
  DeleteCollectionRequestSchema,
  GetCollectionRequestSchema,
  Collection,
  QueryDocumentsRequestSchema,
  QueryDocumentsResponse,
  GetDocumentRequestSchema,
  Document,
  ExecuteQueryRequestSchema,
  ExecuteQueryResponse,
} from '../../shared/schemas';
import { connectionManager } from '../services/connection-manager';

/**
 * Register all ChromaDB collection-related IPC handlers
 *
 * REQUIREMENTS:
 * - All operations use the active connection from connectionManager
 * - All inputs are validated with Zod schemas
 * - Returns consistent error format: { success: boolean, data?: any, error?: string }
 */
export function registerChromaDBHandlers(): void {
  // ============================================================================
  // collection:list - Get all collections
  // ============================================================================
  ipcMain.handle('collection:list', async () => {
    try {
      const client = connectionManager.getActiveClient();

      if (!client) {
        return {
          success: false,
          error: 'No active connection. Please connect to a ChromaDB instance first.',
        };
      }

      // Get all collections from ChromaDB
      const collections = await client.listCollections();

      // Transform to our Collection schema
      const formattedCollections: Collection[] = await Promise.all(
        collections.map(async (collection) => {
          try {
            const count = await collection.count();
            return {
              name: collection.name,
              id: collection.id,
              metadata: collection.metadata || {},
              count,
            };
          } catch (error) {
            console.warn(`Failed to get count for collection ${collection.name}:`, error);
            return {
              name: collection.name,
              id: collection.id,
              metadata: collection.metadata || {},
              count: 0,
            };
          }
        })
      );

      return {
        success: true,
        data: formattedCollections,
      };
    } catch (error) {
      console.error('collection:list error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list collections',
      };
    }
  });

  // ============================================================================
  // collection:get - Get collection by name (with metadata)
  // ============================================================================
  ipcMain.handle('collection:get', async (_, requestData) => {
    try {
      // Validate input
      const request = GetCollectionRequestSchema.parse(requestData);

      const client = connectionManager.getActiveClient();

      if (!client) {
        return {
          success: false,
          error: 'No active connection. Please connect to a ChromaDB instance first.',
        };
      }

      // Get collection from ChromaDB
      const collection = await client.getCollection({ name: request.name });

      if (!collection) {
        return {
          success: false,
          error: `Collection '${request.name}' not found`,
        };
      }

      // Get document count
      const count = await collection.count();

      const formattedCollection: Collection = {
        name: collection.name,
        id: collection.id,
        metadata: collection.metadata || {},
        count,
      };

      return {
        success: true,
        data: formattedCollection,
      };
    } catch (error) {
      console.error('collection:get error:', error);

      // Check if it's a "not found" error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.toLowerCase().includes('not found') || errorMessage.toLowerCase().includes('does not exist')) {
        return {
          success: false,
          error: `The collection '${(requestData as any).name}' does not exist`,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get collection',
      };
    }
  });

  // ============================================================================
  // collection:create - Create new collection
  // ============================================================================
  ipcMain.handle('collection:create', async (_, requestData) => {
    try {
      // Validate input
      const request = CreateCollectionRequestSchema.parse(requestData);

      const client = connectionManager.getActiveClient();

      if (!client) {
        return {
          success: false,
          error: 'No active connection. Please connect to a ChromaDB instance first.',
        };
      }

      // Check if collection already exists
      try {
        const existing = await client.getCollection({ name: request.name });
        if (existing) {
          return {
            success: false,
            error: `Collection with name '${request.name}' already exists`,
          };
        }
      } catch (error) {
        // Collection doesn't exist, which is what we want
      }

      // Create collection
      const collection = await client.createCollection({
        name: request.name,
        metadata: request.metadata || {},
      });

      const formattedCollection: Collection = {
        name: collection.name,
        id: collection.id,
        metadata: collection.metadata || {},
        count: 0,
      };

      return {
        success: true,
        data: formattedCollection,
      };
    } catch (error) {
      console.error('collection:create error:', error);

      // Check for duplicate name error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.toLowerCase().includes('already exists') || errorMessage.toLowerCase().includes('duplicate')) {
        return {
          success: false,
          error: `Collection with name '${(requestData as any).name}' already exists`,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create collection',
      };
    }
  });

  // ============================================================================
  // collection:update - Update collection metadata
  // ============================================================================
  ipcMain.handle('collection:update', async (_, requestData) => {
    try {
      // Validate input
      const request = UpdateCollectionRequestSchema.parse(requestData);

      const client = connectionManager.getActiveClient();

      if (!client) {
        return {
          success: false,
          error: 'No active connection. Please connect to a ChromaDB instance first.',
        };
      }

      // Get collection
      const collection = await client.getCollection({ name: request.name });

      if (!collection) {
        return {
          success: false,
          error: `Collection '${request.name}' not found`,
        };
      }

      // Update metadata (ChromaDB collections have immutable names)
      await collection.modify({
        metadata: request.metadata || {},
      });

      // Get updated collection
      const updated = await client.getCollection({ name: request.name });
      const count = await updated.count();

      const formattedCollection: Collection = {
        name: updated.name,
        id: updated.id,
        metadata: updated.metadata || {},
        count,
      };

      return {
        success: true,
        data: formattedCollection,
      };
    } catch (error) {
      console.error('collection:update error:', error);

      // Check if it's a "not found" error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.toLowerCase().includes('not found') || errorMessage.toLowerCase().includes('does not exist')) {
        return {
          success: false,
          error: `The collection '${(requestData as any).name}' does not exist`,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update collection',
      };
    }
  });

  // ============================================================================
  // collection:delete - Delete collection
  // ============================================================================
  ipcMain.handle('collection:delete', async (_, requestData) => {
    try {
      // Validate input
      const request = DeleteCollectionRequestSchema.parse(requestData);

      const client = connectionManager.getActiveClient();

      if (!client) {
        return {
          success: false,
          error: 'No active connection. Please connect to a ChromaDB instance first.',
        };
      }

      // Delete collection
      await client.deleteCollection({ name: request.name });

      return {
        success: true,
        data: { deletedName: request.name },
      };
    } catch (error) {
      console.error('collection:delete error:', error);

      // Check if it's a "not found" error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.toLowerCase().includes('not found') || errorMessage.toLowerCase().includes('does not exist')) {
        return {
          success: false,
          error: `The collection '${(requestData as any).name}' does not exist`,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete collection',
      };
    }
  });

  // ============================================================================
  // document:query - Query documents from a collection (with pagination)
  // ============================================================================
  ipcMain.handle('document:query', async (_, requestData) => {
    try {
      // Validate input
      const request = QueryDocumentsRequestSchema.parse(requestData);

      const client = connectionManager.getActiveClient();

      if (!client) {
        return {
          success: false,
          error: 'No active connection. Please connect to a ChromaDB instance first.',
        };
      }

      // Get collection
      const collection = await client.getCollection({ name: request.collectionName });

      if (!collection) {
        return {
          success: false,
          error: `Collection '${request.collectionName}' not found`,
        };
      }

      // Get total count
      const total = await collection.count();

      // Query documents with pagination
      // ChromaDB's get() method supports limit and offset
      const results = await collection.get({
        limit: request.limit,
        offset: request.offset,
        include: ['documents', 'metadatas', 'embeddings'] as any,
      });

      const response: QueryDocumentsResponse = {
        ids: results.ids || [],
        documents: results.documents || [],
        metadatas: results.metadatas || [],
        embeddings: results.embeddings || null,
        total,
      };

      return {
        success: true,
        data: response,
      };
    } catch (error) {
      console.error('document:query error:', error);

      // Check if it's a "not found" error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.toLowerCase().includes('not found') || errorMessage.toLowerCase().includes('does not exist')) {
        return {
          success: false,
          error: `The collection '${(requestData as any).collectionName}' does not exist`,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to query documents',
      };
    }
  });

  // ============================================================================
  // document:get - Get a single document by ID
  // ============================================================================
  ipcMain.handle('document:get', async (_, requestData) => {
    try {
      // Validate input
      const request = GetDocumentRequestSchema.parse(requestData);

      const client = connectionManager.getActiveClient();

      if (!client) {
        return {
          success: false,
          error: 'No active connection. Please connect to a ChromaDB instance first.',
        };
      }

      // Get collection
      const collection = await client.getCollection({ name: request.collectionName });

      if (!collection) {
        return {
          success: false,
          error: `Collection '${request.collectionName}' not found`,
        };
      }

      // Get document by ID
      const results = await collection.get({
        ids: [request.documentId],
        include: ['documents', 'metadatas', 'embeddings'] as any,
      });

      // Check if document was found
      if (!results.ids || results.ids.length === 0) {
        return {
          success: false,
          error: `Document '${request.documentId}' not found in collection '${request.collectionName}'`,
        };
      }

      const document: Document = {
        id: results.ids[0],
        document: results.documents?.[0] || null,
        metadata: results.metadatas?.[0] || null,
        embedding: results.embeddings?.[0] || null,
      };

      return {
        success: true,
        data: document,
      };
    } catch (error) {
      console.error('document:get error:', error);

      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.toLowerCase().includes('not found') || errorMessage.toLowerCase().includes('does not exist')) {
        return {
          success: false,
          error: `Document or collection not found`,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get document',
      };
    }
  });

  // ============================================================================
  // query:execute - Execute a query on a collection
  // ============================================================================
  ipcMain.handle('query:execute', async (_, requestData) => {
    try {
      // Validate input
      const request = ExecuteQueryRequestSchema.parse(requestData);

      const client = connectionManager.getActiveClient();

      if (!client) {
        return {
          success: false,
          error: 'No active connection. Please connect to a ChromaDB instance first.',
        };
      }

      // Get collection
      const collection = await client.getCollection({ name: request.collectionName });

      if (!collection) {
        return {
          success: false,
          error: `Collection '${request.collectionName}' not found`,
        };
      }

      // Build query based on type
      let results: any;

      if (request.queryType === 'similarity' || request.queryType === 'combined') {
        // Similarity search with optional filters
        if (!request.queryText && !request.embeddingVector) {
          return {
            success: false,
            error: 'Query text or embedding vector is required for similarity search',
          };
        }

        // Build where clause from metadata filters
        let where: any = undefined;
        if (request.metadataFilters && request.metadataFilters.length > 0) {
          where = {};
          request.metadataFilters.forEach((filter) => {
            where[filter.field] = { [filter.operator]: filter.value };
          });
        }

        // Build whereDocument clause from document filters
        let whereDocument: any = undefined;
        if (request.documentFilters && request.documentFilters.length > 0) {
          whereDocument = {};
          request.documentFilters.forEach((filter, index) => {
            whereDocument[`condition_${index}`] = { [filter.operator]: filter.value };
          });
        }

        // Execute query
        if (request.queryText) {
          // Query with text
          results = await collection.query({
            queryTexts: [request.queryText],
            nResults: request.nResults,
            where,
            whereDocument,
          });
        } else if (request.embeddingVector) {
          // Query with embedding
          results = await collection.query({
            queryEmbeddings: [request.embeddingVector],
            nResults: request.nResults,
            where,
            whereDocument,
          });
        }
      } else if (request.queryType === 'filter') {
        // Filter-only query (no similarity search)
        let where: any = undefined;
        if (request.metadataFilters && request.metadataFilters.length > 0) {
          where = {};
          request.metadataFilters.forEach((filter) => {
            where[filter.field] = { [filter.operator]: filter.value };
          });
        }

        let whereDocument: any = undefined;
        if (request.documentFilters && request.documentFilters.length > 0) {
          whereDocument = {};
          request.documentFilters.forEach((filter, index) => {
            whereDocument[`condition_${index}`] = { [filter.operator]: filter.value };
          });
        }

        // Use get() instead of query() for filter-only
        results = await collection.get({
          where,
          whereDocument,
          limit: request.nResults,
        });

        // Transform get() results to match query() format
        results = {
          ids: [results.ids],
          documents: [results.documents],
          metadatas: [results.metadatas],
          distances: [results.ids.map(() => undefined)], // No distances for filter-only queries
        };
      }

      // Format results
      const formattedResults: ExecuteQueryResponse = {
        results: [],
        count: 0,
      };

      if (results && results.ids && results.ids[0]) {
        const ids = results.ids[0];
        const documents = results.documents?.[0] || [];
        const metadatas = results.metadatas?.[0] || [];
        const distances = results.distances?.[0] || [];

        formattedResults.results = ids.map((id: string, index: number) => ({
          id,
          document: documents[index] || null,
          metadata: metadatas[index] || null,
          distance: distances[index],
        }));
        formattedResults.count = ids.length;
      }

      return {
        success: true,
        data: formattedResults,
      };
    } catch (error) {
      console.error('query:execute error:', error);

      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.toLowerCase().includes('not found') || errorMessage.toLowerCase().includes('does not exist')) {
        return {
          success: false,
          error: `The collection '${(requestData as any).collectionName}' does not exist`,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute query',
      };
    }
  });

  console.log('ChromaDB IPC handlers registered');
}
