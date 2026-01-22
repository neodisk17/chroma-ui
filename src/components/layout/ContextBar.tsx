import { useState, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Database, ChevronDown, ChevronRight, FolderOpen, Plus, LogOut, List } from 'lucide-react';
import { useConnectionStore } from '@/stores/connection-store';
import { useCollections } from '@/hooks/use-chromadb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ContextBarProps {
  onNewConnection: () => void;
  onNewCollection: () => void;
}

export function ContextBar({ onNewConnection, onNewCollection }: ContextBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { collectionId } = useParams<{ collectionId: string }>();

  const {
    connections,
    activeConnectionId,
    connectToConnection,
    disconnectFromConnection,
  } = useConnectionStore();

  const { data: collections = [] } = useCollections();

  const [connectionSearch, setConnectionSearch] = useState('');
  const [collectionSearch, setCollectionSearch] = useState('');

  const activeConnection = connections.find((c) => c.id === activeConnectionId);
  const isOnCollectionsRoute = location.pathname.includes('/collections');

  // Filter connections by search
  const filteredConnections = useMemo(() => {
    if (!connectionSearch) return connections;
    const search = connectionSearch.toLowerCase();
    return connections.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        c.host.toLowerCase().includes(search)
    );
  }, [connections, connectionSearch]);

  // Filter collections by search
  const filteredCollections = useMemo(() => {
    if (!collectionSearch) return collections;
    const search = collectionSearch.toLowerCase();
    return collections.filter((c) => c.name.toLowerCase().includes(search));
  }, [collections, collectionSearch]);

  const handleSwitchConnection = async (connectionId: string) => {
    const success = await connectToConnection(connectionId);
    if (success) {
      navigate('/collections');
    }
  };

  const handleDisconnect = async () => {
    if (activeConnection) {
      await disconnectFromConnection(activeConnection.id);
      navigate('/');
    }
  };

  const handleSelectCollection = (collectionName: string) => {
    navigate(`/collections/${collectionName}/documents`);
  };

  const handleViewAllCollections = () => {
    navigate('/collections');
  };

  // Don't render if no active connection
  if (!activeConnection) {
    return (
      <div className="flex items-center justify-between px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 border-b border-yellow-300 dark:border-yellow-700">
        <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
          <Database className="h-4 w-4" />
          <span className="text-sm font-medium">No connection active</span>
        </div>
        <Button variant="outline" size="sm" onClick={onNewConnection}>
          <Plus className="h-4 w-4 mr-1" />
          Connect
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
      {/* Left: Breadcrumb navigation */}
      <div className="flex items-center gap-1">
        {/* Connection Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 font-medium">
              <Database className="h-4 w-4 text-green-600" />
              <span className="max-w-[150px] truncate">{activeConnection.name}</span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {/* Search Input */}
            <div className="p-2">
              <Input
                placeholder="Search connections..."
                value={connectionSearch}
                onChange={(e) => setConnectionSearch(e.target.value)}
                className="h-8"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <DropdownMenuSeparator />

            {/* Connection List */}
            <div className="max-h-48 overflow-y-auto">
              {filteredConnections.length === 0 ? (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  No connections found
                </div>
              ) : (
                filteredConnections.map((conn) => (
                  <DropdownMenuItem
                    key={conn.id}
                    onClick={() => handleSwitchConnection(conn.id)}
                    className={conn.id === activeConnectionId ? 'bg-accent' : ''}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Database className="h-4 w-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{conn.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {conn.host}:{conn.port}
                        </div>
                      </div>
                      {conn.id === activeConnectionId && (
                        <span className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
                      )}
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </div>

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onNewConnection}>
              <Plus className="h-4 w-4 mr-2" />
              Add Connection
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDisconnect} className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Collection Dropdown (when on /collections route) */}
        {isOnCollectionsRoute && (
          <>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 font-medium">
                  <FolderOpen className="h-4 w-4 text-blue-600" />
                  <span className="max-w-[150px] truncate">
                    {collectionId || 'Select Collection'}
                  </span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                {/* Search Input */}
                <div className="p-2">
                  <Input
                    placeholder="Search collections..."
                    value={collectionSearch}
                    onChange={(e) => setCollectionSearch(e.target.value)}
                    className="h-8"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <DropdownMenuSeparator />

                {/* Collection List */}
                <div className="max-h-48 overflow-y-auto">
                  {filteredCollections.length === 0 ? (
                    <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                      No collections found
                    </div>
                  ) : (
                    filteredCollections.map((coll) => (
                      <DropdownMenuItem
                        key={coll.name}
                        onClick={() => handleSelectCollection(coll.name)}
                        className={coll.name === collectionId ? 'bg-accent' : ''}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <FolderOpen className="h-4 w-4 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{coll.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {coll.count ?? 0} documents
                            </div>
                          </div>
                          {coll.name === collectionId && (
                            <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onNewCollection}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Collection
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleViewAllCollections}>
                  <List className="h-4 w-4 mr-2" />
                  View All Collections
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>

      {/* Right: Connection info */}
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span className="text-xs text-muted-foreground">
          {activeConnection.useSSL ? 'https://' : 'http://'}
          {activeConnection.host}:{activeConnection.port}
        </span>
      </div>
    </div>
  );
}
