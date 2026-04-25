import { registerCollectionHandlers } from './collection-handlers';
import { registerDocumentHandlers } from './document-handlers';
import { registerEmbeddingHandlers } from './embedding-handlers';

/**
 * Register all ChromaDB IPC handlers
 *
 * REQUIREMENTS:
 * - All operations use the active connection from connectionManager
 * - All inputs are validated with Zod schemas
 * - Returns consistent error format: { success: boolean, data?: any, error?: string }
 */
export function registerChromaDBHandlers(): void {
  registerCollectionHandlers();
  registerDocumentHandlers();
  registerEmbeddingHandlers();
  console.log('ChromaDB IPC handlers registered');
}
