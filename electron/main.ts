import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { WINDOW_CONFIG, IPC_CHANNELS } from '../shared/constants';
import { PingRequestSchema } from '../shared/schemas';
import type { IPCResponse, PongResponse } from '../shared/types';
import { registerConnectionHandlers } from './ipc/connection-handler';
import { registerChromaDBHandlers } from './ipc/chromadb-handler';
import { connectionManager } from './services/connection-manager';
import { autoUpdaterService } from './services/auto-updater';
import { embeddingService } from './services/embedding-service';
import { localModelService } from './services/local-model-service';

// Rolldown compiles this to CJS where __dirname is injected by the Node.js module wrapper.
// Declaring it here (without assignment) tells TypeScript it exists without emitting JS,
// which prevents Rolldown from introducing a naming conflict via variable renaming.
declare const __dirname: string;

// Suppress chromadb SDK's "No embedding function configuration found" warnings.
// These are expected for collections created outside the JS SDK (e.g. Python client).
// Our app fetches stored embeddings directly via collection.get() and never needs
// the SDK to auto-generate embeddings, so the warning is irrelevant noise.
const _originalWarn = console.warn.bind(console);
console.warn = (...args: unknown[]) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('No embedding function configuration found for collection')
  ) {
    return;
  }
  _originalWarn(...args);
};

// Determine if we're in development or production
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Keep a global reference of the window object to prevent garbage collection
let mainWindow: BrowserWindow | null = null;

/**
 * Creates the main application window with security best practices
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: WINDOW_CONFIG.DEFAULT_WIDTH,
    height: WINDOW_CONFIG.DEFAULT_HEIGHT,
    minWidth: WINDOW_CONFIG.MIN_WIDTH,
    minHeight: WINDOW_CONFIG.MIN_HEIGHT,
    show: false, // Don't show until ready-to-show event
    title: 'ChromaDB UI',
    webPreferences: {
      // Security: Enable context isolation
      contextIsolation: true,
      // Security: Disable Node.js integration in renderer
      nodeIntegration: false,
      // Security: Disable remote module
      enableRemoteModule: false,
      // Preload script for safe IPC communication
      preload: path.join(__dirname, 'preload.js'),
      // Security: Disable web security in dev for hot reload (enable in production)
      webSecurity: !isDev,
      // Allow dev tools only in development
      devTools: isDev,
    },
  });

  // Load the app
  if (isDev) {
    // In development, load from Vite dev server
    mainWindow.loadURL('http://localhost:3000');
  } else {
    // In production, load the built files
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Show window when ready (prevents visual flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Security: Prevent navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    // Only allow navigation to localhost in dev or file:// in production
    if (isDev) {
      if (parsedUrl.origin !== 'http://localhost:3000') {
        event.preventDefault();
      }
    } else {
      if (parsedUrl.protocol !== 'file:') {
        event.preventDefault();
      }
    }
  });

  // Security: Prevent opening new windows
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
}

/**
 * Setup IPC handlers
 */
function setupIPCHandlers(): void {
  // Ping/Pong handler for testing IPC communication
  ipcMain.handle(IPC_CHANNELS.PING, async (_event, request): Promise<IPCResponse<PongResponse>> => {
    try {
      // Validate request using Zod schema
      const validated = PingRequestSchema.parse(request);

      // Process the request
      const response: PongResponse = {
        originalMessage: validated.message,
        reply: `Pong! Received: "${validated.message}"`,
        timestamp: Date.now(),
      };

      return {
        success: true,
        data: response,
      };
    } catch (error) {
      console.error('Ping handler error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Register connection management handlers
  registerConnectionHandlers();

  // Register ChromaDB collection handlers
  registerChromaDBHandlers();
}

/**
 * Application lifecycle: ready
 */
app.whenReady().then(() => {
  console.log('App is ready!');
  console.log('Environment:', isDev ? 'development' : 'production');

  // Setup IPC handlers before creating window
  setupIPCHandlers();

  // Create the main window
  createWindow();

  // Set main window reference for embedding service (for progress events)
  if (mainWindow) {
    embeddingService.setMainWindow(mainWindow);
  }

  // Initialise model cache dir and broadcast initial model status to renderer
  if (mainWindow) {
    mainWindow.webContents.on('did-finish-load', async () => {
      try {
        localModelService.initCacheDir();
        const models = await localModelService.listAvailableModels();
        mainWindow!.webContents.send('model:status-ready', models);
      } catch (err) {
        console.warn('Startup model status check failed:', err);
      }
    });
  }

  // Initialize auto-updater in production mode
  if (!isDev && mainWindow) {
    autoUpdaterService.initialize(mainWindow);
    // Set token from environment if available
    if (process.env.GH_TOKEN) {
      autoUpdaterService.setGitHubToken(process.env.GH_TOKEN);
    }
    // Check for updates after a short delay
    setTimeout(() => {
      autoUpdaterService.checkForUpdates();
    }, 3000);
  }

  // macOS: Re-create window when dock icon is clicked and no windows are open
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

/**
 * Application lifecycle: window-all-closed
 */
app.on('window-all-closed', () => {
  // On macOS, apps typically stay active until user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Application lifecycle: before-quit
 * Cleanup resources before quitting
 */
app.on('before-quit', async () => {
  console.log('App is quitting...');
  // Cleanup connection manager
  await connectionManager.cleanup();
});

/**
 * Security: Handle uncaught exceptions
 */
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  // In production, you might want to log this to a file or crash reporting service
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
});
