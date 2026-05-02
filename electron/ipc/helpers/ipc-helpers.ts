import type { EmbeddingFunction } from 'chromadb';
import { z } from 'zod';
import { connectionManager } from '../../services/connection-manager';
import { embeddingService } from '../../services/embedding-service';
import type { Metadata } from '../../../src/types/chromadb.types';
import { Collection, MetadataFilter, DocumentFilter, EmbeddingConfigSchema } from '../../../shared/schemas';

// ChromaDB result types
export type IncludeOption = 'documents' | 'metadatas' | 'embeddings';

export interface ChromaDBGetResult {
  ids: string[];
  documents?: (string | null)[];
  metadatas?: (Metadata | null)[];
  embeddings?: (number[] | null)[];
}

export interface ChromaDBQueryResult {
  ids: string[][];
  documents?: (string | null)[][];
  metadatas?: (Metadata | null)[][];
  distances?: (number | undefined)[][];
}

// Response types
export type SuccessResponse<T> = { success: true; data: T };
export type ErrorResponse = { success: false; error: string };
export type IpcResponse<T> = SuccessResponse<T> | ErrorResponse;

// ============================================================================
// Helper Functions
// ============================================================================

export function errorResponse(error: string): ErrorResponse {
  return { success: false, error };
}

export function successResponse<T>(data: T): SuccessResponse<T> {
  return { success: true, data };
}

const NO_CONNECTION_ERROR = 'No active connection. Please connect to a ChromaDB instance first.';

export function getClientOrError() {
  const client = connectionManager.getActiveClient();
  if (!client) {
    return { client: null, error: errorResponse(NO_CONNECTION_ERROR) };
  }
  return { client, error: null };
}

export async function getCollectionOrError(
  client: NonNullable<ReturnType<typeof connectionManager.getActiveClient>>,
  name: string,
  embeddingFunction?: EmbeddingFunction
) {
  const collection = await client.getCollection({ name, embeddingFunction });
  if (!collection) {
    return { collection: null, error: errorResponse(`Collection '${name}' not found`) };
  }
  return { collection, error: null };
}

/**
 * Result from attempting to reconstruct embedding function from collection metadata
 */
export interface EmbeddingFunctionResult {
  embeddingFunction?: EmbeddingFunction;
  status: 'success' | 'missing_config' | 'invalid_config' | 'error';
  errorMessage?: string;
  config?: z.infer<typeof EmbeddingConfigSchema>;
}

/**
 * Reconstructs the embedding function from collection metadata.
 * ChromaDB does not persist embedding functions - they must be recreated
 * from the stored configuration when retrieving collections.
 * Passes collection name to enable collection-specific key resolution.
 */
export async function getEmbeddingFunctionFromMetadata(
  client: NonNullable<ReturnType<typeof connectionManager.getActiveClient>>,
  collectionName: string
): Promise<EmbeddingFunctionResult> {
  try {
    // Get collection without embedding function to read metadata
    const collection = await client.getCollection({ name: collectionName });
    const embeddingConfigStr = collection.metadata?.['embedding_config'];

    if (!embeddingConfigStr) {
      return {
        status: 'missing_config',
        errorMessage: `Collection '${collectionName}' does not have an embedding configuration`,
      };
    }

    if (typeof embeddingConfigStr !== 'string') {
      return {
        status: 'invalid_config',
        errorMessage: 'Embedding config is not a string',
      };
    }

    try {
      const config = EmbeddingConfigSchema.parse(JSON.parse(embeddingConfigStr));
      // Pass collection name to enable collection-specific key fallback
      const embeddingFunction = await embeddingService.createEmbeddingFunction(config, collectionName);
      return {
        embeddingFunction,
        config,
        status: 'success',
      };
    } catch (parseError) {
      return {
        status: 'invalid_config',
        errorMessage: `Failed to parse embedding config: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
      };
    }
  } catch (error) {
    return {
      status: 'error',
      errorMessage: `Failed to retrieve collection metadata: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

function isNotFoundError(error: unknown): boolean {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();
  return lowerMessage.includes('not found') || lowerMessage.includes('does not exist');
}

export function handleError(
  error: unknown,
  handlerName: string,
  defaultMessage: string,
  notFoundEntity?: string
): ErrorResponse {
  console.error(`${handlerName} error:`, error);

  if (notFoundEntity && isNotFoundError(error)) {
    return errorResponse(`The ${notFoundEntity} does not exist`);
  }

  return errorResponse(error instanceof Error ? error.message : defaultMessage);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildWhereClause(metadataFilters?: MetadataFilter[], logicalOp: '$and' | '$or' = '$and'): any {
  if (!metadataFilters || metadataFilters.length === 0) return undefined;

  const conditions = metadataFilters.map(f => ({ [f.field]: { [f.operator]: f.value } }));
  return conditions.length === 1 ? conditions[0] : { [logicalOp]: conditions };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildWhereDocumentClause(documentFilters?: DocumentFilter[], logicalOp: '$and' | '$or' = '$and'): any {
  if (!documentFilters || documentFilters.length === 0) return undefined;

  if (documentFilters.length === 1) return { [documentFilters[0].operator]: documentFilters[0].value };
  return { [logicalOp]: documentFilters.map(f => ({ [f.operator]: f.value })) };
}

export function formatCollection(
  collection: { name: string; id: string; metadata?: Record<string, unknown> | null },
  count: number
): Collection {
  return {
    name: collection.name,
    id: collection.id,
    metadata: (collection.metadata || {}) as Metadata,
    count,
  };
}
