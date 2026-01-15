import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useConnectionStore } from '@/stores/connection-store';

function QueryPage() {
  const navigate = useNavigate();
  const { activeConnectionId } = useConnectionStore();

  // Show empty state if no connection is active
  if (!activeConnectionId) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center space-y-4">
          <Search className="h-16 w-16 mx-auto text-muted-foreground" />
          <h2 className="text-2xl font-semibold">No Connection Selected</h2>
          <p className="text-muted-foreground">
            Please select or create a connection to access Query
          </p>
          <Button onClick={() => navigate('/')}>Go to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Query Builder</h1>
      <p className="text-muted-foreground">Query builder will be implemented in Phase 5</p>
    </div>
  );
}

export default QueryPage;
