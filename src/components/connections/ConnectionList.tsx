import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useConnectionStore } from '../../stores/connection-store';

interface ConnectionListProps {
  onNewConnection: () => void;
}

export function ConnectionList({ onNewConnection }: ConnectionListProps) {
  const navigate = useNavigate();
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
        const success = await connectToConnection(lastActiveConnectionId);
        isAutoReconnecting.current = false;
        if (success) {
          navigate('/collections');
        }
      }
    };

    attemptReconnect();
  }, [connections, lastActiveConnectionId, isLoading, connectToConnection, navigate]);

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
    const success = await connectToConnection(connectionId);
    if (success) {
      navigate('/collections');
    }
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
          <div className="h-10 bg-secondary rounded" />
          <div className="h-10 bg-secondary rounded" />
          <div className="h-10 bg-secondary rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Connections</h2>
          <button
            onClick={onNewConnection}
            className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs rounded-md transition-colors"
            title="New Connection (Cmd/Ctrl+Shift+C)"
          >
            + New
          </button>
        </div>
      </div>

      {/* Connection List */}
      <div className="flex-1 overflow-y-auto">
        {connections.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p className="mb-4 text-sm">No connections configured</p>
            <button
              onClick={onNewConnection}
              className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-sm rounded-md transition-colors"
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
                    ? 'bg-primary/10 border-l-2 border-primary'
                    : 'hover:bg-accent'
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
                    <p className="text-xs text-muted-foreground truncate font-mono mt-0.5">
                      {connection.useSSL ? 'https://' : 'http://'}
                      {connection.host}:{connection.port}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      {connection.authType !== 'none' && (
                        <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">
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
                    className="ml-2 p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors"
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
                    className="absolute inset-0 bg-card rounded-md p-3 shadow-lg border border-destructive/50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="text-xs mb-2 text-foreground">Delete this connection?</p>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="px-2 py-1 text-xs bg-secondary hover:bg-accent rounded transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(connection.id)}
                        className="px-2 py-1 text-xs bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded transition-colors"
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
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-card p-4 rounded-lg shadow-lg border border-border">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
            <p className="mt-2 text-xs text-muted-foreground text-center">Connecting…</p>
          </div>
        </div>
      )}
    </div>
  );
}
