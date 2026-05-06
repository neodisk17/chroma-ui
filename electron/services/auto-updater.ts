import { autoUpdater, UpdateInfo, ProgressInfo } from 'electron-updater';
import { BrowserWindow, ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants';
import log from 'electron-log';

// Configure logging for auto-updater
autoUpdater.logger = log;

/**
 * Auto-updater service for private GitHub repository.
 *
 * Requires GH_TOKEN environment variable to be set for accessing
 * private GitHub releases. The token needs `repo` scope.
 *
 * Set the token via:
 * - Environment variable: GH_TOKEN=your_token
 * - Or configure in the app settings (stored securely in keychain)
 */
export class AutoUpdaterService {
  private mainWindow: BrowserWindow | null = null;
  private isCheckingForUpdate = false;

  constructor() {
    // Configure for private repo
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowPrerelease = false;

    this.setupEventHandlers();
  }

  /**
   * Initialize the updater with the main window reference
   */
  initialize(window: BrowserWindow): void {
    this.mainWindow = window;
    this.registerIPCHandlers();
  }

  /**
   * Set the GitHub token for private repo access
   */
  setGitHubToken(token: string): void {
    // Configure the token for private repo access
    process.env.GH_TOKEN = token;
    autoUpdater.requestHeaders = {
      Authorization: `token ${token}`,
    };
  }

  /**
   * Check for updates
   */
  async checkForUpdates(): Promise<void> {
    if (this.isCheckingForUpdate) return;

    this.isCheckingForUpdate = true;
    try {
      await autoUpdater.checkForUpdates();
    } catch (error) {
      this.sendToRenderer('update-error', {
        message: error instanceof Error ? error.message : 'Failed to check for updates',
      });
    } finally {
      this.isCheckingForUpdate = false;
    }
  }

  /**
   * Download the available update
   */
  async downloadUpdate(): Promise<void> {
    try {
      await autoUpdater.downloadUpdate();
    } catch (error) {
      this.sendToRenderer('update-error', {
        message: error instanceof Error ? error.message : 'Failed to download update',
      });
    }
  }

  /**
   * Install the update and restart
   */
  installUpdate(): void {
    autoUpdater.quitAndInstall(false, true);
  }

  private setupEventHandlers(): void {
    autoUpdater.on('checking-for-update', () => {
      this.sendToRenderer('update-status', { status: 'checking' });
    });

    autoUpdater.on('update-available', (info: UpdateInfo) => {
      this.sendToRenderer('update-available', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes,
      });
    });

    autoUpdater.on('update-not-available', (_info: UpdateInfo) => {
      this.sendToRenderer('update-status', { status: 'up-to-date' });
    });

    autoUpdater.on('download-progress', (progress: ProgressInfo) => {
      this.sendToRenderer('update-progress', {
        percent: progress.percent,
        bytesPerSecond: progress.bytesPerSecond,
        transferred: progress.transferred,
        total: progress.total,
      });
    });

    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
      this.sendToRenderer('update-downloaded', {
        version: info.version,
        releaseDate: info.releaseDate,
      });
    });

    autoUpdater.on('error', (error: Error) => {
      this.sendToRenderer('update-error', {
        message: error.message,
      });
    });
  }

  private registerIPCHandlers(): void {
    ipcMain.handle(IPC_CHANNELS.UPDATE_CHECK, async () => {
      await this.checkForUpdates();
      return { success: true };
    });

    ipcMain.handle(IPC_CHANNELS.UPDATE_DOWNLOAD, async () => {
      await this.downloadUpdate();
      return { success: true };
    });

    ipcMain.handle(IPC_CHANNELS.UPDATE_INSTALL, () => {
      this.installUpdate();
      return { success: true };
    });
  }

  private sendToRenderer(channel: string, data: Record<string, unknown>): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(`updater:${channel}`, data);
    }
  }
}

// Singleton instance
export const autoUpdaterService = new AutoUpdaterService();
