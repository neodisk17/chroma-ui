import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Plus, CheckCircle2 } from 'lucide-react';
import { useConnectionStore } from '@/stores/connection-store';
import { ConnectionDialog } from '@/components/connections/ConnectionDialog';
import { Button } from '@/components/ui/button';

function HomePage() {
  const navigate = useNavigate();
  const { activeConnectionId, connections } = useConnectionStore();
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);

  const activeConnection = connections.find((c) => c.id === activeConnectionId);

  // No connection state - show welcome screen
  if (!activeConnectionId || connections.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center h-full p-6">
          <div className="text-center space-y-6 max-w-md">
            {/* Icon */}
            <Database className="h-20 w-20 mx-auto text-muted-foreground" />

            {/* Welcome message */}
            <div className="space-y-2">
              <h1 className="text-4xl font-bold">Welcome to ChromaDB UI</h1>
              <p className="text-muted-foreground">
                A desktop application for managing ChromaDB collections and documents
              </p>
            </div>

            {/* Call to action */}
            <Button
              onClick={() => setShowConnectionDialog(true)}
              size="lg"
              className="mt-4"
            >
              <Plus className="mr-2 h-5 w-5" />
              Create Your First Connection
            </Button>

            {/* Feature list */}
            <div className="pt-6 text-sm text-muted-foreground">
              <p className="font-medium mb-3">After connecting, you'll be able to:</p>
              <div className="space-y-2 text-left">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Browse and manage collections</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Query your vector data</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>View embeddings and metadata</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Connection Dialog */}
        <ConnectionDialog
          isOpen={showConnectionDialog}
          onClose={() => setShowConnectionDialog(false)}
        />
      </>
    );
  }

  // Connected state - show connection info and quick actions
  return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      <div className="text-center space-y-6 max-w-2xl">
        <h1 className="text-4xl font-bold">Welcome to ChromaDB UI</h1>

        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            <h2 className="text-xl font-semibold">Connected to {activeConnection?.name}</h2>
          </div>
          <p className="text-muted-foreground mb-6">
            {activeConnection?.useSSL ? 'https://' : 'http://'}
            {activeConnection?.host}:{activeConnection?.port}
          </p>

          {/* Quick actions */}
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate('/collections')}>
              📁 View Collections
            </Button>
            <Button variant="outline" onClick={() => navigate('/query')}>
              🔍 Query Data
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
