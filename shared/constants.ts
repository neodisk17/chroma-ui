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

  DOCUMENT_QUERY: 'document:query',
  DOCUMENT_GET: 'document:get',
  DOCUMENT_ADD: 'document:add',
  DOCUMENT_UPDATE: 'document:update',
  DOCUMENT_DELETE: 'document:delete',
  DOCUMENT_BULK_IMPORT: 'document:bulk-import',

  QUERY_EXECUTE: 'query:execute',
} as const;

// Window dimensions
export const WINDOW_CONFIG = {
  MIN_WIDTH: 1024,
  MIN_HEIGHT: 768,
  DEFAULT_WIDTH: 1280,
  DEFAULT_HEIGHT: 800,
};
