import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ConnectionList } from '../connections/ConnectionList';
import { ConnectionDialog } from '../connections/ConnectionDialog';
import { useConnectionStore } from '@/stores/connection-store';

interface NavItem {
  name: string;
  path: string;
  icon: string;
  requiresConnection: boolean;
}

const navItems: NavItem[] = [
  { name: 'Home', path: '/', icon: '🏠', requiresConnection: false },
  { name: 'Collections', path: '/collections', icon: '📁', requiresConnection: true },
  { name: 'Query', path: '/query', icon: '🔍', requiresConnection: true },
];

function Sidebar() {
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const { activeConnectionId } = useConnectionStore();
  const hasActiveConnection = activeConnectionId !== null;

  return (
    <>
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        {/* Logo/Title */}
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold">ChromaDB UI</h1>
          <p className="text-xs text-muted-foreground mt-1">Desktop Application</p>
        </div>

        {/* Connections Section */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <ConnectionList onNewConnection={() => setShowConnectionDialog(true)} />
        </div>

        {/* Divider */}
        <div className="border-t border-border my-2"></div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems
            .filter((item) => !item.requiresConnection || hasActiveConnection)
            .map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-2 rounded-md transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )
              }
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">Version 1.0.0</p>
        </div>
      </aside>

      {/* Connection Dialog */}
      <ConnectionDialog
        isOpen={showConnectionDialog}
        onClose={() => setShowConnectionDialog(false)}
      />
    </>
  );
}

export default Sidebar;
