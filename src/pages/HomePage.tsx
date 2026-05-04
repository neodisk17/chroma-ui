import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Plus, CheckCircle2, Pencil, Trash2, Power, Lock, Shield, Layers, Zap } from 'lucide-react';
import { useConnectionStore } from '@/stores/connection-store';
import { ConnectionDialog } from '@/components/connections/ConnectionDialog';
import { Button } from '@/components/ui/button';
import { ChromaLogo } from '@/components/ui/ChromaLogo';
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

  const handleConnect = async (connectionId: string) => {
    const success = await connectToConnection(connectionId);
    if (success) {
      toast.success('Connected successfully');
      navigate('/collections');
    } else {
      toast.error('Failed to connect');
    }
  };

  const handleDelete = async (connectionId: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    const success = await deleteConnection(connectionId);
    if (success) {
      toast.success('Connection deleted');
    } else {
      toast.error('Failed to delete connection');
    }
  };

  const handleEdit = (connection: ConnectionProfile) => {
    setEditingConnection(connection);
    setShowConnectionDialog(true);
  };

  const handleCloseDialog = () => {
    setShowConnectionDialog(false);
    setEditingConnection(null);
  };

  const getAuthIcon = (authType: string) => {
    if (authType === 'token') return <Lock className="h-3.5 w-3.5" />;
    if (authType === 'basic') return <Shield className="h-3.5 w-3.5" />;
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-dot-grid overflow-auto">
      {/* Top header */}
      <div className="flex items-center justify-between px-8 pt-8 pb-6">
        <ChromaLogo className="h-12 w-auto" />
        <Button
          onClick={() => setShowConnectionDialog(true)}
          className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 hover:border-primary/50 transition-all"
          variant="ghost"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Connection
        </Button>
      </div>

      {/* Connections section */}
      {connections.length > 0 && (
        <div className="px-8 flex-1">
          {/* Section header */}
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest">
              Connections
            </span>
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] font-mono text-muted-foreground">
              {connections.length} saved
            </span>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connections.map((connection) => {
              const isActive = connection.id === activeConnectionId;

              return (
                <div
                  key={connection.id}
                  className={`relative rounded-lg transition-all duration-200 ${
                    isActive
                      ? ''
                      : 'border border-border bg-card hover:border-primary/30 hover:bg-secondary/20'
                  }`}
                  style={isActive ? {
                    background: 'linear-gradient(hsl(var(--background)), hsl(var(--background))) padding-box, linear-gradient(135deg, #22D3EE, #0EA5E9) border-box',
                    border: '1px solid transparent',
                  } : undefined}
                >
                  {/* Active accent bar */}
                  {isActive && (
                    <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                  )}

                  <div className="p-4">
                    {/* Card header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className={`p-1.5 rounded-md ${isActive ? 'bg-primary/15' : 'bg-secondary'}`}>
                          <Database className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <h3 className="font-semibold truncate text-sm">{connection.name}</h3>
                      </div>
                      {isActive && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/12 text-primary text-[11px] font-medium ml-2 flex-shrink-0 border border-primary/20">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </div>
                      )}
                    </div>

                    {/* Connection URL */}
                    <div className="mb-4 space-y-1.5">
                      <span className="font-mono text-[11px] text-muted-foreground bg-secondary/60 px-2 py-1 rounded inline-block truncate max-w-full">
                        {connection.useSSL ? 'https://' : 'http://'}{connection.host}:{connection.port}
                      </span>
                      {connection.authType !== 'none' && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          {getAuthIcon(connection.authType)}
                          <span className="capitalize">{connection.authType} Auth</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {!isActive ? (
                        <Button
                          onClick={() => handleConnect(connection.id)}
                          disabled={isConnecting}
                          className="flex-1 h-8 text-xs bg-primary/8 hover:bg-primary/16 text-primary border border-primary/25 hover:border-primary/45"
                          variant="ghost"
                          size="sm"
                        >
                          <Power className="mr-1.5 h-3.5 w-3.5" />
                          Connect
                        </Button>
                      ) : (
                        <Button
                          onClick={() => navigate('/collections')}
                          className="flex-1 h-8 text-xs bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30"
                          variant="ghost"
                          size="sm"
                        >
                          <Layers className="mr-1.5 h-3.5 w-3.5" />
                          View Collections
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(connection)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
                        title="Edit connection"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(connection.id, connection.name)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Delete connection"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add new connection card */}
            <button
              onClick={() => setShowConnectionDialog(true)}
              className="rounded-lg border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 p-4 flex items-center justify-center gap-2 text-muted-foreground hover:text-primary text-sm group min-h-[130px]"
            >
              <Plus className="h-4 w-4 group-hover:scale-110 transition-transform" />
              <span>Add connection</span>
            </button>
          </div>

          {/* Bottom info strip */}
          <div className="mt-8 pt-5 border-t border-border flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Zap className="h-3.5 w-3.5 text-primary/60" />
              <span>Click <span className="font-mono bg-secondary px-1.5 py-0.5 rounded text-[11px]">Connect</span> to activate a connection</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Database className="h-3.5 w-3.5 text-primary/60" />
              <span>Supports ChromaDB v0.4+ with HTTP or HTTPS</span>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {connections.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 text-center px-8">
          <div className="p-4 rounded-xl bg-secondary/60 mb-5 border border-border">
            <Database className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold mb-2">No connections yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs leading-relaxed">
            Add a ChromaDB connection to start browsing your vector collections
          </p>
          <Button
            onClick={() => setShowConnectionDialog(true)}
            className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 hover:border-primary/50"
            variant="ghost"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Connection
          </Button>
        </div>
      )}

      <ConnectionDialog
        isOpen={showConnectionDialog}
        onClose={handleCloseDialog}
        connection={editingConnection}
      />
    </div>
  );
}

export default HomePage;
