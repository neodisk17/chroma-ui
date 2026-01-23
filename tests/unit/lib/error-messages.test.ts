import { describe, it, expect } from 'vitest';
import {
  getUserFriendlyError,
  formatError,
  validateCollectionName,
  validateDocumentId,
  validateJSON,
  validatePort,
  validateHost,
} from '@/lib/error-messages';

describe('getUserFriendlyError', () => {
  it('should handle Error objects', () => {
    const result = getUserFriendlyError(new Error('ECONNREFUSED'));
    expect(result.message).toBe('Cannot connect to ChromaDB');
    expect(result.suggestion).toBeDefined();
    expect(result.originalError).toBe('ECONNREFUSED');
  });

  it('should handle string errors', () => {
    const result = getUserFriendlyError('Connection refused');
    expect(result.message).toBe('Cannot connect to ChromaDB');
  });

  it('should handle object errors with message property', () => {
    const result = getUserFriendlyError({ message: 'timeout occurred' });
    expect(result.message).toBe('Connection timed out');
  });

  it('should handle unknown error types', () => {
    const result = getUserFriendlyError(42);
    expect(result.message).toBe('An error occurred');
  });

  it('should handle null/undefined', () => {
    const result = getUserFriendlyError(null);
    expect(result.message).toBe('An error occurred');
  });

  it('should match network errors', () => {
    expect(getUserFriendlyError('ETIMEDOUT').message).toBe('Connection timed out');
    expect(getUserFriendlyError('ENOTFOUND').message).toBe('Server not found');
    expect(getUserFriendlyError('Network Error').message).toBe('Network error occurred');
  });

  it('should match ChromaDB errors', () => {
    expect(getUserFriendlyError('Collection test not found').message).toBe('Collection not found');
    expect(getUserFriendlyError('Collection test already exists').message).toBe('Collection already exists');
    expect(getUserFriendlyError('Document doc1 not found').message).toBe('Document not found');
    expect(getUserFriendlyError('Duplicate key error').message).toBe('Document ID already exists');
    expect(getUserFriendlyError('Invalid embedding dimension').message).toBe('Invalid embedding dimension');
  });

  it('should match authentication errors', () => {
    expect(getUserFriendlyError('401 Unauthorized').message).toBe('Authentication failed');
    expect(getUserFriendlyError('403 Forbidden').message).toBe('Permission denied');
  });

  it('should match validation errors', () => {
    expect(getUserFriendlyError('Invalid JSON format').message).toBe('Invalid JSON format');
    expect(getUserFriendlyError('Required field missing').message).toBe('Required field missing');
  });

  it('should match server errors', () => {
    expect(getUserFriendlyError('500 Internal Server Error').message).toBe('Server error occurred');
    expect(getUserFriendlyError('502 Bad Gateway').message).toBe('Server unavailable');
    expect(getUserFriendlyError('503 Service Unavailable').message).toBe('Service unavailable');
  });

  it('should return generic message for unmatched errors', () => {
    const result = getUserFriendlyError('some random error xyz');
    expect(result.message).toBe('An error occurred');
    expect(result.suggestion).toBeDefined();
  });
});

describe('formatError', () => {
  it('should format error with message and suggestion', () => {
    const formatted = formatError(new Error('ECONNREFUSED'));
    expect(formatted).toContain('Cannot connect to ChromaDB');
    expect(formatted).toContain('Make sure the ChromaDB server is running');
  });

  it('should include details when requested', () => {
    const formatted = formatError(new Error('ECONNREFUSED'), true);
    expect(formatted).toContain('Details:');
    expect(formatted).toContain('ECONNREFUSED');
  });

  it('should not include details by default', () => {
    const formatted = formatError(new Error('ECONNREFUSED'));
    expect(formatted).not.toContain('Details:');
  });

  it('should handle unknown errors gracefully', () => {
    const formatted = formatError('some random error');
    expect(formatted).toBe('An error occurred Please try again. If the problem persists, check the console for more details.');
  });
});

describe('validateCollectionName', () => {
  it('should accept valid collection names', () => {
    expect(validateCollectionName('my-collection')).toEqual({ valid: true });
    expect(validateCollectionName('test_123')).toEqual({ valid: true });
    expect(validateCollectionName('MyCollection')).toEqual({ valid: true });
  });

  it('should reject empty names', () => {
    const result = validateCollectionName('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Collection name is required');
  });

  it('should reject whitespace-only names', () => {
    const result = validateCollectionName('   ');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Collection name is required');
  });

  it('should reject names longer than 63 characters', () => {
    const longName = 'a'.repeat(64);
    const result = validateCollectionName(longName);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('63 characters');
  });

  it('should accept names of exactly 63 characters', () => {
    const maxName = 'a'.repeat(63);
    expect(validateCollectionName(maxName).valid).toBe(true);
  });

  it('should reject names with special characters', () => {
    expect(validateCollectionName('my collection').valid).toBe(false);
    expect(validateCollectionName('my.collection').valid).toBe(false);
    expect(validateCollectionName('my/collection').valid).toBe(false);
    expect(validateCollectionName('my@collection').valid).toBe(false);
  });
});

describe('validateDocumentId', () => {
  it('should accept valid IDs', () => {
    expect(validateDocumentId('doc-1')).toEqual({ valid: true });
    expect(validateDocumentId('abc123')).toEqual({ valid: true });
  });

  it('should reject empty IDs', () => {
    const result = validateDocumentId('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Document ID is required');
  });

  it('should reject whitespace-only IDs', () => {
    const result = validateDocumentId('   ');
    expect(result.valid).toBe(false);
  });

  it('should reject IDs longer than 255 characters', () => {
    const longId = 'a'.repeat(256);
    const result = validateDocumentId(longId);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('255 characters');
  });

  it('should accept IDs of exactly 255 characters', () => {
    const maxId = 'a'.repeat(255);
    expect(validateDocumentId(maxId).valid).toBe(true);
  });
});

describe('validateJSON', () => {
  it('should accept valid JSON', () => {
    const result = validateJSON('{"key": "value"}');
    expect(result.valid).toBe(true);
    expect(result.parsed).toEqual({ key: 'value' });
  });

  it('should accept empty string (optional field)', () => {
    expect(validateJSON('').valid).toBe(true);
  });

  it('should accept whitespace-only string (optional field)', () => {
    expect(validateJSON('   ').valid).toBe(true);
  });

  it('should reject invalid JSON', () => {
    const result = validateJSON('{invalid}');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid JSON');
  });

  it('should accept arrays', () => {
    const result = validateJSON('[1, 2, 3]');
    expect(result.valid).toBe(true);
    expect(result.parsed).toEqual([1, 2, 3]);
  });

  it('should accept primitive JSON values', () => {
    expect(validateJSON('"hello"').valid).toBe(true);
    expect(validateJSON('42').valid).toBe(true);
    expect(validateJSON('true').valid).toBe(true);
    expect(validateJSON('null').valid).toBe(true);
  });
});

describe('validatePort', () => {
  it('should accept valid port numbers', () => {
    expect(validatePort(8000).valid).toBe(true);
    expect(validatePort(80).valid).toBe(true);
    expect(validatePort(443).valid).toBe(true);
    expect(validatePort(65535).valid).toBe(true);
    expect(validatePort(1).valid).toBe(true);
  });

  it('should accept string port numbers', () => {
    expect(validatePort('8000').valid).toBe(true);
    expect(validatePort('443').valid).toBe(true);
  });

  it('should reject port 0', () => {
    expect(validatePort(0).valid).toBe(false);
  });

  it('should reject port > 65535', () => {
    expect(validatePort(65536).valid).toBe(false);
  });

  it('should reject negative ports', () => {
    expect(validatePort(-1).valid).toBe(false);
  });

  it('should reject non-numeric strings', () => {
    const result = validatePort('abc');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Port must be a number');
  });
});

describe('validateHost', () => {
  it('should accept valid hostnames', () => {
    expect(validateHost('localhost').valid).toBe(true);
    expect(validateHost('example.com').valid).toBe(true);
    expect(validateHost('192.168.1.1').valid).toBe(true);
  });

  it('should reject empty host', () => {
    const result = validateHost('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Host is required');
  });

  it('should reject host with spaces', () => {
    expect(validateHost('my host').valid).toBe(false);
  });

  it('should reject host with newlines', () => {
    expect(validateHost('host\ninjection').valid).toBe(false);
  });

  it('should accept IP addresses', () => {
    expect(validateHost('127.0.0.1').valid).toBe(true);
    expect(validateHost('0.0.0.0').valid).toBe(true);
  });
});
