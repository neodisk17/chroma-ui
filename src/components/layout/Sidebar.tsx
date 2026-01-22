import { useState } from 'react';
import { ChevronLeft, ChevronRight, Database, Plus } from 'lucide-react';
import { ConnectionList } from '../connections/ConnectionList';
import { useConnectionStore } from '@/stores/connection-store';

interface SidebarProps {
  onNewConnection: () => void;
}

function Sidebar({ onNewConnection }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { activeConnectionId } = useConnectionStore();

  return (
    <aside
      className={`${
        isCollapsed ? 'w-16' : 'w-64'
      } border-r border-border bg-card flex flex-col transition-all duration-300 ease-in-out relative`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card shadow-sm hover:bg-accent transition-colors"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      {/* Logo/Title */}
      <div className="p-6 border-b border-border overflow-hidden">
        {isCollapsed ? (
          <div className="flex justify-center">
            <Database className="h-6 w-6" />
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold whitespace-nowrap">ChromaDB UI</h1>
            <p className="text-xs text-muted-foreground mt-1">Desktop Application</p>
          </>
        )}
      </div>

      {/* Connections Section - Only show when no active connection */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {isCollapsed ? (
          <div className="flex justify-center pt-4">
            {!activeConnectionId && (
              <button
                onClick={onNewConnection}
                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent transition-colors"
                aria-label="Add new connection"
                title="Add new connection"
              >
                <Plus className="h-5 w-5" />
              </button>
            )}
          </div>
        ) : activeConnectionId ? (
          // Connected state - show minimal placeholder
          <div className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Connected
            </div>
            <p className="text-xs text-muted-foreground">
              Use the context bar above to manage connections
            </p>
          </div>
        ) : (
          // Not connected - show ConnectionList
          <ConnectionList onNewConnection={onNewConnection} />
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border overflow-hidden">
        <p className={`text-muted-foreground text-center ${isCollapsed ? 'text-[10px]' : 'text-xs'}`}>
          {isCollapsed ? 'v1.0.0' : 'Version 1.0.0'}
        </p>
      </div>
    </aside>
  );
}

export default Sidebar;
