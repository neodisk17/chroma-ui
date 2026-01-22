import { useLocation } from 'react-router-dom';
import { ContextBar } from './ContextBar';

// Map routes to titles
const routeTitles: Record<string, string> = {
  '/': 'Home',
  '/collections': 'Collections',
  '/query': 'Query Builder',
};

interface HeaderProps {
  onNewConnection: () => void;
  onNewCollection: () => void;
}

function Header({ onNewConnection, onNewCollection }: HeaderProps) {
  const location = useLocation();

  // Get the current page title based on the route
  const getPageTitle = () => {
    const path = location.pathname;
    // Check for exact match
    if (routeTitles[path]) {
      return routeTitles[path];
    }
    // Check for dynamic routes (e.g., /collections/:id/documents)
    if (path.includes('/documents')) {
      return 'Documents';
    }
    return 'ChromaDB UI';
  };

  return (
    <header className="border-b border-border bg-card">
      <div className="h-16 flex items-center px-6">
        <div className="flex items-center justify-between w-full">
          {/* Page Title */}
          <div>
            <h2 className="text-2xl font-semibold">{getPageTitle()}</h2>
          </div>

          {/* Right side - Additional header items can be added here */}
          <div className="flex items-center gap-4">
            {/* Additional header items can be added here */}
          </div>
        </div>
      </div>

      {/* Context Bar - replaces ConnectionStatus */}
      <ContextBar
        onNewConnection={onNewConnection}
        onNewCollection={onNewCollection}
      />
    </header>
  );
}

export default Header;
