import { useLocation } from 'react-router-dom';
import { ConnectionStatus } from '../connections/ConnectionStatus';

// Map routes to titles
const routeTitles: Record<string, string> = {
  '/': 'Home',
  '/collections': 'Collections',
  '/query': 'Query Builder',
};

function Header() {
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

          {/* Right side - Connection Status */}
          <div className="flex items-center gap-4">
            {/* Additional header items can be added here */}
          </div>
        </div>
      </div>

      {/* Connection Status Bar */}
      <ConnectionStatus />
    </header>
  );
}

export default Header;
