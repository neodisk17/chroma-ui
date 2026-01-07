import { useConnectionStore } from '../../stores/connection-store';

export function ConnectionStatus() {
  const { connections, activeConnectionId, disconnectFromConnection } = useConnectionStore();

  const activeConnection = connections.find((c) => c.id === activeConnectionId);

  if (!activeConnection) {
    return (
      <div className="flex items-center space-x-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900 border-l-4 border-yellow-600">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5 text-yellow-600"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
        <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
          Not connected to any ChromaDB instance
        </span>
      </div>
    );
  }

  const handleDisconnect = async () => {
    if (activeConnection) {
      await disconnectFromConnection(activeConnection.id);
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-green-100 dark:bg-green-900 border-l-4 border-green-600">
      <div className="flex items-center space-x-3">
        {/* Connected Indicator */}
        <div className="flex items-center space-x-2">
          <span className="flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-sm font-medium text-green-800 dark:text-green-200">
            Connected
          </span>
        </div>

        {/* Connection Info */}
        <div className="flex items-center space-x-2 text-sm text-green-700 dark:text-green-300">
          <span className="font-medium">{activeConnection.name}</span>
          <span className="text-green-600 dark:text-green-400">•</span>
          <span>
            {activeConnection.useSSL ? 'https://' : 'http://'}
            {activeConnection.host}:{activeConnection.port}
          </span>
          {activeConnection.authType !== 'none' && (
            <>
              <span className="text-green-600 dark:text-green-400">•</span>
              <span className="text-xs bg-green-200 dark:bg-green-700 px-2 py-0.5 rounded">
                {activeConnection.authType}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Disconnect Button */}
      <button
        onClick={handleDisconnect}
        className="px-3 py-1 text-sm bg-green-200 hover:bg-green-300 dark:bg-green-700 dark:hover:bg-green-600 text-green-800 dark:text-green-200 rounded-md transition-colors"
        title="Disconnect from this ChromaDB instance"
      >
        Disconnect
      </button>
    </div>
  );
}
