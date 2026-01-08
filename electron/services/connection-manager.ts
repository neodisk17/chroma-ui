import { ChromaClient } from 'chromadb';
import { ConnectionProfile, ConnectionCredential } from '../../shared/schemas';
import { credentialStore } from './credential-store';

// Connection pool entry
interface ConnectionPoolEntry {
  profile: ConnectionProfile;
  client: ChromaClient | null;
  lastHeartbeat: Date | null;
  retryCount: number;
  isConnecting: boolean;
}

// ChromaDB client configuration
interface ChromaClientConfig {
  path: string;
  auth?: {
    provider: 'token' | 'basic';
    credentials: string;
  };
}

// Connection test result
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * ConnectionManager - Manages ChromaDB client instances
 *
 * This service manages a pool of ChromaDB client connections:
 * - Lazy connection: only connects when needed
 * - Auto-reconnect with exponential backoff
 * - Health check: periodic heartbeat to detect disconnections
 * - Proper cleanup on app quit
 *
 * SECURITY: All ChromaDB operations happen in the main process.
 * The renderer process NEVER has direct access to credentials or clients.
 */
export class ConnectionManager {
  private connectionPool: Map<string, ConnectionPoolEntry> = new Map();
  private activeConnectionId: string | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly MAX_RETRIES = 3;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly RETRY_BASE_DELAY = 1000; // 1 second

  constructor() {
    // Start heartbeat monitoring
    this.startHeartbeat();
  }

  /**
   * Test a connection without saving it
   * @param config - Connection configuration
   * @param timeout - Timeout in milliseconds (default: 5000ms)
   * @returns Promise<ConnectionTestResult>
   */
  async testConnection(
    config: {
      host: string;
      port: number;
      authType: 'none' | 'token' | 'basic';
      useSSL: boolean;
      token?: string;
      username?: string;
      password?: string;
    },
    timeout: number = 5000
  ): Promise<ConnectionTestResult> {
    try {
      // Create temporary client
      const protocol = config.useSSL ? 'https' : 'http';
      const url = `${protocol}://${config.host}:${config.port}`;

      const clientConfig: ChromaClientConfig = {
        path: url,
      };

      // Add auth if required
      if (config.authType === 'token' && config.token) {
        clientConfig.auth = { provider: 'token', credentials: config.token };
      } else if (config.authType === 'basic' && config.username && config.password) {
        clientConfig.auth = {
          provider: 'basic',
          credentials: `${config.username}:${config.password}`,
        };
      }

      const client = new ChromaClient(clientConfig);

      // Test connection with timeout
      const heartbeatPromise = client.heartbeat();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout')), timeout)
      );

      await Promise.race([heartbeatPromise, timeoutPromise]);

      return {
        success: true,
        message: `Successfully connected to ChromaDB at ${config.host}:${config.port}`,
      };
    } catch (error) {
      return this.formatConnectionError(error, config.host, config.port);
    }
  }

  /**
   * Connect to a ChromaDB instance
   * @param profile - Connection profile
   * @param timeout - Timeout in milliseconds (default: 10000ms)
   * @returns Promise<void>
   * @throws Error if connection fails after max retries
   */
  async connect(profile: ConnectionProfile, timeout: number = 10000): Promise<void> {
    try {
      // Check if already connecting
      const existingEntry = this.connectionPool.get(profile.id);
      if (existingEntry?.isConnecting) {
        throw new Error('Connection already in progress');
      }

      // Mark as connecting
      this.connectionPool.set(profile.id, {
        profile,
        client: null,
        lastHeartbeat: null,
        retryCount: 0,
        isConnecting: true,
      });

      // Get credentials from keychain
      const credential = await credentialStore.getCredential(profile.id);

      // Create client
      const client = await this.createClient(profile, credential, timeout);

      // Store in pool
      this.connectionPool.set(profile.id, {
        profile,
        client,
        lastHeartbeat: new Date(),
        retryCount: 0,
        isConnecting: false,
      });

      // Set as active connection
      this.activeConnectionId = profile.id;
    } catch (error) {
      // Remove from pool on failure
      this.connectionPool.delete(profile.id);
      throw error;
    }
  }

  /**
   * Disconnect from a ChromaDB instance
   * @param connectionId - Connection ID
   */
  async disconnect(connectionId: string): Promise<void> {
    const entry = this.connectionPool.get(connectionId);
    if (!entry) {
      return;
    }

    // Clear from pool
    this.connectionPool.delete(connectionId);

    // If this was the active connection, clear it
    if (this.activeConnectionId === connectionId) {
      this.activeConnectionId = null;
    }

    // ChromaClient doesn't have an explicit disconnect method
    // The connection will be cleaned up when the client is garbage collected
  }

  /**
   * Get the active ChromaDB client
   * @returns ChromaClient | null
   */
  getActiveClient(): ChromaClient | null {
    if (!this.activeConnectionId) {
      return null;
    }

    const entry = this.connectionPool.get(this.activeConnectionId);
    return entry?.client || null;
  }

  /**
   * Get a ChromaDB client by connection ID
   * @param connectionId - Connection ID
   * @returns ChromaClient | null
   */
  getClient(connectionId: string): ChromaClient | null {
    const entry = this.connectionPool.get(connectionId);
    return entry?.client || null;
  }

  /**
   * Get the active connection ID
   * @returns string | null
   */
  getActiveConnectionId(): string | null {
    return this.activeConnectionId;
  }

  /**
   * Set the active connection
   * @param connectionId - Connection ID
   * @throws Error if connection not found or not connected
   */
  async setActiveConnection(connectionId: string): Promise<void> {
    const entry = this.connectionPool.get(connectionId);
    if (!entry) {
      throw new Error(`Connection ${connectionId} not found`);
    }

    if (!entry.client) {
      throw new Error(`Connection ${connectionId} is not connected`);
    }

    this.activeConnectionId = connectionId;
  }

  /**
   * Disconnect all connections
   */
  async disconnectAll(): Promise<void> {
    const connectionIds = Array.from(this.connectionPool.keys());
    for (const connectionId of connectionIds) {
      await this.disconnect(connectionId);
    }
  }

  /**
   * Cleanup on app quit
   */
  async cleanup(): Promise<void> {
    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Disconnect all connections
    await this.disconnectAll();
  }

  // ============================================================================
  // Private methods
  // ============================================================================

  /**
   * Create a ChromaDB client
   */
  private async createClient(
    profile: ConnectionProfile,
    credential: ConnectionCredential | null,
    timeout: number
  ): Promise<ChromaClient> {
    const protocol = profile.useSSL ? 'https' : 'http';
    const url = `${protocol}://${profile.host}:${profile.port}`;

    const clientConfig: ChromaClientConfig = {
      path: url,
    };

    // Add auth if required
    if (profile.authType === 'token' && credential?.token) {
      clientConfig.auth = { provider: 'token', credentials: credential.token };
    } else if (
      profile.authType === 'basic' &&
      credential?.username &&
      credential?.password
    ) {
      clientConfig.auth = {
        provider: 'basic',
        credentials: `${credential.username}:${credential.password}`,
      };
    }

    const client = new ChromaClient(clientConfig);

    // Test connection with timeout
    const heartbeatPromise = client.heartbeat();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection timeout')), timeout)
    );

    await Promise.race([heartbeatPromise, timeoutPromise]);

    return client;
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      for (const [connectionId, entry] of this.connectionPool.entries()) {
        if (!entry.client || entry.isConnecting) {
          continue;
        }

        try {
          await entry.client.heartbeat();
          entry.lastHeartbeat = new Date();
          entry.retryCount = 0;
        } catch (error) {
          console.error(`Heartbeat failed for connection ${connectionId}:`, error);

          // Attempt auto-reconnect with exponential backoff
          if (entry.retryCount < this.MAX_RETRIES) {
            const delay = this.RETRY_BASE_DELAY * Math.pow(2, entry.retryCount);
            entry.retryCount++;

            setTimeout(async () => {
              try {
                const credential = await credentialStore.getCredential(connectionId);
                const newClient = await this.createClient(entry.profile, credential, 10000);
                entry.client = newClient;
                entry.lastHeartbeat = new Date();
                entry.retryCount = 0;
                console.log(`Reconnected to ${connectionId}`);
              } catch (reconnectError) {
                console.error(`Reconnect failed for ${connectionId}:`, reconnectError);
              }
            }, delay);
          } else {
            // Max retries reached, disconnect
            console.error(`Max retries reached for ${connectionId}, disconnecting`);
            await this.disconnect(connectionId);
          }
        }
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Format connection error to user-friendly message
   */
  private formatConnectionError(
    error: unknown,
    host: string,
    port: number
  ): ConnectionTestResult {
    let message = 'Connection failed';
    let errorDetails = '';

    if (error instanceof Error) {
      errorDetails = error.message;

      if (errorDetails.includes('ECONNREFUSED')) {
        message = `Cannot connect to ChromaDB at ${host}:${port}. Is the server running?`;
      } else if (errorDetails.includes('ETIMEDOUT') || errorDetails.includes('timeout')) {
        message = `Connection timed out. Check your network connection and ensure ChromaDB is accessible at ${host}:${port}.`;
      } else if (errorDetails.includes('ENOTFOUND')) {
        message = `Host not found: ${host}. Please check the hostname.`;
      } else if (errorDetails.includes('401') || errorDetails.includes('403')) {
        message = 'Authentication failed. Please check your credentials.';
      } else {
        message = `Failed to connect to ChromaDB at ${host}:${port}: ${errorDetails}`;
      }
    }

    return {
      success: false,
      message,
      error: errorDetails,
    };
  }
}

// Export a singleton instance
export const connectionManager = new ConnectionManager();
