import { z } from 'zod';

// Ping Request Schema
export const PingRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  timestamp: z.number().int().positive(),
});

// Pong Response Schema
export const PongResponseSchema = z.object({
  originalMessage: z.string(),
  reply: z.string(),
  timestamp: z.number().int().positive(),
});

// IPC Response Schema (generic wrapper)
export const IPCResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
  });

// Type inference helpers
export type PingRequest = z.infer<typeof PingRequestSchema>;
export type PongResponse = z.infer<typeof PongResponseSchema>;

// ============================================================================
// Connection Management Schemas
// ============================================================================

// Auth Type Enum
export const AuthTypeSchema = z.enum(['none', 'token', 'basic']);
export type AuthType = z.infer<typeof AuthTypeSchema>;

// Connection Profile Schema (stored in electron-store, NOT containing credentials)
export const ConnectionProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Connection name is required').max(100),
  host: z.string().min(1, 'Host is required'),
  port: z.number().int().min(1).max(65535),
  authType: AuthTypeSchema,
  useSSL: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ConnectionProfile = z.infer<typeof ConnectionProfileSchema>;

// Connection Credential Schema (stored in OS keychain via keytar, NEVER in files)
export const ConnectionCredentialSchema = z.object({
  connectionId: z.string().uuid(),
  token: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
});

export type ConnectionCredential = z.infer<typeof ConnectionCredentialSchema>;

// Create Connection Request Schema (used when creating a new connection)
export const CreateConnectionRequestSchema = z.object({
  name: z.string().min(1, 'Connection name is required').max(100),
  host: z.string().min(1, 'Host is required'),
  port: z.number().int().min(1).max(65535),
  authType: AuthTypeSchema,
  useSSL: z.boolean().default(false),
  // Credentials (will be stored separately in keychain)
  token: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
});

export type CreateConnectionRequest = z.infer<typeof CreateConnectionRequestSchema>;

// Update Connection Request Schema
export const UpdateConnectionRequestSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  host: z.string().min(1).optional(),
  port: z.number().int().min(1).max(65535).optional(),
  authType: AuthTypeSchema.optional(),
  useSSL: z.boolean().optional(),
  // Credentials (will be stored separately in keychain)
  token: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
});

export type UpdateConnectionRequest = z.infer<typeof UpdateConnectionRequestSchema>;

// Test Connection Request Schema
export const TestConnectionRequestSchema = z.object({
  host: z.string().min(1, 'Host is required'),
  port: z.number().int().min(1).max(65535),
  authType: AuthTypeSchema,
  useSSL: z.boolean().default(false),
  token: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
});

export type TestConnectionRequest = z.infer<typeof TestConnectionRequestSchema>;

// Connection Status Schema
export const ConnectionStatusSchema = z.object({
  connectionId: z.string().uuid(),
  connected: z.boolean(),
  lastHeartbeat: z.string().datetime().optional(),
  error: z.string().optional(),
});

export type ConnectionStatus = z.infer<typeof ConnectionStatusSchema>;

// ============================================================================
// Collection Management Schemas
// ============================================================================

// Collection Metadata Schema
export const CollectionMetadataSchema = z.record(z.any()).optional();

// Distance Function Enum
export const DistanceFunctionSchema = z.enum(['l2', 'cosine', 'ip']);
export type DistanceFunction = z.infer<typeof DistanceFunctionSchema>;

// Embedding Function Enum
export const EmbeddingFunctionSchema = z.enum(['default', 'openai', 'sentence-transformers']);
export type EmbeddingFunction = z.infer<typeof EmbeddingFunctionSchema>;

// Collection Schema
export const CollectionSchema = z.object({
  name: z.string().min(1).max(63).regex(/^[a-zA-Z0-9_]+$/, 'Collection name must be alphanumeric and underscores only'),
  id: z.string().optional(),
  metadata: CollectionMetadataSchema,
  count: z.number().int().nonnegative().optional(),
});

export type Collection = z.infer<typeof CollectionSchema>;

// Create Collection Request Schema (embeddingConfig will be validated separately)
export const CreateCollectionRequestSchema = z.object({
  name: z.string().min(1).max(63).regex(/^[a-zA-Z0-9_]+$/, 'Collection name must be alphanumeric and underscores only'),
  metadata: CollectionMetadataSchema,
  embeddingFunction: EmbeddingFunctionSchema.optional(),
  distanceFunction: DistanceFunctionSchema.optional(),
  // New: Full embedding configuration (validated at runtime with EmbeddingConfigSchema)
  embeddingConfig: z.any().optional(),
});

export type CreateCollectionRequest = z.infer<typeof CreateCollectionRequestSchema>;

// Update Collection Request Schema
export const UpdateCollectionRequestSchema = z.object({
  name: z.string().min(1).max(63).regex(/^[a-zA-Z0-9_]+$/),
  metadata: CollectionMetadataSchema,
});

export type UpdateCollectionRequest = z.infer<typeof UpdateCollectionRequestSchema>;

// Delete Collection Request Schema
export const DeleteCollectionRequestSchema = z.object({
  name: z.string().min(1),
});

export type DeleteCollectionRequest = z.infer<typeof DeleteCollectionRequestSchema>;

// Get Collection Request Schema
export const GetCollectionRequestSchema = z.object({
  name: z.string().min(1),
});

export type GetCollectionRequest = z.infer<typeof GetCollectionRequestSchema>;

// ============================================================================
// Document Management Schemas
// ============================================================================

// Document Schema
export const DocumentSchema = z.object({
  id: z.string(),
  document: z.string().nullable(),
  metadata: z.record(z.any()).nullable(),
  embedding: z.array(z.number()).nullable().optional(),
});

export type Document = z.infer<typeof DocumentSchema>;

// Query Documents Request Schema
export const QueryDocumentsRequestSchema = z.object({
  collectionName: z.string().min(1),
  limit: z.number().int().min(1).max(10000).default(100),
  offset: z.number().int().min(0).default(0),
  includeEmbeddings: z.boolean().optional().default(false),
});

export type QueryDocumentsRequest = z.infer<typeof QueryDocumentsRequestSchema>;

// Query Documents Response Schema
export const QueryDocumentsResponseSchema = z.object({
  ids: z.array(z.string()),
  documents: z.array(z.string().nullable()),
  metadatas: z.array(z.record(z.any()).nullable()),
  embeddings: z.array(z.array(z.number())).nullable().optional(),
  total: z.number().int().nonnegative(),
});

export type QueryDocumentsResponse = z.infer<typeof QueryDocumentsResponseSchema>;

// Get Document Request Schema
export const GetDocumentRequestSchema = z.object({
  collectionName: z.string().min(1),
  documentId: z.string().min(1),
});

export type GetDocumentRequest = z.infer<typeof GetDocumentRequestSchema>;

// ============================================================================
// Query Execution Schemas
// ============================================================================

// Query Type Enum
export const QueryTypeSchema = z.enum(['similarity', 'filter', 'combined']);
export type QueryType = z.infer<typeof QueryTypeSchema>;

// Filter Operator Enum
export const FilterOperatorSchema = z.enum(['$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin']);
export type FilterOperator = z.infer<typeof FilterOperatorSchema>;

// Document Filter Operator Enum
export const DocumentFilterOperatorSchema = z.enum(['$contains', '$not_contains']);
export type DocumentFilterOperator = z.infer<typeof DocumentFilterOperatorSchema>;

// Metadata Filter Condition Schema
export const MetadataFilterSchema = z.object({
  field: z.string().min(1, 'Field name is required'),
  operator: FilterOperatorSchema,
  value: z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))]),
});

export type MetadataFilter = z.infer<typeof MetadataFilterSchema>;

// Document Filter Condition Schema
export const DocumentFilterSchema = z.object({
  operator: DocumentFilterOperatorSchema,
  value: z.string().min(1, 'Filter value is required'),
});

export type DocumentFilter = z.infer<typeof DocumentFilterSchema>;

// Execute Query Request Schema
export const ExecuteQueryRequestSchema = z.object({
  collectionName: z.string().min(1, 'Collection name is required'),
  queryType: QueryTypeSchema,
  // Similarity search params
  queryText: z.string().optional(),
  embeddingVector: z.array(z.number()).optional(),
  nResults: z.number().int().min(1).max(1000).default(10),
  // Filter params
  metadataFilters: z.array(MetadataFilterSchema).optional(),
  documentFilters: z.array(DocumentFilterSchema).optional(),
});

export type ExecuteQueryRequest = z.infer<typeof ExecuteQueryRequestSchema>;

// Query Result Schema
export const QueryResultSchema = z.object({
  id: z.string(),
  document: z.string().nullable(),
  metadata: z.record(z.any()).nullable(),
  distance: z.number().optional(),
});

export type QueryResult = z.infer<typeof QueryResultSchema>;

// Execute Query Response Schema
export const ExecuteQueryResponseSchema = z.object({
  results: z.array(QueryResultSchema),
  count: z.number().int().nonnegative(),
});

export type ExecuteQueryResponse = z.infer<typeof ExecuteQueryResponseSchema>;

// ============================================================================
// Document CRUD Schemas
// ============================================================================

// Add Document Request Schema
export const AddDocumentRequestSchema = z.object({
  collectionName: z.string().min(1, 'Collection name is required'),
  id: z.string().optional(),
  document: z.string().min(1, 'Document text is required'),
  metadata: z.record(z.any()).optional(),
  embedding: z.array(z.number()).optional(),
});

export type AddDocumentRequest = z.infer<typeof AddDocumentRequestSchema>;

// Update Document Request Schema
export const UpdateDocumentRequestSchema = z.object({
  collectionName: z.string().min(1, 'Collection name is required'),
  documentId: z.string().min(1, 'Document ID is required'),
  document: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  embedding: z.array(z.number()).optional(),
});

export type UpdateDocumentRequest = z.infer<typeof UpdateDocumentRequestSchema>;

// Delete Documents Request Schema
export const DeleteDocumentsRequestSchema = z.object({
  collectionName: z.string().min(1, 'Collection name is required'),
  documentIds: z.array(z.string().min(1)).min(1, 'At least one document ID is required'),
});

export type DeleteDocumentsRequest = z.infer<typeof DeleteDocumentsRequestSchema>;

// Bulk Import Request Schema
export const BulkImportRequestSchema = z.object({
  collectionName: z.string().min(1, 'Collection name is required'),
  documents: z.array(
    z.object({
      id: z.string().optional(),
      document: z.string().min(1, 'Document text is required'),
      metadata: z.record(z.any()).optional(),
      embedding: z.array(z.number()).optional(),
    })
  ).min(1, 'At least one document is required'),
});

export type BulkImportRequest = z.infer<typeof BulkImportRequestSchema>;

// Bulk Import Response Schema
export const BulkImportResponseSchema = z.object({
  importedCount: z.number().int().nonnegative(),
  failedCount: z.number().int().nonnegative(),
  errors: z.array(z.string()).optional(),
});

export type BulkImportResponse = z.infer<typeof BulkImportResponseSchema>;

// ============================================================================
// Embedding Configuration Schemas
// ============================================================================

// Embedding Provider Enum (includes 'local' for @xenova/transformers)
export const EmbeddingProviderSchema = z.enum(['local', 'openai', 'huggingface']);
export type EmbeddingProvider = z.infer<typeof EmbeddingProviderSchema>;

// DType for local model quantization
export const DTypeSchema = z.enum(['fp32', 'fp16', 'q8', 'int8']);
export type DType = z.infer<typeof DTypeSchema>;

// Local Embedding Config (uses @xenova/transformers locally)
export const LocalEmbeddingConfigSchema = z.object({
  provider: z.literal('local'),
  model: z.string().min(1).default('Xenova/all-MiniLM-L6-v2'),
  dtype: DTypeSchema.default('fp32'),
});
export type LocalEmbeddingConfig = z.infer<typeof LocalEmbeddingConfigSchema>;

// OpenAI Model Options
export const OpenAIModelSchema = z.enum([
  'text-embedding-3-small',
  'text-embedding-3-large',
  'text-embedding-ada-002',
]);
export type OpenAIModel = z.infer<typeof OpenAIModelSchema>;

// OpenAI Embedding Config
export const OpenAIEmbeddingConfigSchema = z.object({
  provider: z.literal('openai'),
  model: OpenAIModelSchema.default('text-embedding-3-small'),
  dimensions: z.number().int().min(256).max(3072).optional(),
});
export type OpenAIEmbeddingConfig = z.infer<typeof OpenAIEmbeddingConfigSchema>;

// HuggingFace Embedding Config (uses HuggingFace Inference API)
export const HuggingFaceEmbeddingConfigSchema = z.object({
  provider: z.literal('huggingface'),
  model: z.string().min(1).default('sentence-transformers/all-MiniLM-L6-v2'),
});
export type HuggingFaceEmbeddingConfig = z.infer<typeof HuggingFaceEmbeddingConfigSchema>;

// Discriminated Union for Embedding Config
export const EmbeddingConfigSchema = z.discriminatedUnion('provider', [
  LocalEmbeddingConfigSchema,
  OpenAIEmbeddingConfigSchema,
  HuggingFaceEmbeddingConfigSchema,
]);
export type EmbeddingConfig = z.infer<typeof EmbeddingConfigSchema>;

// Default config constant
export const DEFAULT_EMBEDDING_CONFIG: LocalEmbeddingConfig = {
  provider: 'local',
  model: 'Xenova/all-MiniLM-L6-v2',
  dtype: 'fp32',
};

// Available local model (for UI model picker)
export const AvailableModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  sizeLabel: z.string(),
  dimensions: z.number().int().positive(),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
  isDownloaded: z.boolean().default(false),
});
export type AvailableModel = z.infer<typeof AvailableModelSchema>;

// Model download progress event payload
export const ModelDownloadProgressSchema = z.object({
  modelId: z.string(),
  percentage: z.number().min(0).max(100),
  status: z.enum(['downloading', 'complete', 'error', 'cancelled']),
  error: z.string().optional(),
});
export type ModelDownloadProgress = z.infer<typeof ModelDownloadProgressSchema>;

// HuggingFace Model Preset (for UI convenience)
export const HuggingFaceModelPresetSchema = z.object({
  id: z.string(),
  name: z.string(),
  dimensions: z.number().int().positive(),
  description: z.string().optional(),
});
export type HuggingFaceModelPreset = z.infer<typeof HuggingFaceModelPresetSchema>;

// Test Embedding Request
export const TestEmbeddingRequestSchema = z.object({
  config: EmbeddingConfigSchema,
  testText: z.string().default('This is a test sentence for embedding.'),
});
export type TestEmbeddingRequest = z.infer<typeof TestEmbeddingRequestSchema>;

// Test Embedding Response
export const TestEmbeddingResponseSchema = z.object({
  success: z.boolean(),
  dimensions: z.number().int().positive().optional(),
  sampleEmbedding: z.array(z.number()).optional(),
  error: z.string().optional(),
});
export type TestEmbeddingResponse = z.infer<typeof TestEmbeddingResponseSchema>;

// API Key Status
export const ApiKeyStatusSchema = z.object({
  provider: z.string(),
  hasKey: z.boolean(),
});
export type ApiKeyStatus = z.infer<typeof ApiKeyStatusSchema>;

// ============================================================================
// Collection-Level API Key Management Schemas
// ============================================================================

// Set Collection API Key Request
export const SetCollectionApiKeyRequestSchema = z.object({
  collectionName: z.string().min(1, 'Collection name is required'),
  apiKey: z.string().min(1, 'API key is required'),
});
export type SetCollectionApiKeyRequest = z.infer<typeof SetCollectionApiKeyRequestSchema>;

// Get Collection API Key Status Request
export const GetCollectionApiKeyStatusRequestSchema = z.object({
  collectionName: z.string().min(1, 'Collection name is required'),
});
export type GetCollectionApiKeyStatusRequest = z.infer<typeof GetCollectionApiKeyStatusRequestSchema>;

// Collection API Key Status Response
export const CollectionApiKeyStatusSchema = z.object({
  hasKey: z.boolean(),
  hasGlobalKey: z.boolean(),
});
export type CollectionApiKeyStatus = z.infer<typeof CollectionApiKeyStatusSchema>;

// Delete Collection API Key Request
export const DeleteCollectionApiKeyRequestSchema = z.object({
  collectionName: z.string().min(1, 'Collection name is required'),
});
export type DeleteCollectionApiKeyRequest = z.infer<typeof DeleteCollectionApiKeyRequestSchema>;
