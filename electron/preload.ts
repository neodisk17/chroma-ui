import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/constants';
import type { IPCResponse } from '../shared/types';

// Define the API that will be exposed to the renderer process
export interface ElectronAPI {
  // Ping/Pong test
  ping: (message: string) => Promise<IPCResponse<{ reply: string; timestamp: number }>>;

  // Generic IPC invoke method (type-safe)
  invoke: <T>(channel: string, ...args: unknown[]) => Promise<IPCResponse<T>>;

  // Auto-updater listener
  onUpdaterEvent: (callback: (event: string, data: unknown) => void) => () => void;
}

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
const electronAPI: ElectronAPI = {
  ping: async (message: string) => {
    return ipcRenderer.invoke(IPC_CHANNELS.PING, {
      message,
      timestamp: Date.now(),
    });
  },

  invoke: async <T>(channel: string, ...args: unknown[]): Promise<IPCResponse<T>> => {
    // Validate that the channel is allowed (security measure)
    const allowedChannels: string[] = Object.values(IPC_CHANNELS);
    if (!allowedChannels.includes(channel)) {
      return {
        success: false,
        error: `IPC channel '${channel}' is not allowed`,
      };
    }

    try {
      const response = await ipcRenderer.invoke(channel, ...args);
      return response as IPCResponse<T>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },

  onUpdaterEvent: (callback: (event: string, data: unknown) => void) => {
    const channels = [
      'updater:update-status',
      'updater:update-available',
      'updater:update-progress',
      'updater:update-downloaded',
      'updater:update-error',
    ];

    const listeners = channels.map((channel) => {
      const listener = (_event: unknown, data: unknown) => {
        callback(channel.replace('updater:', ''), data);
      };
      ipcRenderer.on(channel, listener);
      return { channel, listener };
    });

    // Return cleanup function
    return () => {
      listeners.forEach(({ channel, listener }) => {
        ipcRenderer.removeListener(channel, listener);
      });
    };
  },
};

// Use contextBridge to expose the API to the renderer process
// This is the recommended way to expose APIs in Electron with context isolation enabled
contextBridge.exposeInMainWorld('electronAPI', electronAPI);
