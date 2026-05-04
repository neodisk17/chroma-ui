import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { ContextBar } from './ContextBar';
import { ChromaLogo } from '../ui/ChromaLogo';
import { useConnectionStore } from '@/stores/connection-store';
import { useTheme } from '@/hooks/use-theme';

function ThemeToggle({ theme, toggle }: { theme: 'dark' | 'light'; toggle: () => void }) {
  return (
    <button
      onClick={toggle}
      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

const NAV_ITEMS: { to: string; label: string; onlyInsideCollection?: boolean }[] = [
  { to: '/collections', label: 'Collections' },
  { to: '/query', label: 'Query', onlyInsideCollection: true },
];

interface HeaderProps {
  onNewConnection: () => void;
}

function Header({ onNewConnection }: HeaderProps) {
  const location = useLocation();
  const { activeConnectionId } = useConnectionStore();
  const { theme, toggle } = useTheme();
  const isInsideCollection = /\/collections\/[^/]+/.test(location.pathname) || location.pathname.startsWith('/query');

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
      {activeConnectionId ? (
        <div className="flex items-center justify-between px-4" style={{ height: '52px' }}>
          <div className="flex items-center gap-3">
            {/* Compact logo */}
            <ChromaLogo compact className="h-8 w-8 flex-shrink-0" />

            {/* Divider */}
            <div className="h-5 w-px bg-border flex-shrink-0" />

            {/* Navigation */}
            <nav className="flex items-center gap-0.5">
              {NAV_ITEMS.filter(({ onlyInsideCollection }) => !onlyInsideCollection || isInsideCollection).map(({ to, label }) => {
                const isActive = location.pathname.startsWith(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    className={[
                      'px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-primary/15 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                    ].join(' ')}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <ThemeToggle theme={theme} toggle={toggle} />
        </div>
      ) : (
        <div className="flex items-center justify-between px-6" style={{ height: '52px' }}>
          <span className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
            Connections
          </span>
          <ThemeToggle theme={theme} toggle={toggle} />
        </div>
      )}

      <ContextBar onNewConnection={onNewConnection} />
    </header>
  );
}

export default Header;
