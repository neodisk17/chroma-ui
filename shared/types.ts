// IPC channel names
export const IPC_CHANNELS = {
  PING: 'ipc:ping',
  PONG: 'ipc:pong',
} as const;

// IPC Response wrapper
export interface IPCResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Example: Ping/Pong types for testing IPC
export interface PingRequest {
  message: string;
  timestamp: number;
}

export interface PongResponse {
  originalMessage: string;
  reply: string;
  timestamp: number;
}
