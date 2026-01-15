import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ConnectionProfile,
  CreateConnectionRequest,
  UpdateConnectionRequest,
  TestConnectionRequest,
} from '../../shared/schemas';
import { IPC_CHANNELS } from '../../shared/constants';

// Define the store state
interface ConnectionState {
  // State
  connections: ConnectionProfile[];
  activeConnectionId: string | null; // Only set when actually connected
  lastActiveConnectionId: string | null; // Persisted for auto-reconnect
  isLoading: boolean;
  isConnecting: boolean;
  error: string | null;

  // Actions
  loadConnections: () => Promise<void>;
  createConnection: (request: CreateConnectionRequest) => Promise<ConnectionProfile | null>;
  updateConnection: (request: UpdateConnectionRequest) => Promise<ConnectionProfile | null>;
  deleteConnection: (connectionId: string) => Promise<boolean>;
  testConnection: (request: TestConnectionRequest) => Promise<{ success: boolean; message: string }>;
  connectToConnection: (connectionId: string) => Promise<boolean>;
  disconnectFromConnection: (connectionId: string) => Promise<boolean>;
  setActiveConnection: (connectionId: string | null) => void;
  clearError: () => void;
}

/**
 * Connection Store - Manages connection state in the renderer process
 *
 * This Zustand store manages:
 * - List of connection profiles
 * - Active connection state
 * - Loading and error states
 * - IPC communication with main process
 *
 * IMPORTANT: This store does NOT contain credentials.
 * Credentials are stored securely in the OS keychain via the main process.
 */
export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set) => ({
      // Initial state
      connections: [],
      activeConnectionId: null, // Always starts null, only set after successful connection
      lastActiveConnectionId: null, // Persisted for auto-reconnect
      isLoading: false,
      isConnecting: false,
      error: null,

      // Load all connections from main process
      loadConnections: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await window.electronAPI.invoke<ConnectionProfile[]>(
            IPC_CHANNELS.CONNECTION_LIST
          );

          if (response.success && response.data) {
            set({ connections: response.data, isLoading: false });
          } else {
            set({
              error: response.error || 'Failed to load connections',
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
            isLoading: false,
          });
        }
      },

      // Create a new connection
      createConnection: async (request: CreateConnectionRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await window.electronAPI.invoke<ConnectionProfile>(
            IPC_CHANNELS.CONNECTION_CREATE,
            request
          );

          if (response.success && response.data) {
            // Add to local state
            set((state) => ({
              connections: [...state.connections, response.data!],
              isLoading: false,
            }));
            return response.data;
          } else {
            set({
              error: response.error || 'Failed to create connection',
              isLoading: false,
            });
            return null;
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
            isLoading: false,
          });
          return null;
        }
      },

      // Update an existing connection
      updateConnection: async (request: UpdateConnectionRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await window.electronAPI.invoke<ConnectionProfile>(
            IPC_CHANNELS.CONNECTION_UPDATE,
            request
          );

          if (response.success && response.data) {
            // Update local state
            set((state) => ({
              connections: state.connections.map((c) =>
                c.id === response.data!.id ? response.data! : c
              ),
              isLoading: false,
            }));
            return response.data;
          } else {
            set({
              error: response.error || 'Failed to update connection',
              isLoading: false,
            });
            return null;
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
            isLoading: false,
          });
          return null;
        }
      },

      // Delete a connection
      deleteConnection: async (connectionId: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await window.electronAPI.invoke<{ deletedId: string }>(
            IPC_CHANNELS.CONNECTION_DELETE,
            connectionId
          );

          if (response.success) {
            // Remove from local state
            set((state) => ({
              connections: state.connections.filter((c) => c.id !== connectionId),
              activeConnectionId:
                state.activeConnectionId === connectionId ? null : state.activeConnectionId,
              lastActiveConnectionId:
                state.lastActiveConnectionId === connectionId ? null : state.lastActiveConnectionId,
              isLoading: false,
            }));
            return true;
          } else {
            set({
              error: response.error || 'Failed to delete connection',
              isLoading: false,
            });
            return false;
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
            isLoading: false,
          });
          return false;
        }
      },

      // Test a connection without saving
      testConnection: async (request: TestConnectionRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await window.electronAPI.invoke<{
            success: boolean;
            message: string;
            error?: string;
          }>(IPC_CHANNELS.CONNECTION_TEST, request);

          set({ isLoading: false });

          if (response.success && response.data) {
            return {
              success: response.data.success,
              message: response.data.message,
            };
          } else {
            return {
              success: false,
              message: response.error || 'Failed to test connection',
            };
          }
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },

      // Connect to a ChromaDB instance
      connectToConnection: async (connectionId: string) => {
        set({ isConnecting: true, error: null });
        try {
          const response = await window.electronAPI.invoke<{ connectionId: string }>(
            IPC_CHANNELS.CONNECTION_CONNECT,
            connectionId
          );

          if (response.success) {
            // Set both activeConnectionId (runtime) and lastActiveConnectionId (persisted)
            set({
              activeConnectionId: connectionId,
              lastActiveConnectionId: connectionId,
              isConnecting: false,
            });
            return true;
          } else {
            set({
              error: response.error || 'Failed to connect',
              isConnecting: false,
            });
            return false;
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
            isConnecting: false,
          });
          return false;
        }
      },

      // Disconnect from a ChromaDB instance
      disconnectFromConnection: async (connectionId: string) => {
        set({ isConnecting: true, error: null });
        try {
          const response = await window.electronAPI.invoke<{ connectionId: string }>(
            IPC_CHANNELS.CONNECTION_DISCONNECT,
            connectionId
          );

          if (response.success) {
            set((state) => ({
              activeConnectionId:
                state.activeConnectionId === connectionId ? null : state.activeConnectionId,
              lastActiveConnectionId:
                state.lastActiveConnectionId === connectionId ? null : state.lastActiveConnectionId,
              isConnecting: false,
            }));
            return true;
          } else {
            set({
              error: response.error || 'Failed to disconnect',
              isConnecting: false,
            });
            return false;
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
            isConnecting: false,
          });
          return false;
        }
      },

      // Set the active connection (local state only)
      setActiveConnection: (connectionId: string | null) => {
        set({ activeConnectionId: connectionId });
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'connection-storage',
      // Only persist lastActiveConnectionId for auto-reconnect on app restart
      // activeConnectionId is NOT persisted - it's only set after successful connection
      partialize: (state) => ({ lastActiveConnectionId: state.lastActiveConnectionId }),
    }
  )
);
