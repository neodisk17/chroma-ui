import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  Collection,
  CreateCollectionRequest,
  UpdateCollectionRequest,
  QueryDocumentsResponse,
  Document,
  ExecuteQueryRequest,
  ExecuteQueryResponse,
  AddDocumentRequest,
  UpdateDocumentRequest,
  DeleteDocumentsRequest,
  BulkImportRequest,
  BulkImportResponse,
} from '../../shared/schemas';
import { IPC_CHANNELS } from '../../shared/constants';
import { useQueryStore } from '@/stores/query-store';

// ============================================================================
// Query Keys
// ============================================================================

const QUERY_KEYS = {
  collections: () => ['collections'] as const,
  collection: (name: string) => ['collection', name] as const,
  documents: (collectionName: string, limit: number, offset: number, includeEmbeddings: boolean) =>
    ['documents', collectionName, limit, offset, includeEmbeddings] as const,
  document: (collectionName: string, documentId: string) =>
    ['document', collectionName, documentId] as const,
};

// ============================================================================
// Collection Queries
// ============================================================================

/**
 * Hook to query all collections
 * - Auto-refetches on window focus
 * - Caches for 5 minutes
 */
export function useCollections() {
  return useQuery({
    queryKey: QUERY_KEYS.collections(),
    queryFn: async (): Promise<Collection[]> => {
      const response = await window.electronAPI.invoke<Collection[]>(
        IPC_CHANNELS.COLLECTION_LIST
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch collections');
      }

      return response.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to query a single collection by name
 * @param name - Collection name
 */
export function useCollection(name: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.collection(name || ''),
    queryFn: async (): Promise<Collection | null> => {
      if (!name) {
        return null;
      }

      const response = await window.electronAPI.invoke<Collection>(
        IPC_CHANNELS.COLLECTION_GET,
        { name }
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch collection');
      }

      return response.data || null;
    },
    enabled: !!name, // Only run query if name is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================================================
// Collection Mutations
// ============================================================================

/**
 * Hook to create a new collection
 * - Shows success/error toasts
 * - Invalidates collections query on success
 * - Implements optimistic updates
 */
export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateCollectionRequest): Promise<Collection> => {
      const response = await window.electronAPI.invoke<Collection>(
        IPC_CHANNELS.COLLECTION_CREATE,
        request
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to create collection');
      }

      return response.data!;
    },
    onMutate: async (newCollection) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.collections() });

      // Snapshot the previous value
      const previousCollections = queryClient.getQueryData<Collection[]>(
        QUERY_KEYS.collections()
      );

      // Optimistically update to the new value
      if (previousCollections) {
        queryClient.setQueryData<Collection[]>(QUERY_KEYS.collections(), [
          ...previousCollections,
          {
            name: newCollection.name,
            metadata: newCollection.metadata || {},
            count: 0,
          } as Collection,
        ]);
      }

      // Return context with snapshot
      return { previousCollections };
    },
    onError: (error, _newCollection, context) => {
      // Rollback on error
      if (context?.previousCollections) {
        queryClient.setQueryData(QUERY_KEYS.collections(), context.previousCollections);
      }

      toast.error(`Failed to create collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
    onSuccess: (data) => {
      // Invalidate and refetch collections
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.collections() });

      toast.success(`Collection '${data.name}' created successfully`);
    },
  });
}

/**
 * Hook to update a collection's metadata
 * - Shows success/error toasts
 * - Invalidates collection queries on success
 * - Implements optimistic updates
 */
export function useUpdateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: UpdateCollectionRequest): Promise<Collection> => {
      const response = await window.electronAPI.invoke<Collection>(
        IPC_CHANNELS.COLLECTION_UPDATE,
        request
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to update collection');
      }

      return response.data!;
    },
    onMutate: async (updatedCollection) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.collection(updatedCollection.name) });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.collections() });

      // Snapshot the previous value
      const previousCollection = queryClient.getQueryData<Collection>(
        QUERY_KEYS.collection(updatedCollection.name)
      );
      const previousCollections = queryClient.getQueryData<Collection[]>(
        QUERY_KEYS.collections()
      );

      // Optimistically update the single collection
      if (previousCollection) {
        queryClient.setQueryData<Collection>(
          QUERY_KEYS.collection(updatedCollection.name),
          {
            ...previousCollection,
            metadata: updatedCollection.metadata || {},
          }
        );
      }

      // Optimistically update the collections list
      if (previousCollections) {
        queryClient.setQueryData<Collection[]>(
          QUERY_KEYS.collections(),
          previousCollections.map((col) =>
            col.name === updatedCollection.name
              ? { ...col, metadata: updatedCollection.metadata || {} }
              : col
          )
        );
      }

      // Return context with snapshots
      return { previousCollection, previousCollections };
    },
    onError: (error, updatedCollection, context) => {
      // Rollback on error
      if (context?.previousCollection) {
        queryClient.setQueryData(
          QUERY_KEYS.collection(updatedCollection.name),
          context.previousCollection
        );
      }
      if (context?.previousCollections) {
        queryClient.setQueryData(QUERY_KEYS.collections(), context.previousCollections);
      }

      toast.error(`Failed to update collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.collection(data.name) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.collections() });

      toast.success(`Collection '${data.name}' updated successfully`);
    },
  });
}

/**
 * Hook to delete a collection
 * - Shows success/error toasts
 * - Invalidates collections query on success
 * - Implements optimistic updates
 */
export function useDeleteCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string): Promise<{ deletedName: string }> => {
      const response = await window.electronAPI.invoke<{ deletedName: string }>(
        IPC_CHANNELS.COLLECTION_DELETE,
        { name }
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete collection');
      }

      return response.data!;
    },
    onMutate: async (name) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.collections() });

      // Snapshot the previous value
      const previousCollections = queryClient.getQueryData<Collection[]>(
        QUERY_KEYS.collections()
      );

      // Optimistically remove from list
      if (previousCollections) {
        queryClient.setQueryData<Collection[]>(
          QUERY_KEYS.collections(),
          previousCollections.filter((col) => col.name !== name)
        );
      }

      // Return context with snapshot
      return { previousCollections, deletedName: name };
    },
    onError: (error, _name, context) => {
      // Rollback on error
      if (context?.previousCollections) {
        queryClient.setQueryData(QUERY_KEYS.collections(), context.previousCollections);
      }

      toast.error(`Failed to delete collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.collections() });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.collection(data.deletedName) });

      toast.success(`Collection '${data.deletedName}' deleted successfully`);
    },
  });
}

// ============================================================================
// Document Queries
// ============================================================================

/**
 * Hook to query documents from a collection (paginated)
 * @param collectionName - Collection name
 * @param options - Query options (limit, offset, includeEmbeddings)
 */
export function useDocuments(
  collectionName: string | undefined,
  options: { limit?: number; offset?: number; includeEmbeddings?: boolean } = {}
) {
  const limit = options.limit || 100;
  const offset = options.offset || 0;
  const includeEmbeddings = options.includeEmbeddings || false;

  return useQuery({
    queryKey: QUERY_KEYS.documents(collectionName || '', limit, offset, includeEmbeddings),
    queryFn: async (): Promise<QueryDocumentsResponse> => {
      if (!collectionName) {
        return {
          ids: [],
          documents: [],
          metadatas: [],
          embeddings: null,
          total: 0,
        };
      }

      const response = await window.electronAPI.invoke<QueryDocumentsResponse>(
        IPC_CHANNELS.DOCUMENT_QUERY,
        { collectionName, limit, offset, includeEmbeddings }
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch documents');
      }

      return response.data || {
        ids: [],
        documents: [],
        metadatas: [],
        embeddings: null,
        total: 0,
      };
    },
    enabled: !!collectionName, // Only run query if collection name is provided
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
    placeholderData: (previousData) => previousData, // Keep previous data when changing pages
  });
}

/**
 * Hook to query a single document by ID
 * @param collectionName - Collection name
 * @param documentId - Document ID
 */
export function useDocument(collectionName: string | undefined, documentId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.document(collectionName || '', documentId || ''),
    queryFn: async (): Promise<Document | null> => {
      if (!collectionName || !documentId) {
        return null;
      }

      const response = await window.electronAPI.invoke<Document>(
        IPC_CHANNELS.DOCUMENT_GET,
        { collectionName, documentId }
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch document');
      }

      return response.data || null;
    },
    enabled: !!collectionName && !!documentId, // Only run query if both are provided
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================================================
// Query Execution
// ============================================================================

/**
 * Hook to execute a query on a collection
 * - Shows success/error toasts
 * - Updates query store with results
 * - Handles loading and error states
 */
export function useExecuteQuery() {
  const { setResults, setIsExecuting, setError } = useQueryStore();

  return useMutation({
    mutationFn: async (request: ExecuteQueryRequest): Promise<ExecuteQueryResponse> => {
      setIsExecuting(true);
      setError(null);

      const response = await window.electronAPI.invoke<ExecuteQueryResponse>(
        IPC_CHANNELS.QUERY_EXECUTE,
        request
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to execute query');
      }

      return response.data!;
    },
    onSuccess: (data) => {
      setResults(data.results);
      setIsExecuting(false);

      toast.success(`Found ${data.count} ${data.count === 1 ? 'result' : 'results'}`);
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      setIsExecuting(false);
      setResults(null);

      toast.error(`Query failed: ${errorMessage}`);
    },
  });
}

// ============================================================================
// Document Mutations
// ============================================================================

/**
 * Hook to add a document to a collection
 * - Shows success/error toasts
 * - Invalidates documents query on success
 * - Implements optimistic updates
 */
export function useAddDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: AddDocumentRequest): Promise<{ documentId: string }> => {
      const response = await window.electronAPI.invoke<{ documentId: string }>(
        IPC_CHANNELS.DOCUMENT_ADD,
        request
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to add document');
      }

      return response.data!;
    },
    onSuccess: (_data, variables) => {
      // Invalidate documents query for this collection
      queryClient.invalidateQueries({
        queryKey: ['documents', variables.collectionName]
      });

      toast.success('Document added successfully');
    },
    onError: (error) => {
      toast.error(`Failed to add document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });
}

/**
 * Hook to update a document
 * - Shows success/error toasts
 * - Invalidates document queries on success
 * - Implements optimistic updates
 */
export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: UpdateDocumentRequest): Promise<{ documentId: string }> => {
      const response = await window.electronAPI.invoke<{ documentId: string }>(
        IPC_CHANNELS.DOCUMENT_UPDATE,
        request
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to update document');
      }

      return response.data!;
    },
    onSuccess: (_data, variables) => {
      // Invalidate documents query for this collection
      queryClient.invalidateQueries({
        queryKey: ['documents', variables.collectionName]
      });
      // Invalidate specific document query
      queryClient.invalidateQueries({
        queryKey: ['document', variables.collectionName, variables.documentId]
      });

      toast.success('Document updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });
}

/**
 * Hook to delete documents from a collection
 * - Shows success/error toasts
 * - Invalidates documents query on success
 * - Supports bulk delete
 */
export function useDeleteDocuments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: DeleteDocumentsRequest): Promise<{ deletedCount: number }> => {
      const response = await window.electronAPI.invoke<{ deletedCount: number }>(
        IPC_CHANNELS.DOCUMENT_DELETE,
        request
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete documents');
      }

      return response.data!;
    },
    onSuccess: (data, variables) => {
      // Invalidate documents query for this collection
      queryClient.invalidateQueries({
        queryKey: ['documents', variables.collectionName]
      });

      const count = data.deletedCount;
      toast.success(`${count} ${count === 1 ? 'document' : 'documents'} deleted successfully`);
    },
    onError: (error) => {
      toast.error(`Failed to delete documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });
}

/**
 * Hook to bulk import documents
 * - Shows progress and result toasts
 * - Invalidates documents query on success
 */
export function useBulkImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: BulkImportRequest): Promise<BulkImportResponse> => {
      const response = await window.electronAPI.invoke<BulkImportResponse>(
        IPC_CHANNELS.DOCUMENT_BULK_IMPORT,
        request
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to import documents');
      }

      return response.data!;
    },
    onSuccess: (data, variables) => {
      // Invalidate documents query for this collection
      queryClient.invalidateQueries({
        queryKey: ['documents', variables.collectionName]
      });

      if (data.failedCount > 0) {
        toast.warning(
          `Imported ${data.importedCount} documents, ${data.failedCount} failed`,
          { duration: 5000 }
        );
      } else {
        toast.success(`Imported ${data.importedCount} documents successfully`);
      }
    },
    onError: (error) => {
      toast.error(`Failed to import documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });
}
