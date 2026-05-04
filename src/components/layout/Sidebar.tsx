import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ConnectionList } from '../connections/ConnectionList';
import { ChromaLogo } from '../ui/ChromaLogo';
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
      {/* Collapse toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card shadow-sm hover:bg-accent transition-colors"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      {/* Logo */}
      <div className={`border-b border-border overflow-hidden flex items-center ${isCollapsed ? 'p-3 justify-center' : 'p-4'}`}>
        {isCollapsed ? (
          <ChromaLogo compact className="h-9 w-9" />
        ) : (
          <ChromaLogo className="h-11 w-auto" />
        )}
      </div>

      {/* Connections */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {isCollapsed ? (
          <div className="flex justify-center pt-4">
            {!activeConnectionId && (
              <button
                onClick={onNewConnection}
                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Add new connection"
                title="New Connection"
              >
                <span className="text-lg leading-none">+</span>
              </button>
            )}
          </div>
        ) : activeConnectionId ? (
          <div className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-1">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              Connected
            </div>
            <p className="text-xs text-muted-foreground">
              Use the header to navigate
            </p>
          </div>
        ) : (
          <ConnectionList onNewConnection={onNewConnection} />
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border overflow-hidden">
        <p className={`text-muted-foreground text-center ${isCollapsed ? 'text-[9px]' : 'text-[11px]'}`}>
          {isCollapsed ? 'v1.0' : 'Version 1.0.0'}
        </p>
      </div>
    </aside>
  );
}

export default Sidebar;
