import * as keytar from 'keytar';
import { ConnectionCredential } from '../../shared/schemas';

const SERVICE_NAME = 'chromadb-ui';

/**
 * CredentialStore - Secure credential storage using OS keychain
 *
 * This service wraps the keytar library to provide secure credential storage
 * in the operating system's native keychain:
 * - macOS: Keychain Access
 * - Windows: Credential Vault
 * - Linux: Secret Service API (libsecret)
 *
 * SECURITY: Credentials are NEVER stored in files, localStorage, or JSON.
 * They are only stored in the OS-level secure keychain.
 */
export class CredentialStore {
  /**
   * Save credentials for a connection to the OS keychain
   * @param connectionId - Unique identifier for the connection
   * @param credential - Credentials to store (token, username, password)
   * @returns Promise<void>
   * @throws Error if keychain access is denied or fails
   */
  async saveCredential(
    connectionId: string,
    credential: Omit<ConnectionCredential, 'connectionId'>
  ): Promise<void> {
    try {
      // Serialize credential to JSON for storage
      const credentialJson = JSON.stringify({
        token: credential.token,
        username: credential.username,
        password: credential.password,
      });

      // Store in OS keychain
      // Account name is the connection ID
      // Password field stores the serialized credential JSON
      await keytar.setPassword(SERVICE_NAME, connectionId, credentialJson);
    } catch (error) {
      // Handle keychain access errors gracefully
      if (error instanceof Error) {
        throw new Error(
          `Failed to save credentials to keychain: ${error.message}. ` +
          'Please ensure you have granted keychain access permissions.'
        );
      }
      throw new Error('Failed to save credentials to keychain');
    }
  }

  /**
   * Retrieve credentials for a connection from the OS keychain
   * @param connectionId - Unique identifier for the connection
   * @returns Promise<ConnectionCredential | null> - Credentials or null if not found
   * @throws Error if keychain access is denied or fails
   */
  async getCredential(connectionId: string): Promise<ConnectionCredential | null> {
    try {
      // Retrieve from OS keychain
      const credentialJson = await keytar.getPassword(SERVICE_NAME, connectionId);

      if (!credentialJson) {
        return null;
      }

      // Deserialize JSON to credential object
      const credential = JSON.parse(credentialJson);

      return {
        connectionId,
        token: credential.token,
        username: credential.username,
        password: credential.password,
      };
    } catch (error) {
      // Handle keychain access errors gracefully
      if (error instanceof Error) {
        // If it's a JSON parse error, the credential is corrupted
        if (error instanceof SyntaxError) {
          console.error(`Corrupted credential for connection ${connectionId}:`, error);
          // Delete the corrupted credential
          await this.deleteCredential(connectionId);
          return null;
        }

        throw new Error(
          `Failed to retrieve credentials from keychain: ${error.message}. ` +
          'Please ensure you have granted keychain access permissions.'
        );
      }
      throw new Error('Failed to retrieve credentials from keychain');
    }
  }

  /**
   * Delete credentials for a connection from the OS keychain
   * @param connectionId - Unique identifier for the connection
   * @returns Promise<boolean> - true if deleted, false if not found
   * @throws Error if keychain access is denied or fails
   */
  async deleteCredential(connectionId: string): Promise<boolean> {
    try {
      // Delete from OS keychain
      const deleted = await keytar.deletePassword(SERVICE_NAME, connectionId);
      return deleted;
    } catch (error) {
      // Handle keychain access errors gracefully
      if (error instanceof Error) {
        throw new Error(
          `Failed to delete credentials from keychain: ${error.message}. ` +
          'Please ensure you have granted keychain access permissions.'
        );
      }
      throw new Error('Failed to delete credentials from keychain');
    }
  }

  /**
   * Check if credentials exist for a connection in the OS keychain
   * @param connectionId - Unique identifier for the connection
   * @returns Promise<boolean> - true if credentials exist, false otherwise
   */
  async hasCredential(connectionId: string): Promise<boolean> {
    try {
      const credential = await keytar.getPassword(SERVICE_NAME, connectionId);
      return credential !== null;
    } catch (error) {
      // If we can't check, assume no credentials
      console.error('Error checking for credential:', error);
      return false;
    }
  }

  /**
   * List all connection IDs that have credentials stored
   * @returns Promise<string[]> - Array of connection IDs
   */
  async listCredentials(): Promise<string[]> {
    try {
      // Find all credentials for our service
      const credentials = await keytar.findCredentials(SERVICE_NAME);
      return credentials.map((cred) => cred.account);
    } catch (error) {
      console.error('Error listing credentials:', error);
      return [];
    }
  }
}

// Export a singleton instance
export const credentialStore = new CredentialStore();
