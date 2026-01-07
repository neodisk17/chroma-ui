import { ipcMain } from 'electron';
import Store from 'electron-store';
import { randomUUID } from 'crypto';
import {
  ConnectionProfile,
  ConnectionProfileSchema,
  CreateConnectionRequestSchema,
  UpdateConnectionRequestSchema,
  TestConnectionRequestSchema,
  IPCResponseSchema,
} from '../../shared/schemas';
import { credentialStore } from '../services/credential-store';
import { connectionManager } from '../services/connection-manager';

// Initialize electron-store for connection profiles
// IMPORTANT: Credentials are NEVER stored here, only in the OS keychain
const connectionStore = new Store<{ connections: ConnectionProfile[] }>({
  name: 'connections',
  defaults: {
    connections: [],
  },
});

/**
 * Register all connection-related IPC handlers
 *
 * SECURITY: All handlers validate inputs with Zod schemas.
 * Credentials are NEVER sent to the renderer process.
 */
export function registerConnectionHandlers(): void {
  // ============================================================================
  // connection:list - Get all connection profiles
  // ============================================================================
  ipcMain.handle('connection:list', async () => {
    try {
      const connections = connectionStore.get('connections', []);

      return {
        success: true,
        data: connections,
      };
    } catch (error) {
      console.error('connection:list error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list connections',
      };
    }
  });

  // ============================================================================
  // connection:create - Create a new connection profile
  // ============================================================================
  ipcMain.handle('connection:create', async (_, requestData) => {
    try {
      // Validate input
      const request = CreateConnectionRequestSchema.parse(requestData);

      // Generate unique ID
      const id = randomUUID();
      const now = new Date().toISOString();

      // Create connection profile (WITHOUT credentials)
      const profile: ConnectionProfile = {
        id,
        name: request.name,
        host: request.host,
        port: request.port,
        authType: request.authType,
        useSSL: request.useSSL,
        createdAt: now,
        updatedAt: now,
      };

      // Validate the profile
      ConnectionProfileSchema.parse(profile);

      // Save credentials to OS keychain (if provided)
      if (request.authType !== 'none') {
        await credentialStore.saveCredential(id, {
          token: request.token,
          username: request.username,
          password: request.password,
        });
      }

      // Save profile to electron-store
      const connections = connectionStore.get('connections', []);
      connections.push(profile);
      connectionStore.set('connections', connections);

      return {
        success: true,
        data: profile,
      };
    } catch (error) {
      console.error('connection:create error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create connection',
      };
    }
  });

  // ============================================================================
  // connection:update - Update an existing connection profile
  // ============================================================================
  ipcMain.handle('connection:update', async (_, requestData) => {
    try {
      // Validate input
      const request = UpdateConnectionRequestSchema.parse(requestData);

      // Get existing connections
      const connections = connectionStore.get('connections', []);
      const index = connections.findIndex((c) => c.id === request.id);

      if (index === -1) {
        return {
          success: false,
          error: 'Connection not found',
        };
      }

      // Update profile (WITHOUT credentials)
      const updatedProfile: ConnectionProfile = {
        ...connections[index],
        name: request.name ?? connections[index].name,
        host: request.host ?? connections[index].host,
        port: request.port ?? connections[index].port,
        authType: request.authType ?? connections[index].authType,
        useSSL: request.useSSL ?? connections[index].useSSL,
        updatedAt: new Date().toISOString(),
      };

      // Validate the updated profile
      ConnectionProfileSchema.parse(updatedProfile);

      // Update credentials in OS keychain (if provided)
      if (
        request.token !== undefined ||
        request.username !== undefined ||
        request.password !== undefined
      ) {
        await credentialStore.saveCredential(request.id, {
          token: request.token,
          username: request.username,
          password: request.password,
        });
      }

      // Update profile in electron-store
      connections[index] = updatedProfile;
      connectionStore.set('connections', connections);

      // If this connection is active, reconnect with new settings
      if (connectionManager.getActiveConnectionId() === request.id) {
        try {
          await connectionManager.disconnect(request.id);
          await connectionManager.connect(updatedProfile);
        } catch (connectError) {
          console.warn('Failed to reconnect after update:', connectError);
        }
      }

      return {
        success: true,
        data: updatedProfile,
      };
    } catch (error) {
      console.error('connection:update error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update connection',
      };
    }
  });

  // ============================================================================
  // connection:delete - Delete a connection profile
  // ============================================================================
  ipcMain.handle('connection:delete', async (_, connectionId: string) => {
    try {
      // Disconnect if active
      if (connectionManager.getActiveConnectionId() === connectionId) {
        await connectionManager.disconnect(connectionId);
      }

      // Delete credentials from keychain
      await credentialStore.deleteCredential(connectionId);

      // Delete profile from electron-store
      const connections = connectionStore.get('connections', []);
      const filtered = connections.filter((c) => c.id !== connectionId);
      connectionStore.set('connections', filtered);

      return {
        success: true,
        data: { deletedId: connectionId },
      };
    } catch (error) {
      console.error('connection:delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete connection',
      };
    }
  });

  // ============================================================================
  // connection:test - Test a connection without saving
  // ============================================================================
  ipcMain.handle('connection:test', async (_, requestData) => {
    try {
      // Validate input
      const request = TestConnectionRequestSchema.parse(requestData);

      // Test connection
      const result = await connectionManager.testConnection(
        {
          host: request.host,
          port: request.port,
          authType: request.authType,
          useSSL: request.useSSL,
          token: request.token,
          username: request.username,
          password: request.password,
        },
        5000 // 5 second timeout
      );

      return {
        success: result.success,
        data: result,
        error: result.error,
      };
    } catch (error) {
      console.error('connection:test error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to test connection',
      };
    }
  });

  // ============================================================================
  // connection:connect - Connect to a ChromaDB instance
  // ============================================================================
  ipcMain.handle('connection:connect', async (_, connectionId: string) => {
    try {
      // Get connection profile
      const connections = connectionStore.get('connections', []);
      const profile = connections.find((c) => c.id === connectionId);

      if (!profile) {
        return {
          success: false,
          error: 'Connection not found',
        };
      }

      // Disconnect previous connection if any
      const activeId = connectionManager.getActiveConnectionId();
      if (activeId && activeId !== connectionId) {
        await connectionManager.disconnect(activeId);
      }

      // Connect
      await connectionManager.connect(profile, 10000); // 10 second timeout

      return {
        success: true,
        data: { connectionId },
      };
    } catch (error) {
      console.error('connection:connect error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect',
      };
    }
  });

  // ============================================================================
  // connection:disconnect - Disconnect from a ChromaDB instance
  // ============================================================================
  ipcMain.handle('connection:disconnect', async (_, connectionId: string) => {
    try {
      await connectionManager.disconnect(connectionId);

      return {
        success: true,
        data: { connectionId },
      };
    } catch (error) {
      console.error('connection:disconnect error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to disconnect',
      };
    }
  });

  // ============================================================================
  // connection:get-active - Get the active connection ID
  // ============================================================================
  ipcMain.handle('connection:get-active', async () => {
    try {
      const activeId = connectionManager.getActiveConnectionId();

      return {
        success: true,
        data: { activeConnectionId: activeId },
      };
    } catch (error) {
      console.error('connection:get-active error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get active connection',
      };
    }
  });

  console.log('Connection IPC handlers registered');
}
