// Application constants
export const APP_NAME = 'ChromaDB UI';
export const APP_VERSION = '1.0.0';

// IPC Channel Names
export const IPC_CHANNELS = {
  // Test channels
  PING: 'ipc:ping',

  // Connection management channels
  CONNECTION_LIST: 'connection:list',
  CONNECTION_CREATE: 'connection:create',
  CONNECTION_UPDATE: 'connection:update',
  CONNECTION_DELETE: 'connection:delete',
  CONNECTION_TEST: 'connection:test',
  CONNECTION_CONNECT: 'connection:connect',
  CONNECTION_DISCONNECT: 'connection:disconnect',
  CONNECTION_GET_ACTIVE: 'connection:get-active',

  COLLECTION_LIST: 'collection:list',
  COLLECTION_GET: 'collection:get',
  COLLECTION_CREATE: 'collection:create',
  COLLECTION_UPDATE: 'collection:update',
  COLLECTION_DELETE: 'collection:delete',
  COLLECTION_SET_API_KEY: 'collection:set-api-key',
  COLLECTION_GET_API_KEY_STATUS: 'collection:get-api-key-status',
  COLLECTION_DELETE_API_KEY: 'collection:delete-api-key',

  DOCUMENT_QUERY: 'document:query',
  DOCUMENT_GET: 'document:get',
  DOCUMENT_ADD: 'document:add',
  DOCUMENT_UPDATE: 'document:update',
  DOCUMENT_DELETE: 'document:delete',
  DOCUMENT_BULK_IMPORT: 'document:bulk-import',

  QUERY_EXECUTE: 'query:execute',

  // Auto-updater channels
  UPDATE_CHECK: 'updater:check',
  UPDATE_DOWNLOAD: 'updater:download',
  UPDATE_INSTALL: 'updater:install',

  // Embedding management channels
  EMBEDDING_SET_API_KEY: 'embedding:set-api-key',
  EMBEDDING_GET_API_KEY_STATUS: 'embedding:get-api-key-status',
  EMBEDDING_DELETE_API_KEY: 'embedding:delete-api-key',
  EMBEDDING_TEST: 'embedding:test',
  EMBEDDING_WARMUP: 'embedding:warmup',
  EMBEDDING_IS_READY: 'embedding:is-ready',
  MODEL_LIST_AVAILABLE: 'model:list-available',
  MODEL_DOWNLOAD_PROGRESS: 'model:download-progress',
  MODEL_DOWNLOAD: 'model:download',
  MODEL_CANCEL_DOWNLOAD: 'model:cancel-download',
  MODEL_CHECK_INTEGRITY: 'model:check-integrity',
} as const;

// Window dimensions
export const WINDOW_CONFIG = {
  MIN_WIDTH: 1024,
  MIN_HEIGHT: 768,
  DEFAULT_WIDTH: 1280,
  DEFAULT_HEIGHT: 800,
};
