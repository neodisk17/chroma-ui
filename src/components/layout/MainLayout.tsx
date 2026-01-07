import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { useGlobalKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

function MainLayout() {
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // Set up global keyboard shortcuts
  useGlobalKeyboardShortcuts({
    onShowHelp: () => setShowKeyboardHelp(true),
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <Header />

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
    </div>
  );
}

export default MainLayout;
