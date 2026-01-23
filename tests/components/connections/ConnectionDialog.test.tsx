import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConnectionDialog } from '../../../src/components/connections/ConnectionDialog';

// Mock the connection store
const mockCreateConnection = vi.fn();
const mockTestConnection = vi.fn();

vi.mock('../../../src/stores/connection-store', () => ({
  useConnectionStore: () => ({
    createConnection: mockCreateConnection,
    testConnection: mockTestConnection,
  }),
}));

// Mock the shared schema for zodResolver
vi.mock('../../../../shared/schemas', () => ({
  CreateConnectionRequestSchema: {
    // Zod schema mock - the actual validation is done by react-hook-form with zodResolver
  },
}));

describe('ConnectionDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateConnection.mockResolvedValue(true);
    mockTestConnection.mockResolvedValue({ success: true, message: 'Connected!' });
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<ConnectionDialog isOpen={false} onClose={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders the dialog when isOpen is true', () => {
    render(<ConnectionDialog {...defaultProps} />);
    expect(screen.getByText('New Connection')).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    render(<ConnectionDialog {...defaultProps} />);

    expect(screen.getByText('Connection Name *')).toBeInTheDocument();
    expect(screen.getByText('Host *')).toBeInTheDocument();
    expect(screen.getByText('Port *')).toBeInTheDocument();
    expect(screen.getByText('Use SSL (HTTPS)')).toBeInTheDocument();
    expect(screen.getByText('Authentication')).toBeInTheDocument();
  });

  it('has correct default values', () => {
    render(<ConnectionDialog {...defaultProps} />);

    const hostInput = screen.getByPlaceholderText('localhost');
    const portInput = screen.getByPlaceholderText('8000');

    expect(hostInput).toHaveValue('localhost');
    expect(portInput).toHaveValue(8000);
  });

  it('shows token field when auth type is token', async () => {
    const user = userEvent.setup();
    render(<ConnectionDialog {...defaultProps} />);

    const authSelect = screen.getByRole('combobox');
    await user.selectOptions(authSelect, 'token');

    expect(screen.getByPlaceholderText('Your API token')).toBeInTheDocument();
  });

  it('shows username/password fields when auth type is basic', async () => {
    const user = userEvent.setup();
    render(<ConnectionDialog {...defaultProps} />);

    const authSelect = screen.getByRole('combobox');
    await user.selectOptions(authSelect, 'basic');

    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('does not show token or basic fields when auth is none', () => {
    render(<ConnectionDialog {...defaultProps} />);

    expect(screen.queryByPlaceholderText('Your API token')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Username')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Password')).not.toBeInTheDocument();
  });

  it('calls onClose when Cancel button is clicked', async () => {
    const onClose = vi.fn();
    render(<ConnectionDialog isOpen={true} onClose={onClose} />);

    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls createConnection on form submission with valid data', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ConnectionDialog isOpen={true} onClose={onClose} />);

    // Fill in form
    const nameInput = screen.getByPlaceholderText('My ChromaDB');
    await user.type(nameInput, 'Test Connection');

    // Submit form
    fireEvent.click(screen.getByText('Save Connection'));

    await waitFor(() => {
      expect(mockCreateConnection).toHaveBeenCalled();
    });
  });

  it('calls onClose after successful connection creation', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    mockCreateConnection.mockResolvedValue(true);

    render(<ConnectionDialog isOpen={true} onClose={onClose} />);

    const nameInput = screen.getByPlaceholderText('My ChromaDB');
    await user.type(nameInput, 'Test Connection');

    fireEvent.click(screen.getByText('Save Connection'));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('does not close dialog if createConnection returns falsy', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    mockCreateConnection.mockResolvedValue(false);

    render(<ConnectionDialog isOpen={true} onClose={onClose} />);

    const nameInput = screen.getByPlaceholderText('My ChromaDB');
    await user.type(nameInput, 'Test Connection');

    fireEvent.click(screen.getByText('Save Connection'));

    await waitFor(() => {
      expect(mockCreateConnection).toHaveBeenCalled();
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls testConnection when Test Connection button is clicked', async () => {
    render(<ConnectionDialog {...defaultProps} />);

    fireEvent.click(screen.getByText('Test Connection'));

    await waitFor(() => {
      expect(mockTestConnection).toHaveBeenCalled();
    });
  });

  it('shows success message after successful test connection', async () => {
    mockTestConnection.mockResolvedValue({ success: true, message: 'Connection successful!' });
    render(<ConnectionDialog {...defaultProps} />);

    fireEvent.click(screen.getByText('Test Connection'));

    await waitFor(() => {
      expect(screen.getByText('Connection successful!')).toBeInTheDocument();
    });
  });

  it('shows error message after failed test connection', async () => {
    mockTestConnection.mockResolvedValue({ success: false, message: 'Connection refused' });
    render(<ConnectionDialog {...defaultProps} />);

    fireEvent.click(screen.getByText('Test Connection'));

    await waitFor(() => {
      expect(screen.getByText('Connection refused')).toBeInTheDocument();
    });
  });

  it('shows Testing... text while testing connection', async () => {
    mockTestConnection.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: true, message: 'ok' }), 100))
    );
    render(<ConnectionDialog {...defaultProps} />);

    fireEvent.click(screen.getByText('Test Connection'));
    expect(screen.getByText('Testing...')).toBeInTheDocument();
  });

  it('disables Test Connection button while testing', async () => {
    mockTestConnection.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: true, message: 'ok' }), 100))
    );
    render(<ConnectionDialog {...defaultProps} />);

    const testButton = screen.getByText('Test Connection');
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(screen.getByText('Testing...')).toBeInTheDocument();
    });

    const testingButton = screen.getByText('Testing...');
    expect(testingButton).toBeDisabled();
  });

  it('renders the SSL checkbox unchecked by default', () => {
    render(<ConnectionDialog {...defaultProps} />);

    const sslCheckbox = screen.getByRole('checkbox');
    expect(sslCheckbox).not.toBeChecked();
  });

  it('renders Save Connection button', () => {
    render(<ConnectionDialog {...defaultProps} />);
    expect(screen.getByText('Save Connection')).toBeInTheDocument();
  });

  it('has auth options: None, Token, Basic', () => {
    render(<ConnectionDialog {...defaultProps} />);

    const select = screen.getByRole('combobox');
    const options = select.querySelectorAll('option');

    const optionValues = Array.from(options).map((o) => o.getAttribute('value'));
    expect(optionValues).toContain('none');
    expect(optionValues).toContain('token');
    expect(optionValues).toContain('basic');
  });
});
