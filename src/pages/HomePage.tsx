import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Plus, CheckCircle2, Pencil, Trash2, Power, Lock, Shield } from 'lucide-react';
import { useConnectionStore } from '@/stores/connection-store';
import { ConnectionDialog } from '@/components/connections/ConnectionDialog';
import { Button } from '@/components/ui/button';
import { ConnectionProfile } from '../../shared/schemas';
import { toast } from 'sonner';

function HomePage() {
  const navigate = useNavigate();
  const {
    activeConnectionId,
    connections,
    connectToConnection,
    deleteConnection,
    isConnecting
  } = useConnectionStore();
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [editingConnection, setEditingConnection] = useState<ConnectionProfile | null>(null);

  const handleConnectToConnection = async (connectionId: string) => {
    const success = await connectToConnection(connectionId);
    if (success) {
      toast.success('Connected successfully');
      navigate('/collections');
    } else {
      toast.error('Failed to connect');
    }
  };

  const handleDeleteConnection = async (connectionId: string, connectionName: string) => {
    if (!confirm(`Are you sure you want to delete "${connectionName}"?`)) {
      return;
    }

    const success = await deleteConnection(connectionId);
    if (success) {
      toast.success('Connection deleted');
    } else {
      toast.error('Failed to delete connection');
    }
  };

  const handleEditConnection = (connection: ConnectionProfile) => {
    setEditingConnection(connection);
    setShowConnectionDialog(true);
  };

  const handleCloseDialog = () => {
    setShowConnectionDialog(false);
    setEditingConnection(null);
  };

  const getAuthIcon = (authType: string) => {
    switch (authType) {
      case 'token':
        return <Lock className="h-4 w-4" />;
      case 'basic':
        return <Shield className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Connections management view
  return (
    <div className="flex flex-col h-full p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Connections</h1>
          <p className="text-muted-foreground mt-1">
            Manage your ChromaDB connections
          </p>
        </div>
        <Button onClick={() => setShowConnectionDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Connection
        </Button>
      </div>

      {/* Connections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {connections.map((connection) => {
          const isActive = connection.id === activeConnectionId;

          return (
            <div
              key={connection.id}
              className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                isActive ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : ''
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Database className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-green-600' : 'text-muted-foreground'}`} />
                  <h3 className="font-semibold truncate">{connection.name}</h3>
                </div>
                {isActive && (
                  <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs px-2 py-1 rounded-full flex-shrink-0 ml-2">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Active</span>
                  </div>
                )}
              </div>

              {/* Connection Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-mono">
                    {connection.useSSL ? 'https://' : 'http://'}
                    {connection.host}:{connection.port}
                  </span>
                </div>
                {connection.authType !== 'none' && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {getAuthIcon(connection.authType)}
                    <span className="capitalize">{connection.authType} Auth</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {!isActive ? (
                  <Button
                    onClick={() => handleConnectToConnection(connection.id)}
                    disabled={isConnecting}
                    className="flex-1"
                    size="sm"
                  >
                    <Power className="mr-1 h-3.5 w-3.5" />
                    Connect
                  </Button>
                ) : (
                  <Button
                    onClick={() => navigate('/collections')}
                    className="flex-1"
                    size="sm"
                  >
                    View Collections
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditConnection(connection)}
                  title="Edit connection"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteConnection(connection.id, connection.name)}
                  title="Delete connection"
                  className="text-red-600 hover:text-red-700 hover:border-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State - when connections exist but none displayed */}
      {connections.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1">
          <Database className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No connections yet</p>
          <Button
            onClick={() => setShowConnectionDialog(true)}
            className="mt-4"
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Connection
          </Button>
        </div>
      )}

      {/* Connection Dialog */}
      <ConnectionDialog
        isOpen={showConnectionDialog}
        onClose={handleCloseDialog}
        connection={editingConnection}
      />
    </div>
  );
}

export default HomePage;
