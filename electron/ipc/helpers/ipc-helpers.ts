import { connectionManager } from '../../services/connection-manager';
import type { Metadata } from '../../../src/types/chromadb.types';
import { Collection, MetadataFilter, DocumentFilter } from '../../../shared/schemas';

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
  name: string
) {
  const collection = await client.getCollection({ name });
  if (!collection) {
    return { collection: null, error: errorResponse(`Collection '${name}' not found`) };
  }
  return { collection, error: null };
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
export function buildWhereClause(metadataFilters?: MetadataFilter[]): any {
  if (!metadataFilters || metadataFilters.length === 0) return undefined;

  const where: Record<string, Record<string, string | number | (string | number)[]>> = {};
  metadataFilters.forEach((filter) => {
    where[filter.field] = { [filter.operator]: filter.value };
  });
  return where;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildWhereDocumentClause(documentFilters?: DocumentFilter[]): any {
  if (!documentFilters || documentFilters.length === 0) return undefined;

  const whereDocument: Record<string, Record<string, string>> = {};
  documentFilters.forEach((filter, index) => {
    whereDocument[`condition_${index}`] = { [filter.operator]: filter.value };
  });
  return whereDocument;
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
