import { useState } from 'react';
import { ConnectionList } from '../connections/ConnectionList';
import { ConnectionDialog } from '../connections/ConnectionDialog';


function Sidebar() {
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);

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
