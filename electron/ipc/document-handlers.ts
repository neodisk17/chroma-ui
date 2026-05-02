import { ipcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import {
  QueryDocumentsRequestSchema,
  QueryDocumentsResponse,
  GetDocumentRequestSchema,
  Document,
  ExecuteQueryRequestSchema,
  ExecuteQueryResponse,
  AddDocumentRequestSchema,
  UpdateDocumentRequestSchema,
  DeleteDocumentsRequestSchema,
  BulkImportRequestSchema,
  BulkImportResponse,
} from '../../shared/schemas';
import type { Metadata } from '../../src/types/chromadb.types';
import {
  IpcResponse,
  IncludeOption,
  ChromaDBGetResult,
  ChromaDBQueryResult,
  errorResponse,
  successResponse,
  getClientOrError,
  getCollectionOrError,
  getEmbeddingFunctionFromMetadata,
  handleError,
  buildWhereClause,
  buildWhereDocumentClause,
} from './helpers/ipc-helpers';

/**
 * Register document-related IPC handlers
 */
export function registerDocumentHandlers(): void {
  // ============================================================================
  // document:query - Query documents from a collection (with pagination)
  // ============================================================================
  ipcMain.handle('document:query', async (_, requestData): Promise<IpcResponse<QueryDocumentsResponse>> => {
    try {
      const request = QueryDocumentsRequestSchema.parse(requestData);
      const { client, error: clientError } = getClientOrError();
      if (clientError) return clientError;

      const { collection, error: collectionError } = await getCollectionOrError(client, request.collectionName);
      if (collectionError) return collectionError;

      const include: IncludeOption[] = ['documents', 'metadatas'];
      if (request.includeEmbeddings) {
        include.push('embeddings');
      }

      const isSearching = !!request.searchQuery?.trim();

      if (isSearching) {
        const query = request.searchQuery!.trim();
        const field = request.searchField || 'all';

        // Build whereDocument filter for document-content search
        const whereDocument = (field === 'document' || field === 'all')
          ? { $contains: query }
          : undefined;

        // For ID search, pass the query as an ids filter (exact match)
        const ids = field === 'id' ? [query] : undefined;

        const results = await collection.get({
          ...(ids ? { ids } : {}),
          ...(whereDocument ? { whereDocument } : {}),
          include,
        });

        // When searching, total = number of matching results (no separate count needed)
        const matchingIds = results.ids || [];
        const total = matchingIds.length;

        // Apply pagination over the filtered results in-process
        const start = request.offset;
        const end = start + request.limit;

        return successResponse({
          ids: matchingIds.slice(start, end),
          documents: (results.documents || []).slice(start, end),
          metadatas: (results.metadatas || []).slice(start, end),
          embeddings: request.includeEmbeddings ? ((results.embeddings || []).slice(start, end)) : null,
          total,
        });
      }

      const total = await collection.count();
      const results = await collection.get({
        limit: request.limit,
        offset: request.offset,
        include,
      });

      return successResponse({
        ids: results.ids || [],
        documents: results.documents || [],
        metadatas: results.metadatas || [],
        embeddings: request.includeEmbeddings ? (results.embeddings || []) : null,
        total,
      });
    } catch (error) {
      const collectionName = typeof requestData === 'object' && requestData !== null && 'collectionName' in requestData
        ? (requestData as { collectionName: unknown }).collectionName
        : 'unknown';
      return handleError(error, 'document:query', 'Failed to query documents', `collection '${collectionName}'`);
    }
  });

  // ============================================================================
  // document:get - Get a single document by ID
  // ============================================================================
  ipcMain.handle('document:get', async (_, requestData): Promise<IpcResponse<Document>> => {
    try {
      const request = GetDocumentRequestSchema.parse(requestData);
      const { client, error: clientError } = getClientOrError();
      if (clientError) return clientError;

      const { collection, error: collectionError } = await getCollectionOrError(client, request.collectionName);
      if (collectionError) return collectionError;

      const results = await collection.get({
        ids: [request.documentId],
        include: ['documents', 'metadatas', 'embeddings'] as IncludeOption[],
      });

      if (!results.ids || results.ids.length === 0) {
        return errorResponse(`Document '${request.documentId}' not found in collection '${request.collectionName}'`);
      }

      return successResponse({
        id: results.ids[0],
        document: results.documents?.[0] || null,
        metadata: results.metadatas?.[0] || null,
        embedding: results.embeddings?.[0] || null,
      });
    } catch (error) {
      return handleError(error, 'document:get', 'Failed to get document', 'document or collection');
    }
  });

  // ============================================================================
  // query:execute - Execute a query on a collection
  // ============================================================================
  ipcMain.handle('query:execute', async (_, requestData): Promise<IpcResponse<ExecuteQueryResponse>> => {
    try {
      const request = ExecuteQueryRequestSchema.parse(requestData);
      const { client, error: clientError } = getClientOrError();
      if (clientError) return clientError;

      // For text-based similarity queries, we need the embedding function
      // to convert the query text to an embedding vector
      const needsEmbeddingFunction =
        (request.queryType === 'similarity' || request.queryType === 'combined') &&
        request.queryText &&
        !request.embeddingVector;

      let embeddingFunction;
      if (needsEmbeddingFunction) {
        const embeddingResult = await getEmbeddingFunctionFromMetadata(client, request.collectionName);

        if (embeddingResult.status !== 'success') {
          if (embeddingResult.status === 'missing_config') {
            return errorResponse(
              `Cannot execute text query without embedding configuration.\n\n` +
              `Collection '${request.collectionName}' was created without an embedding configuration.\n\n` +
              `To fix this, you must either:\n` +
              `  1. Provide a pre-computed embedding vector for your query, or\n` +
              `  2. Create a new collection with an embedding configuration (OpenAI, HuggingFace, etc.)`
            );
          }

          return errorResponse(
            `Cannot generate query embedding: ${embeddingResult.errorMessage || 'Unknown error'}`
          );
        }

        embeddingFunction = embeddingResult.embeddingFunction;
      }

      const { collection, error: collectionError } = await getCollectionOrError(
        client,
        request.collectionName,
        embeddingFunction
      );
      if (collectionError) return collectionError;

      let results: ChromaDBQueryResult | undefined;
      const where = buildWhereClause(request.metadataFilters, request.metadataLogicalOperator);
      const whereDocument = buildWhereDocumentClause(request.documentFilters, request.documentLogicalOperator);

      if (request.queryType === 'similarity' || request.queryType === 'combined') {
        if (!request.queryText && !request.embeddingVector) {
          return errorResponse('Query text or embedding vector is required for similarity search');
        }

        if (request.queryText) {
          results = await collection.query({
            queryTexts: [request.queryText],
            nResults: request.nResults,
            where,
            whereDocument,
          }) as ChromaDBQueryResult;
        } else if (request.embeddingVector) {
          results = await collection.query({
            queryEmbeddings: [request.embeddingVector],
            nResults: request.nResults,
            where,
            whereDocument,
          }) as ChromaDBQueryResult;
        }
      } else if (request.queryType === 'filter') {
        const getResults = await collection.get({
          where,
          whereDocument,
          limit: request.nResults,
        }) as ChromaDBGetResult;

        // Transform get() results to match query() format
        results = {
          ids: [getResults.ids],
          documents: getResults.documents ? [getResults.documents] : undefined,
          metadatas: getResults.metadatas ? [getResults.metadatas] : undefined,
          distances: [getResults.ids.map(() => undefined)],
        };
      }

      // Format results
      const formattedResults: ExecuteQueryResponse = { results: [], count: 0 };

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

      return successResponse(formattedResults);
    } catch (error) {
      const collectionName = typeof requestData === 'object' && requestData !== null && 'collectionName' in requestData
        ? (requestData as { collectionName: unknown }).collectionName
        : 'unknown';
      return handleError(error, 'query:execute', 'Failed to execute query', `collection '${collectionName}'`);
    }
  });

  // ============================================================================
  // document:add - Add a document to a collection
  // ============================================================================
  ipcMain.handle('document:add', async (_, requestData): Promise<IpcResponse<{ documentId: string }>> => {
    try {
      const request = AddDocumentRequestSchema.parse(requestData);
      const { client, error: clientError } = getClientOrError();
      if (clientError) return clientError;

      // If no embedding is provided, we need to reconstruct the embedding function
      // to auto-generate embeddings from the document text
      let embeddingFunction;
      if (!request.embedding) {
        const embeddingResult = await getEmbeddingFunctionFromMetadata(client, request.collectionName);

        if (embeddingResult.status !== 'success') {
          if (embeddingResult.status === 'missing_config') {
            return errorResponse(
              `Cannot add document without embedding.\n\n` +
              `Collection '${request.collectionName}' was created without an embedding configuration.\n\n` +
              `To fix this, you must either:\n` +
              `  1. Provide a pre-computed embedding array, or\n` +
              `  2. Create a new collection with an embedding configuration (OpenAI, HuggingFace, etc.)`
            );
          }

          return errorResponse(
            `Cannot generate embedding: ${embeddingResult.errorMessage || 'Unknown error'}`
          );
        }

        embeddingFunction = embeddingResult.embeddingFunction;
      }

      const { collection, error: collectionError } = await getCollectionOrError(
        client,
        request.collectionName,
        embeddingFunction
      );
      if (collectionError) return collectionError;

      const documentId = request.id || uuidv4();
      await collection.add({
        ids: [documentId],
        documents: [request.document],
        metadatas: request.metadata ? [request.metadata] : undefined,
        embeddings: request.embedding ? [request.embedding] : undefined,
      });

      return successResponse({ documentId });
    } catch (error) {
      return handleError(error, 'document:add', 'Failed to add document');
    }
  });

  // ============================================================================
  // document:update - Update a document
  // ============================================================================
  ipcMain.handle('document:update', async (_, requestData): Promise<IpcResponse<{ documentId: string }>> => {
    try {
      const request = UpdateDocumentRequestSchema.parse(requestData);
      const { client, error: clientError } = getClientOrError();
      if (clientError) return clientError;

      // If document text is being updated without a new embedding,
      // we need the embedding function to regenerate the embedding
      let embeddingFunction;
      if (request.document && !request.embedding) {
        const embeddingResult = await getEmbeddingFunctionFromMetadata(client, request.collectionName);

        if (embeddingResult.status !== 'success') {
          if (embeddingResult.status === 'missing_config') {
            return errorResponse(
              `Cannot update document without embedding.\n\n` +
              `Collection '${request.collectionName}' was created without an embedding configuration.\n\n` +
              `To fix this, you must either:\n` +
              `  1. Provide a pre-computed embedding array, or\n` +
              `  2. Create a new collection with an embedding configuration (OpenAI, HuggingFace, etc.)`
            );
          }

          return errorResponse(
            `Cannot generate embedding: ${embeddingResult.errorMessage || 'Unknown error'}`
          );
        }

        embeddingFunction = embeddingResult.embeddingFunction;
      }

      const { collection, error: collectionError } = await getCollectionOrError(
        client,
        request.collectionName,
        embeddingFunction
      );
      if (collectionError) return collectionError;

      await collection.update({
        ids: [request.documentId],
        documents: request.document ? [request.document] : undefined,
        metadatas: request.metadata ? [request.metadata] : undefined,
        embeddings: request.embedding ? [request.embedding] : undefined,
      });

      return successResponse({ documentId: request.documentId });
    } catch (error) {
      return handleError(error, 'document:update', 'Failed to update document');
    }
  });

  // ============================================================================
  // document:delete - Delete documents from a collection
  // ============================================================================
  ipcMain.handle('document:delete', async (_, requestData): Promise<IpcResponse<{ deletedCount: number }>> => {
    try {
      const request = DeleteDocumentsRequestSchema.parse(requestData);
      const { client, error: clientError } = getClientOrError();
      if (clientError) return clientError;

      const { collection, error: collectionError } = await getCollectionOrError(client, request.collectionName);
      if (collectionError) return collectionError;

      await collection.delete({ ids: request.documentIds });
      return successResponse({ deletedCount: request.documentIds.length });
    } catch (error) {
      return handleError(error, 'document:delete', 'Failed to delete documents');
    }
  });

  // ============================================================================
  // document:bulk-import - Bulk import documents
  // ============================================================================
  ipcMain.handle('document:bulk-import', async (_, requestData): Promise<IpcResponse<BulkImportResponse>> => {
    try {
      const request = BulkImportRequestSchema.parse(requestData);
      const { client, error: clientError } = getClientOrError();
      if (clientError) return clientError;

      // Check if any documents are missing embeddings
      const hasDocumentWithoutEmbedding = request.documents.some((doc) => !doc.embedding);

      // If any document is missing an embedding, we need the embedding function
      let embeddingFunction;
      if (hasDocumentWithoutEmbedding) {
        const embeddingResult = await getEmbeddingFunctionFromMetadata(client, request.collectionName);

        if (embeddingResult.status !== 'success') {
          const docsNeedingEmbeddings = request.documents.filter(d => !d.embedding).length;

          if (embeddingResult.status === 'missing_config') {
            return errorResponse(
              `Cannot import ${docsNeedingEmbeddings} documents without embeddings.\n\n` +
              `Collection '${request.collectionName}' was created without an embedding configuration.\n\n` +
              `To fix this, you must either:\n` +
              `  1. Add pre-computed embeddings to all documents in your import file, or\n` +
              `  2. Create a new collection with an embedding configuration (OpenAI, HuggingFace, etc.)`
            );
          }

          return errorResponse(
            `Cannot generate embeddings: ${embeddingResult.errorMessage || 'Unknown error'}`
          );
        }

        embeddingFunction = embeddingResult.embeddingFunction;
      }

      const { collection, error: collectionError } = await getCollectionOrError(
        client,
        request.collectionName,
        embeddingFunction
      );
      if (collectionError) return collectionError;

      const ids: string[] = [];
      const documents: string[] = [];
      const metadatas: Metadata[] = [];
      const embeddings: number[][] = [];
      const errors: string[] = [];
      let importedCount = 0;
      let failedCount = 0;

      for (const doc of request.documents) {
        try {
          ids.push(doc.id || uuidv4());
          documents.push(doc.document);
          metadatas.push(doc.metadata || {});
          if (doc.embedding) embeddings.push(doc.embedding);
        } catch (err) {
          failedCount++;
          errors.push(`Failed to process document: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      if (ids.length > 0) {
        try {
          await collection.add({
            ids,
            documents,
            metadatas,
            embeddings: embeddings.length > 0 ? embeddings : undefined,
          });
          importedCount = ids.length;
        } catch (err) {
          failedCount = ids.length;
          errors.push(`Bulk import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      return successResponse({
        importedCount,
        failedCount,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      return handleError(error, 'document:bulk-import', 'Failed to import documents');
    }
  });

  console.log('Document IPC handlers registered');
}
