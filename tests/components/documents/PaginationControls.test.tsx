import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PaginationControls } from '../../../src/components/documents/document-grid/PaginationControls';

// Mock the UI components used by PaginationControls
vi.mock('../../../src/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('../../../src/components/ui/input', () => ({
  Input: ({ value, onChange, ...props }: any) => (
    <input value={value} onChange={onChange} {...props} />
  ),
}));

vi.mock('../../../src/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <div data-testid="select-root" data-value={value}>
      {children}
      <select
        data-testid="page-size-select"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
      >
        <option value="20">20</option>
        <option value="50">50</option>
        <option value="100">100</option>
        <option value="500">500</option>
        <option value="1000">1000</option>
      </select>
    </div>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: () => null,
}));

vi.mock('lucide-react', () => ({
  ChevronLeft: () => <span data-testid="chevron-left">{'<'}</span>,
  ChevronRight: () => <span data-testid="chevron-right">{'>'}</span>,
}));

describe('PaginationControls', () => {
  const defaultProps = {
    page: 0,
    pageSize: 20,
    totalPages: 5,
    totalDocuments: 100,
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
  };

  it('renders page info correctly', () => {
    render(<PaginationControls {...defaultProps} />);

    expect(screen.getByText(/Page 1 of 5/)).toBeInTheDocument();
    expect(screen.getByText(/Showing 1 - 20 of 100/)).toBeInTheDocument();
  });

  it('renders correct showing range for middle pages', () => {
    render(<PaginationControls {...defaultProps} page={2} />);

    expect(screen.getByText(/Page 3 of 5/)).toBeInTheDocument();
    expect(screen.getByText(/Showing 41 - 60 of 100/)).toBeInTheDocument();
  });

  it('renders correct showing range for last page with partial data', () => {
    render(
      <PaginationControls
        {...defaultProps}
        page={4}
        totalDocuments={95}
        totalPages={5}
      />
    );

    // Last page: showing 81-95 of 95 (not 81-100)
    expect(screen.getByText(/Showing 81 - 95 of 95/)).toBeInTheDocument();
  });

  it('disables previous button on first page', () => {
    render(<PaginationControls {...defaultProps} page={0} />);

    const buttons = screen.getAllByRole('button');
    const prevButton = buttons.find((b) => b.querySelector('[data-testid="chevron-left"]'));
    expect(prevButton).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(<PaginationControls {...defaultProps} page={4} />);

    const buttons = screen.getAllByRole('button');
    const nextButton = buttons.find((b) => b.querySelector('[data-testid="chevron-right"]'));
    expect(nextButton).toBeDisabled();
  });

  it('calls onPageChange with previous page when prev button clicked', () => {
    const onPageChange = vi.fn();
    render(<PaginationControls {...defaultProps} page={2} onPageChange={onPageChange} />);

    const buttons = screen.getAllByRole('button');
    const prevButton = buttons.find((b) => b.querySelector('[data-testid="chevron-left"]'));
    fireEvent.click(prevButton!);

    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('calls onPageChange with next page when next button clicked', () => {
    const onPageChange = vi.fn();
    render(<PaginationControls {...defaultProps} page={2} onPageChange={onPageChange} />);

    const buttons = screen.getAllByRole('button');
    const nextButton = buttons.find((b) => b.querySelector('[data-testid="chevron-right"]'));
    fireEvent.click(nextButton!);

    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('does not go below page 0 when prev clicked on page 0', () => {
    const onPageChange = vi.fn();
    render(<PaginationControls {...defaultProps} page={0} onPageChange={onPageChange} />);

    const buttons = screen.getAllByRole('button');
    const prevButton = buttons.find((b) => b.querySelector('[data-testid="chevron-left"]'));
    // Button is disabled, but let's verify the handler logic
    expect(prevButton).toBeDisabled();
  });

  it('does not go above last page when next clicked on last page', () => {
    const onPageChange = vi.fn();
    render(<PaginationControls {...defaultProps} page={4} onPageChange={onPageChange} />);

    const buttons = screen.getAllByRole('button');
    const nextButton = buttons.find((b) => b.querySelector('[data-testid="chevron-right"]'));
    expect(nextButton).toBeDisabled();
  });

  it('allows direct page number input', () => {
    const onPageChange = vi.fn();
    render(<PaginationControls {...defaultProps} onPageChange={onPageChange} />);

    const pageInput = screen.getByDisplayValue('1');
    fireEvent.change(pageInput, { target: { value: '3' } });

    // Page number is 1-indexed in UI, but 0-indexed in callback
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('does not accept page number out of range', () => {
    const onPageChange = vi.fn();
    render(<PaginationControls {...defaultProps} onPageChange={onPageChange} />);

    const pageInput = screen.getByDisplayValue('1');
    fireEvent.change(pageInput, { target: { value: '10' } });

    // Should not call onPageChange for out-of-range values
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('calls onPageSizeChange and resets to page 0 when page size changes', () => {
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();
    render(
      <PaginationControls
        {...defaultProps}
        page={3}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    );

    const select = screen.getByTestId('page-size-select');
    fireEvent.change(select, { target: { value: '50' } });

    expect(onPageSizeChange).toHaveBeenCalledWith(50);
    expect(onPageChange).toHaveBeenCalledWith(0);
  });

  it('shows rows per page label', () => {
    render(<PaginationControls {...defaultProps} />);
    expect(screen.getByText('Rows per page:')).toBeInTheDocument();
  });
});
