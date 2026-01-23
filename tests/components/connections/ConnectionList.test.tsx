import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConnectionList } from '../../../src/components/connections/ConnectionList';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock connection store
const mockConnectionStore = {
  connections: [] as any[],
  activeConnectionId: null as string | null,
  lastActiveConnectionId: null as string | null,
  loadConnections: vi.fn(),
  connectToConnection: vi.fn(),
  deleteConnection: vi.fn(),
  isLoading: false,
  isConnecting: false,
  error: null as string | null,
  clearError: vi.fn(),
};

vi.mock('../../../src/stores/connection-store', () => ({
  useConnectionStore: () => mockConnectionStore,
}));

describe('ConnectionList', () => {
  const defaultProps = {
    onNewConnection: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockConnectionStore.connections = [];
    mockConnectionStore.activeConnectionId = null;
    mockConnectionStore.lastActiveConnectionId = null;
    mockConnectionStore.isLoading = false;
    mockConnectionStore.isConnecting = false;
    mockConnectionStore.error = null;
  });

  it('renders loading skeleton when isLoading is true', () => {
    mockConnectionStore.isLoading = true;
    const { container } = render(<ConnectionList {...defaultProps} />);

    // Loading skeletons have animate-pulse class
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it('renders empty state when no connections exist', () => {
    mockConnectionStore.connections = [];
    render(<ConnectionList {...defaultProps} />);

    expect(screen.getByText('No connections configured')).toBeInTheDocument();
    expect(screen.getByText('Add Connection')).toBeInTheDocument();
  });

  it('calls onNewConnection when + New button is clicked', () => {
    mockConnectionStore.connections = [
      { id: '1', name: 'Test', host: 'localhost', port: 8000, authType: 'none', useSSL: false },
    ];
    const onNewConnection = vi.fn();
    render(<ConnectionList onNewConnection={onNewConnection} />);

    fireEvent.click(screen.getByText('+ New'));
    expect(onNewConnection).toHaveBeenCalled();
  });

  it('calls onNewConnection when Add Connection button is clicked in empty state', () => {
    const onNewConnection = vi.fn();
    render(<ConnectionList onNewConnection={onNewConnection} />);

    fireEvent.click(screen.getByText('Add Connection'));
    expect(onNewConnection).toHaveBeenCalled();
  });

  it('renders connection list with connection details', () => {
    mockConnectionStore.connections = [
      { id: '1', name: 'Local DB', host: 'localhost', port: 8000, authType: 'none', useSSL: false },
      { id: '2', name: 'Remote DB', host: 'db.example.com', port: 443, authType: 'token', useSSL: true },
    ];
    render(<ConnectionList {...defaultProps} />);

    expect(screen.getByText('Local DB')).toBeInTheDocument();
    expect(screen.getByText('http://localhost:8000')).toBeInTheDocument();
    expect(screen.getByText('Remote DB')).toBeInTheDocument();
    expect(screen.getByText('https://db.example.com:443')).toBeInTheDocument();
  });

  it('shows auth type badge when auth is not none', () => {
    mockConnectionStore.connections = [
      { id: '1', name: 'Token Auth', host: 'localhost', port: 8000, authType: 'token', useSSL: false },
    ];
    render(<ConnectionList {...defaultProps} />);

    expect(screen.getByText('token')).toBeInTheDocument();
  });

  it('does not show auth badge when auth is none', () => {
    mockConnectionStore.connections = [
      { id: '1', name: 'No Auth', host: 'localhost', port: 8000, authType: 'none', useSSL: false },
    ];
    render(<ConnectionList {...defaultProps} />);

    // Should not have token/basic badge
    expect(screen.queryByText('none')).not.toBeInTheDocument();
  });

  it('calls connectToConnection when a connection item is clicked', async () => {
    mockConnectionStore.connections = [
      { id: 'conn-1', name: 'My DB', host: 'localhost', port: 8000, authType: 'none', useSSL: false },
    ];
    mockConnectionStore.connectToConnection.mockResolvedValue(true);

    render(<ConnectionList {...defaultProps} />);

    fireEvent.click(screen.getByText('My DB'));

    await waitFor(() => {
      expect(mockConnectionStore.connectToConnection).toHaveBeenCalledWith('conn-1');
    });
  });

  it('navigates to /collections on successful connection', async () => {
    mockConnectionStore.connections = [
      { id: 'conn-1', name: 'My DB', host: 'localhost', port: 8000, authType: 'none', useSSL: false },
    ];
    mockConnectionStore.connectToConnection.mockResolvedValue(true);

    render(<ConnectionList {...defaultProps} />);

    fireEvent.click(screen.getByText('My DB'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/collections');
    });
  });

  it('does not navigate on failed connection', async () => {
    mockConnectionStore.connections = [
      { id: 'conn-1', name: 'My DB', host: 'localhost', port: 8000, authType: 'none', useSSL: false },
    ];
    mockConnectionStore.connectToConnection.mockResolvedValue(false);

    render(<ConnectionList {...defaultProps} />);

    fireEvent.click(screen.getByText('My DB'));

    await waitFor(() => {
      expect(mockConnectionStore.connectToConnection).toHaveBeenCalled();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows delete confirmation when delete button is clicked', () => {
    mockConnectionStore.connections = [
      { id: '1', name: 'My DB', host: 'localhost', port: 8000, authType: 'none', useSSL: false },
    ];
    render(<ConnectionList {...defaultProps} />);

    const deleteButton = screen.getByTitle('Delete connection');
    fireEvent.click(deleteButton);

    expect(screen.getByText('Delete this connection?')).toBeInTheDocument();
  });

  it('cancels delete when Cancel is clicked in confirmation', () => {
    mockConnectionStore.connections = [
      { id: '1', name: 'My DB', host: 'localhost', port: 8000, authType: 'none', useSSL: false },
    ];
    render(<ConnectionList {...defaultProps} />);

    fireEvent.click(screen.getByTitle('Delete connection'));
    fireEvent.click(screen.getByText('Cancel'));

    expect(screen.queryByText('Delete this connection?')).not.toBeInTheDocument();
  });

  it('calls deleteConnection when Delete is confirmed', async () => {
    mockConnectionStore.connections = [
      { id: 'conn-1', name: 'My DB', host: 'localhost', port: 8000, authType: 'none', useSSL: false },
    ];
    mockConnectionStore.deleteConnection.mockResolvedValue(true);

    render(<ConnectionList {...defaultProps} />);

    fireEvent.click(screen.getByTitle('Delete connection'));
    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(mockConnectionStore.deleteConnection).toHaveBeenCalledWith('conn-1');
    });
  });

  it('shows connecting overlay when isConnecting is true', () => {
    mockConnectionStore.isConnecting = true;
    mockConnectionStore.connections = [
      { id: '1', name: 'My DB', host: 'localhost', port: 8000, authType: 'none', useSSL: false },
    ];
    render(<ConnectionList {...defaultProps} />);

    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });

  it('highlights active connection with special styling', () => {
    mockConnectionStore.connections = [
      { id: 'active-conn', name: 'Active DB', host: 'localhost', port: 8000, authType: 'none', useSSL: false },
      { id: 'other-conn', name: 'Other DB', host: 'other.host', port: 8000, authType: 'none', useSSL: false },
    ];
    mockConnectionStore.activeConnectionId = 'active-conn';

    const { container } = render(<ConnectionList {...defaultProps} />);

    // Active connection should have border-blue-600 class
    const activeElement = container.querySelector('.border-blue-600');
    expect(activeElement).not.toBeNull();
  });

  it('calls loadConnections on mount', () => {
    render(<ConnectionList {...defaultProps} />);
    expect(mockConnectionStore.loadConnections).toHaveBeenCalled();
  });

  it('renders Connections heading', () => {
    mockConnectionStore.connections = [
      { id: '1', name: 'Test', host: 'localhost', port: 8000, authType: 'none', useSSL: false },
    ];
    render(<ConnectionList {...defaultProps} />);

    expect(screen.getByText('Connections')).toBeInTheDocument();
  });

  it('shows https protocol when useSSL is true', () => {
    mockConnectionStore.connections = [
      { id: '1', name: 'SSL DB', host: 'secure.host', port: 443, authType: 'none', useSSL: true },
    ];
    render(<ConnectionList {...defaultProps} />);

    expect(screen.getByText('https://secure.host:443')).toBeInTheDocument();
  });

  it('shows http protocol when useSSL is false', () => {
    mockConnectionStore.connections = [
      { id: '1', name: 'Plain DB', host: 'plain.host', port: 8000, authType: 'none', useSSL: false },
    ];
    render(<ConnectionList {...defaultProps} />);

    expect(screen.getByText('http://plain.host:8000')).toBeInTheDocument();
  });
});
