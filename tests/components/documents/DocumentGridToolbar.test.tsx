import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentGridToolbar } from '../../../src/components/documents/document-grid/DocumentGridToolbar';

// Mock UI preferences store
const mockUIStore = {
  searchQuery: '',
  searchField: 'all' as string,
  documentGridLayout: 'comfortable' as string,
  setSearchQuery: vi.fn(),
  setSearchField: vi.fn(),
  setDocumentGridLayout: vi.fn(),
  clearSearch: vi.fn(),
};

vi.mock('../../../src/stores/ui-preferences-store', () => ({
  useUIPreferencesStore: () => mockUIStore,
}));

// Mock UI components
vi.mock('../../../src/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} data-size={size} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('../../../src/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>,
}));

vi.mock('../../../src/components/ui/input', () => ({
  Input: ({ value, onChange, placeholder, ...props }: any) => (
    <input value={value} onChange={onChange} placeholder={placeholder} {...props} />
  ),
}));

vi.mock('../../../src/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <div data-testid="field-select">
      <select
        data-testid="search-field-select"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
      >
        <option value="all">All Columns</option>
        <option value="id">ID</option>
        <option value="document">Document</option>
        <option value="metadata">Metadata</option>
      </select>
    </div>
  ),
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: () => null,
}));

vi.mock('../../../src/components/ui/tooltip', () => ({
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
  TooltipProvider: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('lucide-react', () => ({
  RefreshCw: () => <span data-testid="refresh-icon" />,
  Upload: () => <span data-testid="upload-icon" />,
  Plus: () => <span data-testid="plus-icon" />,
  Search: () => <span data-testid="search-icon" />,
  X: () => <span data-testid="x-icon" />,
  LayoutGrid: () => <span data-testid="layout-grid-icon" />,
  List: () => <span data-testid="list-icon" />,
}));

describe('DocumentGridToolbar', () => {
  const defaultProps = {
    totalDocuments: 42,
    onRefresh: vi.fn(),
    onImport: vi.fn(),
    onAdd: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUIStore.searchQuery = '';
    mockUIStore.searchField = 'all';
    mockUIStore.documentGridLayout = 'comfortable';
  });

  it('renders Documents heading', () => {
    render(<DocumentGridToolbar {...defaultProps} />);
    expect(screen.getByText('Documents')).toBeInTheDocument();
  });

  it('renders total document count', () => {
    render(<DocumentGridToolbar {...defaultProps} />);
    expect(screen.getByTestId('badge')).toHaveTextContent('42 total');
  });

  it('formats large document counts with locale string', () => {
    render(<DocumentGridToolbar {...defaultProps} totalDocuments={1234567} />);
    expect(screen.getByTestId('badge')).toHaveTextContent('12,34,567 total');
  });

  it('renders Refresh button', () => {
    render(<DocumentGridToolbar {...defaultProps} />);
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  it('renders Import button', () => {
    render(<DocumentGridToolbar {...defaultProps} />);
    expect(screen.getByText('Import')).toBeInTheDocument();
  });

  it('renders Add Document button', () => {
    render(<DocumentGridToolbar {...defaultProps} />);
    expect(screen.getByText('Add Document')).toBeInTheDocument();
  });

  it('calls onRefresh when Refresh button is clicked', () => {
    const onRefresh = vi.fn();
    render(<DocumentGridToolbar {...defaultProps} onRefresh={onRefresh} />);

    fireEvent.click(screen.getByText('Refresh'));
    expect(onRefresh).toHaveBeenCalled();
  });

  it('calls onImport when Import button is clicked', () => {
    const onImport = vi.fn();
    render(<DocumentGridToolbar {...defaultProps} onImport={onImport} />);

    fireEvent.click(screen.getByText('Import'));
    expect(onImport).toHaveBeenCalled();
  });

  it('calls onAdd when Add Document button is clicked', () => {
    const onAdd = vi.fn();
    render(<DocumentGridToolbar {...defaultProps} onAdd={onAdd} />);

    fireEvent.click(screen.getByText('Add Document'));
    expect(onAdd).toHaveBeenCalled();
  });

  it('renders search input with placeholder', () => {
    render(<DocumentGridToolbar {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search documents...')).toBeInTheDocument();
  });

  it('calls setSearchQuery when search input changes', async () => {
    const user = userEvent.setup();
    render(<DocumentGridToolbar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Search documents...');
    await user.type(input, 'hello');

    expect(mockUIStore.setSearchQuery).toHaveBeenCalled();
  });

  it('shows clear button when search query is not empty', () => {
    mockUIStore.searchQuery = 'active search';
    render(<DocumentGridToolbar {...defaultProps} />);

    // The X button should be visible
    expect(screen.getByTestId('x-icon')).toBeInTheDocument();
  });

  it('does not show clear button when search query is empty', () => {
    mockUIStore.searchQuery = '';
    render(<DocumentGridToolbar {...defaultProps} />);

    // The clear button with X icon should not be present
    expect(screen.queryByTestId('x-icon')).not.toBeInTheDocument();
  });

  it('calls clearSearch when clear button is clicked', () => {
    mockUIStore.searchQuery = 'something';
    render(<DocumentGridToolbar {...defaultProps} />);

    // Find and click the button containing the X icon
    const xIcon = screen.getByTestId('x-icon');
    const clearButton = xIcon.closest('button');
    fireEvent.click(clearButton!);

    expect(mockUIStore.clearSearch).toHaveBeenCalled();
  });

  it('calls setSearchField when search field select changes', () => {
    render(<DocumentGridToolbar {...defaultProps} />);

    const select = screen.getByTestId('search-field-select');
    fireEvent.change(select, { target: { value: 'id' } });

    expect(mockUIStore.setSearchField).toHaveBeenCalledWith('id');
  });

  it('calls setDocumentGridLayout with comfortable when comfortable button clicked', () => {
    mockUIStore.documentGridLayout = 'compact';
    render(<DocumentGridToolbar {...defaultProps} />);

    const gridIcon = screen.getByTestId('layout-grid-icon');
    const comfortableButton = gridIcon.closest('button');
    fireEvent.click(comfortableButton!);

    expect(mockUIStore.setDocumentGridLayout).toHaveBeenCalledWith('comfortable');
  });

  it('calls setDocumentGridLayout with compact when compact button clicked', () => {
    mockUIStore.documentGridLayout = 'comfortable';
    render(<DocumentGridToolbar {...defaultProps} />);

    const listIcon = screen.getByTestId('list-icon');
    const compactButton = listIcon.closest('button');
    fireEvent.click(compactButton!);

    expect(mockUIStore.setDocumentGridLayout).toHaveBeenCalledWith('compact');
  });

  it('renders with 0 total documents', () => {
    render(<DocumentGridToolbar {...defaultProps} totalDocuments={0} />);
    expect(screen.getByTestId('badge')).toHaveTextContent('0 total');
  });
});
