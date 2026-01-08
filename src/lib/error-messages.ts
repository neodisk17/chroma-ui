/**
 * Error message utility - Converts technical errors into user-friendly messages
 */

interface ErrorMapping {
  pattern: RegExp | string;
  message: string;
  suggestion?: string;
}

const ERROR_MAPPINGS: ErrorMapping[] = [
  // Network errors
  {
    pattern: /ECONNREFUSED|Connection refused/i,
    message: 'Cannot connect to ChromaDB',
    suggestion: 'Make sure the ChromaDB server is running and check your connection settings.',
  },
  {
    pattern: /ETIMEDOUT|timeout/i,
    message: 'Connection timed out',
    suggestion: 'Check your network connection and try again.',
  },
  {
    pattern: /ENOTFOUND|getaddrinfo/i,
    message: 'Server not found',
    suggestion: 'Verify the server address in your connection settings.',
  },
  {
    pattern: /Network Error|NetworkError/i,
    message: 'Network error occurred',
    suggestion: 'Check your internet connection and try again.',
  },

  // ChromaDB specific errors
  {
    pattern: /Collection .+ not found|Collection does not exist/i,
    message: 'Collection not found',
    suggestion: 'The collection may have been deleted. Refresh the collection list.',
  },
  {
    pattern: /Collection .+ already exists|UniqueConstraintError/i,
    message: 'Collection already exists',
    suggestion: 'Choose a different name for your collection.',
  },
  {
    pattern: /Document .+ not found/i,
    message: 'Document not found',
    suggestion: 'The document may have been deleted. Refresh the document list.',
  },
  {
    pattern: /Duplicate (key|id)/i,
    message: 'Document ID already exists',
    suggestion: 'Use a different ID or let the system auto-generate one.',
  },
  {
    pattern: /Invalid embedding dimension/i,
    message: 'Invalid embedding dimension',
    suggestion: 'The embedding dimension must match the collection configuration.',
  },

  // Authentication errors
  {
    pattern: /401|Unauthorized|Authentication failed/i,
    message: 'Authentication failed',
    suggestion: 'Verify your authentication token in the connection settings.',
  },
  {
    pattern: /403|Forbidden|Permission denied/i,
    message: 'Permission denied',
    suggestion: 'You don\'t have permission to perform this action.',
  },

  // Validation errors
  {
    pattern: /Invalid JSON|JSON parse error|Unexpected token/i,
    message: 'Invalid JSON format',
    suggestion: 'Check your JSON syntax and fix any errors.',
  },
  {
    pattern: /Required field|is required|cannot be empty/i,
    message: 'Required field missing',
    suggestion: 'Please fill in all required fields.',
  },
  {
    pattern: /Invalid (email|url|format)/i,
    message: 'Invalid format',
    suggestion: 'Please enter a valid value.',
  },

  // Server errors
  {
    pattern: /500|Internal Server Error/i,
    message: 'Server error occurred',
    suggestion: 'The server encountered an error. Please try again later.',
  },
  {
    pattern: /502|Bad Gateway/i,
    message: 'Server unavailable',
    suggestion: 'The server is temporarily unavailable. Try again in a moment.',
  },
  {
    pattern: /503|Service Unavailable/i,
    message: 'Service unavailable',
    suggestion: 'The service is temporarily down for maintenance.',
  },
];

/**
 * Get user-friendly error message from error object or string
 */
export function getUserFriendlyError(error: unknown): {
  message: string;
  suggestion?: string;
  originalError?: string;
} {
  // Convert error to string
  let errorString: string;
  if (error instanceof Error) {
    errorString = error.message;
  } else if (typeof error === 'string') {
    errorString = error;
  } else if (error && typeof error === 'object' && 'message' in error) {
    errorString = String(error.message);
  } else {
    errorString = 'An unknown error occurred';
  }

  // Try to match against known error patterns
  for (const mapping of ERROR_MAPPINGS) {
    const pattern = typeof mapping.pattern === 'string'
      ? new RegExp(mapping.pattern, 'i')
      : mapping.pattern;

    if (pattern.test(errorString)) {
      return {
        message: mapping.message,
        suggestion: mapping.suggestion,
        originalError: errorString,
      };
    }
  }

  // No match found, return generic error
  return {
    message: 'An error occurred',
    suggestion: 'Please try again. If the problem persists, check the console for more details.',
    originalError: errorString,
  };
}

/**
 * Format error for display
 */
export function formatError(error: unknown, includeDetails: boolean = false): string {
  const friendlyError = getUserFriendlyError(error);

  let message = friendlyError.message;

  if (friendlyError.suggestion) {
    message += ` ${friendlyError.suggestion}`;
  }

  if (includeDetails && friendlyError.originalError && friendlyError.originalError !== friendlyError.message) {
    message += `\n\nDetails: ${friendlyError.originalError}`;
  }

  return message;
}

/**
 * Validate collection name
 */
export function validateCollectionName(name: string): {
  valid: boolean;
  error?: string;
} {
  if (!name || name.trim().length === 0) {
    return {
      valid: false,
      error: 'Collection name is required',
    };
  }

  if (name.length > 63) {
    return {
      valid: false,
      error: 'Collection name must be 63 characters or less',
    };
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    return {
      valid: false,
      error: 'Collection name can only contain letters, numbers, underscores, and hyphens',
    };
  }

  return { valid: true };
}

/**
 * Validate document ID
 */
export function validateDocumentId(id: string): {
  valid: boolean;
  error?: string;
} {
  if (!id || id.trim().length === 0) {
    return {
      valid: false,
      error: 'Document ID is required',
    };
  }

  if (id.length > 255) {
    return {
      valid: false,
      error: 'Document ID must be 255 characters or less',
    };
  }

  return { valid: true };
}

/**
 * Validate JSON string
 */
export function validateJSON(jsonString: string): {
  valid: boolean;
  error?: string;
  parsed?: unknown;
} {
  if (!jsonString || jsonString.trim().length === 0) {
    return { valid: true }; // Empty is valid (optional)
  }

  try {
    const parsed = JSON.parse(jsonString);
    return { valid: true, parsed };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSON';
    return {
      valid: false,
      error: `Invalid JSON: ${message}`,
    };
  }
}

/**
 * Validate port number
 */
export function validatePort(port: number | string): {
  valid: boolean;
  error?: string;
} {
  const portNum = typeof port === 'string' ? parseInt(port, 10) : port;

  if (isNaN(portNum)) {
    return {
      valid: false,
      error: 'Port must be a number',
    };
  }

  if (portNum < 1 || portNum > 65535) {
    return {
      valid: false,
      error: 'Port must be between 1 and 65535',
    };
  }

  return { valid: true };
}

/**
 * Validate hostname or IP address
 */
export function validateHost(host: string): {
  valid: boolean;
  error?: string;
} {
  if (!host || host.trim().length === 0) {
    return {
      valid: false,
      error: 'Host is required',
    };
  }

  // Very basic validation - just check it's not obviously invalid
  if (host.includes(' ') || host.includes('\n')) {
    return {
      valid: false,
      error: 'Host cannot contain spaces or newlines',
    };
  }

  return { valid: true };
}
