import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { useConnectionStore } from '../../stores/connection-store';

interface ConnectionListProps {
  onNewConnection: () => void;
}

export function ConnectionList({ onNewConnection }: ConnectionListProps) {
  const {
    connections,
    activeConnectionId,
    lastActiveConnectionId,
    loadConnections,
    connectToConnection,
    deleteConnection,
    isLoading,
    isConnecting,
    error,
    clearError,
  } = useConnectionStore();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const hasAttemptedReconnect = useRef(false);
  const isAutoReconnecting = useRef(false);

  // Load connections on mount
  useEffect(() => {
    loadConnections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-reconnect to previously active connection after app restart
  useEffect(() => {
    const attemptReconnect = async () => {
      // Only attempt once, after connections are loaded
      // Use lastActiveConnectionId (persisted) for auto-reconnect, not activeConnectionId
      if (
        hasAttemptedReconnect.current ||
        isLoading ||
        connections.length === 0 ||
        !lastActiveConnectionId
      ) {
        return;
      }

      hasAttemptedReconnect.current = true;

      // Check if the persisted connection still exists
      const connectionExists = connections.some((c) => c.id === lastActiveConnectionId);
      if (connectionExists) {
        console.log('Auto-reconnecting to previously active connection:', lastActiveConnectionId);
        isAutoReconnecting.current = true;
        await connectToConnection(lastActiveConnectionId);
        isAutoReconnecting.current = false;
      }
    };

    attemptReconnect();
  }, [connections, lastActiveConnectionId, isLoading, connectToConnection]);

  // Display error toast when connection fails (but not during auto-reconnect)
  useEffect(() => {
    if (error && !isAutoReconnecting.current) {
      toast.error('Connection Failed', {
        description: error,
        duration: 5000,
      });
    }
    if (error) {
      clearError();
    }
  }, [error, clearError]);

  const handleConnect = async (connectionId: string) => {
    await connectToConnection(connectionId);
  };

  const handleDelete = async (connectionId: string) => {
    const confirmed = await deleteConnection(connectionId);
    if (confirmed) {
      setShowDeleteConfirm(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Connections</h2>
          <button
            onClick={onNewConnection}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md"
            title="New Connection (Cmd/Ctrl+Shift+C)"
          >
            + New
          </button>
        </div>
      </div>

      {/* Connection List */}
      <div className="flex-1 overflow-y-auto">
        {connections.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="mb-4">No connections configured</p>
            <button
              onClick={onNewConnection}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
            >
              Add Connection
            </button>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {connections.map((connection) => (
              <div
                key={connection.id}
                className={`relative p-3 rounded-md cursor-pointer transition-colors ${
                  connection.id === activeConnectionId
                    ? 'bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-600'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => handleConnect(connection.id)}
              >
                {/* Connection Info */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium truncate">{connection.name}</h3>
                      {connection.id === activeConnectionId && (
                        <span className="flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {connection.useSSL ? 'https://' : 'http://'}
                      {connection.host}:{connection.port}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      {connection.authType !== 'none' && (
                        <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded">
                          {connection.authType}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(connection.id);
                    }}
                    className="ml-2 p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600"
                    title="Delete connection"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                      />
                    </svg>
                  </button>
                </div>

                {/* Delete Confirmation */}
                {showDeleteConfirm === connection.id && (
                  <div
                    className="absolute inset-0 bg-white dark:bg-gray-800 rounded-md p-3 shadow-lg border-2 border-red-500"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="text-sm mb-2">Delete this connection?</p>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="px-2 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(connection.id)}
                        className="px-2 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {isConnecting && (
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm">Connecting...</p>
          </div>
        </div>
      )}
    </div>
  );
}
