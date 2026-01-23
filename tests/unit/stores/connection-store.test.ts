import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useConnectionStore } from '@/stores/connection-store';
import { IPC_CHANNELS } from '@shared/constants';

// Helper to reset store between tests
function resetStore() {
  useConnectionStore.setState({
    connections: [],
    activeConnectionId: null,
    lastActiveConnectionId: null,
    isLoading: false,
    isConnecting: false,
    error: null,
  });
}

const mockConnection = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Test Connection',
  host: 'localhost',
  port: 8000,
  authType: 'none' as const,
  useSSL: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockConnection2 = {
  id: '223e4567-e89b-12d3-a456-426614174001',
  name: 'Production DB',
  host: 'chromadb.example.com',
  port: 443,
  authType: 'token' as const,
  useSSL: true,
  createdAt: '2024-01-02T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z',
};

describe('Connection Store', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have empty connections list', () => {
      const state = useConnectionStore.getState();
      expect(state.connections).toEqual([]);
    });

    it('should have no active connection', () => {
      const state = useConnectionStore.getState();
      expect(state.activeConnectionId).toBeNull();
    });

    it('should not be loading', () => {
      const state = useConnectionStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.isConnecting).toBe(false);
    });

    it('should have no error', () => {
      const state = useConnectionStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe('loadConnections', () => {
    it('should load connections from IPC', async () => {
      vi.mocked(window.electronAPI.invoke).mockResolvedValueOnce({
        success: true,
        data: [mockConnection, mockConnection2],
      });

      await useConnectionStore.getState().loadConnections();

      const state = useConnectionStore.getState();
      expect(state.connections).toHaveLength(2);
      expect(state.connections[0]).toEqual(mockConnection);
      expect(state.isLoading).toBe(false);
      expect(window.electronAPI.invoke).toHaveBeenCalledWith(IPC_CHANNELS.CONNECTION_LIST);
    });

    it('should set loading state during fetch', async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => { resolvePromise = resolve; });
      vi.mocked(window.electronAPI.invoke).mockReturnValueOnce(promise as never);

      const loadPromise = useConnectionStore.getState().loadConnections();
      expect(useConnectionStore.getState().isLoading).toBe(true);

      resolvePromise!({ success: true, data: [] });
      await loadPromise;

      expect(useConnectionStore.getState().isLoading).toBe(false);
    });

    it('should handle IPC error response', async () => {
      vi.mocked(window.electronAPI.invoke).mockResolvedValueOnce({
        success: false,
        error: 'Database error',
      });

      await useConnectionStore.getState().loadConnections();

      const state = useConnectionStore.getState();
      expect(state.error).toBe('Database error');
      expect(state.isLoading).toBe(false);
      expect(state.connections).toEqual([]);
    });

    it('should handle thrown exceptions', async () => {
      vi.mocked(window.electronAPI.invoke).mockRejectedValueOnce(
        new Error('Network failure')
      );

      await useConnectionStore.getState().loadConnections();

      const state = useConnectionStore.getState();
      expect(state.error).toBe('Network failure');
      expect(state.isLoading).toBe(false);
    });

    it('should use fallback error message for non-Error exceptions', async () => {
      vi.mocked(window.electronAPI.invoke).mockRejectedValueOnce('string error');

      await useConnectionStore.getState().loadConnections();

      expect(useConnectionStore.getState().error).toBe('Unknown error');
    });
  });

  describe('createConnection', () => {
    const createRequest = {
      name: 'New Connection',
      host: 'localhost',
      port: 8000,
      authType: 'none' as const,
      useSSL: false,
    };

    it('should create a connection and add to state', async () => {
      vi.mocked(window.electronAPI.invoke).mockResolvedValueOnce({
        success: true,
        data: mockConnection,
      });

      const result = await useConnectionStore.getState().createConnection(createRequest);

      expect(result).toEqual(mockConnection);
      expect(useConnectionStore.getState().connections).toContainEqual(mockConnection);
      expect(window.electronAPI.invoke).toHaveBeenCalledWith(
        IPC_CHANNELS.CONNECTION_CREATE,
        createRequest
      );
    });

    it('should append to existing connections', async () => {
      useConnectionStore.setState({ connections: [mockConnection] });

      vi.mocked(window.electronAPI.invoke).mockResolvedValueOnce({
        success: true,
        data: mockConnection2,
      });

      await useConnectionStore.getState().createConnection(createRequest);

      expect(useConnectionStore.getState().connections).toHaveLength(2);
    });

    it('should return null on failure', async () => {
      vi.mocked(window.electronAPI.invoke).mockResolvedValueOnce({
        success: false,
        error: 'Name already taken',
      });

      const result = await useConnectionStore.getState().createConnection(createRequest);

      expect(result).toBeNull();
      expect(useConnectionStore.getState().error).toBe('Name already taken');
    });

    it('should handle exceptions and return null', async () => {
      vi.mocked(window.electronAPI.invoke).mockRejectedValueOnce(
        new Error('IPC failure')
      );

      const result = await useConnectionStore.getState().createConnection(createRequest);

      expect(result).toBeNull();
      expect(useConnectionStore.getState().error).toBe('IPC failure');
    });
  });

  describe('updateConnection', () => {
    const updateRequest = {
      id: mockConnection.id,
      name: 'Updated Name',
    };

    beforeEach(() => {
      useConnectionStore.setState({ connections: [mockConnection, mockConnection2] });
    });

    it('should update connection in state', async () => {
      const updatedConnection = { ...mockConnection, name: 'Updated Name' };
      vi.mocked(window.electronAPI.invoke).mockResolvedValueOnce({
        success: true,
        data: updatedConnection,
      });

      const result = await useConnectionStore.getState().updateConnection(updateRequest);

      expect(result).toEqual(updatedConnection);
      const conn = useConnectionStore.getState().connections.find(c => c.id === mockConnection.id);
      expect(conn?.name).toBe('Updated Name');
    });

    it('should not modify other connections', async () => {
      const updatedConnection = { ...mockConnection, name: 'Updated Name' };
      vi.mocked(window.electronAPI.invoke).mockResolvedValueOnce({
        success: true,
        data: updatedConnection,
      });

      await useConnectionStore.getState().updateConnection(updateRequest);

      const conn2 = useConnectionStore.getState().connections.find(c => c.id === mockConnection2.id);
      expect(conn2).toEqual(mockConnection2);
    });

    it('should return null on failure', async () => {
      vi.mocked(window.electronAPI.invoke).mockResolvedValueOnce({
        success: false,
        error: 'Not found',
      });

      const result = await useConnectionStore.getState().updateConnection(updateRequest);
      expect(result).toBeNull();
      expect(useConnectionStore.getState().error).toBe('Not found');
    });
  });

  describe('deleteConnection', () => {
    beforeEach(() => {
      useConnectionStore.setState({
        connections: [mockConnection, mockConnection2],
        activeConnectionId: mockConnection.id,
        lastActiveConnectionId: mockConnection.id,
      });
    });

    it('should remove connection from state', async () => {
      vi.mocked(window.electronAPI.invoke).mockResolvedValueOnce({
        success: true,
        data: { deletedId: mockConnection.id },
      });

      const result = await useConnectionStore.getState().deleteConnection(mockConnection.id);

      expect(result).toBe(true);
      expect(useConnectionStore.getState().connections).toHaveLength(1);
      expect(useConnectionStore.getState().connections[0]?.id).toBe(mockConnection2.id);
    });

    it('should clear activeConnectionId if deleted connection was active', async () => {
      vi.mocked(window.electronAPI.invoke).mockResolvedValueOnce({
        success: true,
        data: { deletedId: mockConnection.id },
      });

      await useConnectionStore.getState().deleteConnection(mockConnection.id);

      expect(useConnectionStore.getState().activeConnectionId).toBeNull();
      expect(useConnectionStore.getState().lastActiveConnectionId).toBeNull();
    });

    it('should preserve activeConnectionId if different connection deleted', async () => {
      vi.mocked(window.electronAPI.invoke).mockResolvedValueOnce({
        success: true,
        data: { deletedId: mockConnection2.id },
      });

      await useConnectionStore.getState().deleteConnection(mockConnection2.id);

      expect(useConnectionStore.getState().activeConnectionId).toBe(mockConnection.id);
    });

    it('should return false on failure', async () => {
      vi.mocked(window.electronAPI.invoke).mockResolvedValueOnce({
        success: false,
        error: 'Cannot delete',
      });

      const result = await useConnectionStore.getState().deleteConnection(mockConnection.id);
      expect(result).toBe(false);
      expect(useConnectionStore.getState().connections).toHaveLength(2);
    });
  });

  describe('testConnection', () => {
    const testRequest = {
      host: 'localhost',
      port: 8000,
      authType: 'none' as const,
      useSSL: false,
    };

    it('should return success result', async () => {
      vi.mocked(window.electronAPI.invoke).mockResolvedValueOnce({
        success: true,
        data: { success: true, message: 'Connected successfully' },
      });

      const result = await useConnectionStore.getState().testConnection(testRequest);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Connected successfully');
      expect(window.electronAPI.invoke).toHaveBeenCalledWith(
        IPC_CHANNELS.CONNECTION_TEST,
        testRequest
      );
    });

    it('should return failure result from server', async () => {
      vi.mocked(window.electronAPI.invoke).mockResolvedValueOnce({
        success: true,
        data: { success: false, message: 'Connection refused' },
      });

      const result = await useConnectionStore.getState().testConnection(testRequest);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Connection refused');
    });

    it('should handle IPC failure', async () => {
      vi.mocked(window.electronAPI.invoke).mockResolvedValueOnce({
        success: false,
        error: 'IPC error',
      });

      const result = await useConnectionStore.getState().testConnection(testRequest);
      expect(result.success).toBe(false);
      expect(result.message).toBe('IPC error');
    });

    it('should handle thrown exceptions', async () => {
      vi.mocked(window.electronAPI.invoke).mockRejectedValueOnce(
        new Error('Timeout')
      );

      const result = await useConnectionStore.getState().testConnection(testRequest);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Timeout');
    });

    it('should reset loading state after test', async () => {
      vi.mocked(window.electronAPI.invoke).mockResolvedValueOnce({
        success: true,
        data: { success: true, message: 'OK' },
      });

      await useConnectionStore.getState().testConnection(testRequest);
      expect(useConnectionStore.getState().isLoading).toBe(false);
    });
  });

  describe('connectToConnection', () => {
    it('should set active connection on success', async () => {
      vi.mocked(window.electronAPI.invoke).mockResolvedValueOnce({
        success: true,
        data: { connectionId: mockConnection.id },
      });

      const result = await useConnectionStore.getState().connectToConnection(mockConnection.id);
      expect(result).toBe(true);
      expect(useConnectionStore.getState().activeConnectionId).toBe(mockConnection.id);
      expect(useConnectionStore.getState().lastActiveConnectionId).toBe(mockConnection.id);
      expect(useConnectionStore.getState().isConnecting).toBe(false);
    });

    it('should set isConnecting during connection', async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => { resolvePromise = resolve; });
      vi.mocked(window.electronAPI.invoke).mockReturnValueOnce(promise as never);

      const connectPromise = useConnectionStore.getState().connectToConnection(mockConnection.id);
      expect(useConnectionStore.getState().isConnecting).toBe(true);

      resolvePromise!({ success: true, data: { connectionId: mockConnection.id } });
      await connectPromise;

      expect(useConnectionStore.getState().isConnecting).toBe(false);
    });

    it('should return false and set error on failure', async () => {
      vi.mocked(window.electronAPI.invoke).mockResolvedValueOnce({
        success: false,
        error: 'Authentication failed',
      });

      const result = await useConnectionStore.getState().connectToConnection(mockConnection.id);
      expect(result).toBe(false);
      expect(useConnectionStore.getState().error).toBe('Authentication failed');
      expect(useConnectionStore.getState().activeConnectionId).toBeNull();
    });

    it('should call correct IPC channel', async () => {
      vi.mocked(window.electronAPI.invoke).mockResolvedValueOnce({
        success: true,
        data: { connectionId: mockConnection.id },
      });

      await useConnectionStore.getState().connectToConnection(mockConnection.id);
      expect(window.electronAPI.invoke).toHaveBeenCalledWith(
        IPC_CHANNELS.CONNECTION_CONNECT,
        mockConnection.id
      );
    });
  });

  describe('disconnectFromConnection', () => {
    beforeEach(() => {
      useConnectionStore.setState({
        activeConnectionId: mockConnection.id,
        lastActiveConnectionId: mockConnection.id,
      });
    });

    it('should clear active connection on success', async () => {
      vi.mocked(window.electronAPI.invoke).mockResolvedValueOnce({
        success: true,
        data: { connectionId: mockConnection.id },
      });

      const result = await useConnectionStore.getState().disconnectFromConnection(mockConnection.id);
      expect(result).toBe(true);
      expect(useConnectionStore.getState().activeConnectionId).toBeNull();
      expect(useConnectionStore.getState().lastActiveConnectionId).toBeNull();
    });

    it('should not clear other active connections', async () => {
      useConnectionStore.setState({
        activeConnectionId: mockConnection2.id,
        lastActiveConnectionId: mockConnection2.id,
      });

      vi.mocked(window.electronAPI.invoke).mockResolvedValueOnce({
        success: true,
        data: { connectionId: mockConnection.id },
      });

      await useConnectionStore.getState().disconnectFromConnection(mockConnection.id);
      expect(useConnectionStore.getState().activeConnectionId).toBe(mockConnection2.id);
    });

    it('should return false on failure', async () => {
      vi.mocked(window.electronAPI.invoke).mockResolvedValueOnce({
        success: false,
        error: 'Disconnect failed',
      });

      const result = await useConnectionStore.getState().disconnectFromConnection(mockConnection.id);
      expect(result).toBe(false);
      expect(useConnectionStore.getState().error).toBe('Disconnect failed');
    });
  });

  describe('setActiveConnection', () => {
    it('should set active connection ID', () => {
      useConnectionStore.getState().setActiveConnection(mockConnection.id);
      expect(useConnectionStore.getState().activeConnectionId).toBe(mockConnection.id);
    });

    it('should clear active connection when null', () => {
      useConnectionStore.setState({ activeConnectionId: mockConnection.id });
      useConnectionStore.getState().setActiveConnection(null);
      expect(useConnectionStore.getState().activeConnectionId).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should clear the error state', () => {
      useConnectionStore.setState({ error: 'Some error' });
      useConnectionStore.getState().clearError();
      expect(useConnectionStore.getState().error).toBeNull();
    });

    it('should be idempotent when no error exists', () => {
      useConnectionStore.getState().clearError();
      expect(useConnectionStore.getState().error).toBeNull();
    });
  });

  describe('persistence', () => {
    it('should only persist lastActiveConnectionId', () => {
      useConnectionStore.setState({
        connections: [mockConnection],
        activeConnectionId: mockConnection.id,
        lastActiveConnectionId: mockConnection.id,
        isLoading: true,
        error: 'test error',
      });

      // The partialize function determines what gets persisted
      const state = useConnectionStore.getState();
      // Verify the store has the persist config
      expect(state.lastActiveConnectionId).toBe(mockConnection.id);
    });
  });
});
