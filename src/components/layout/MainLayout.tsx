import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { ConnectionDialog } from '../connections/ConnectionDialog';
import { CollectionDialog } from '../collections/CollectionDialog';
import { useGlobalKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useConnectionStore } from '@/stores/connection-store';

function MainLayout() {
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);
  const { activeConnectionId } = useConnectionStore();

  // Set up global keyboard shortcuts
  useGlobalKeyboardShortcuts({
    onShowHelp: () => setShowKeyboardHelp(true),
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar - only show when no connection is active */}
      {!activeConnectionId && (
        <Sidebar onNewConnection={() => setShowConnectionDialog(true)} />
      )}

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <Header
          onNewConnection={() => setShowConnectionDialog(true)}
          onNewCollection={() => setShowCollectionDialog(true)}
        />

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Keyboard shortcuts help dialog */}
      <KeyboardShortcutsDialog
        open={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
      />

      {/* Connection Dialog */}
      <ConnectionDialog
        isOpen={showConnectionDialog}
        onClose={() => setShowConnectionDialog(false)}
      />

      {/* Collection Dialog */}
      <CollectionDialog
        open={showCollectionDialog}
        onOpenChange={setShowCollectionDialog}
      />
    </div>
  );
}

export default MainLayout;
