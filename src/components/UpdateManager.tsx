/**
 * Update Manager Component
 *
 * Handles application auto-update workflow using electron-updater.
 * Displays update status, download progress, and provides user controls
 * for checking, downloading, and installing updates from GitHub Releases.
 *
 * **Features:**
 * - Check for updates manually via "Check for Updates" button
 * - Display current version and available version
 * - Show download progress with percentage and speed
 * - Install and restart button when update is ready
 * - Error handling with user-friendly messages
 * - Disabled in development mode
 *
 * **Update Workflow:**
 * 1. User clicks "Check for Updates"
 * 2. If update available → Shows version and "Download" button
 * 3. User clicks "Download" → Shows progress bar
 * 4. When complete → Shows "Restart & Install" button
 * 5. User clicks "Restart & Install" → App restarts with new version
 *
 * @component
 * @returns {JSX.Element | null} Update dialog or null if not active
 */

import { useEffect, useState } from 'react';

interface UpdateManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'update-available'
  | 'no-update'
  | 'downloading'
  | 'downloaded'
  | 'error';

interface UpdateInfo {
  version: string;
  releaseNotes?: string;
  releaseDate?: string;
}

interface DownloadProgress {
  percent: number;
  bytesPerSecond: number;
  transferred: number;
  total: number;
}

const UpdateManager = ({ isOpen, onClose }: UpdateManagerProps) => {
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [currentVersion, setCurrentVersion] = useState<string>('');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isElectron, setIsElectron] = useState<boolean>(false);

  // Check if running in Electron
  useEffect(() => {
    setIsElectron(!!window.autoUpdater);

    if (window.autoUpdater) {
      // Get current version on mount
      window.autoUpdater.getCurrentVersion().then(setCurrentVersion);
    }
  }, []);

  // Set up event listeners for auto-updater
  useEffect(() => {
    if (!window.autoUpdater || !isOpen) return;

    const cleanupFunctions: (() => void)[] = [];

    // Checking for update
    cleanupFunctions.push(
      window.autoUpdater.onCheckingForUpdate(() => {
        setStatus('checking');
        setErrorMessage('');
      })
    );

    // Update available
    cleanupFunctions.push(
      window.autoUpdater.onUpdateAvailable((info) => {
        setStatus('update-available');
        setUpdateInfo(info);
      })
    );

    // No update available
    cleanupFunctions.push(
      window.autoUpdater.onUpdateNotAvailable(() => {
        setStatus('no-update');
        setUpdateInfo(null);
      })
    );

    // Download progress
    cleanupFunctions.push(
      window.autoUpdater.onDownloadProgress((progress) => {
        setStatus('downloading');
        setDownloadProgress(progress);
      })
    );

    // Update downloaded
    cleanupFunctions.push(
      window.autoUpdater.onUpdateDownloaded((info) => {
        setStatus('downloaded');
        setUpdateInfo(info);
      })
    );

    // Error
    cleanupFunctions.push(
      window.autoUpdater.onError((error) => {
        setStatus('error');
        setErrorMessage(error.message);
      })
    );

    // Cleanup on unmount
    return () => {
      cleanupFunctions.forEach((cleanup) => cleanup());
    };
  }, [isOpen]);

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCheckForUpdates = async () => {
    if (!window.autoUpdater) return;

    try {
      setStatus('checking');
      setErrorMessage('');
      await window.autoUpdater.checkForUpdates();
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to check for updates');
    }
  };

  const handleDownload = async () => {
    if (!window.autoUpdater) return;

    try {
      setStatus('downloading');
      setErrorMessage('');
      await window.autoUpdater.downloadUpdate();
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to download update');
    }
  };

  const handleInstall = async () => {
    if (!window.autoUpdater) return;

    try {
      await window.autoUpdater.quitAndInstall();
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to install update');
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    return `${formatBytes(bytesPerSecond)}/s`;
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-manager-title"
    >
      <div
        className="bg-[var(--app-bg)] border border-[var(--app-border)] rounded-lg shadow-2xl p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2
            id="update-manager-title"
            className="text-xl font-semibold"
            style={{ color: 'var(--app-text)' }}
          >
            Software Update
          </h2>
          <button
            onClick={onClose}
            className="text-2xl leading-none hover:opacity-70 transition"
            style={{ color: 'var(--app-text-muted)' }}
            aria-label="Close update manager"
          >
            ×
          </button>
        </div>

        {/* Current Version */}
        <div className="mb-6 p-4 bg-[var(--app-bg-subtle)] rounded">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium" style={{ color: 'var(--app-text-muted)' }}>
              Current Version
            </span>
            <span className="font-mono text-sm" style={{ color: 'var(--app-text)' }}>
              {currentVersion || 'Unknown'}
            </span>
          </div>
        </div>

        {/* Status Content */}
        <div className="mb-6">
          {!isElectron && (
            <div className="text-center py-4">
              <p style={{ color: 'var(--app-text-muted)' }}>
                🌐 The Auto-Forge only functions within the Desktop Sanctum. <br />
                Web browsers cannot channel these arcane energies.
              </p>
            </div>
          )}

          {isElectron && status === 'idle' && (
            <div className="text-center py-4">
              <p className="mb-4" style={{ color: 'var(--app-text-muted)' }}>
                📜 Consult the Chronicle of Releases to see if new powers await.
              </p>
            </div>
          )}

          {status === 'checking' && (
            <div className="text-center py-4">
              <div className="animate-pulse mb-2" style={{ color: 'var(--app-text)' }}>
                🔮 Divining the cosmic archives...
              </div>
            </div>
          )}

          {status === 'no-update' && (
            <div className="text-center py-4">
              <p className="mb-2" style={{ color: 'var(--app-text)' }}>
                ⚔️ Your forge burns with the latest flame!
              </p>
              <p className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
                Graphium is inscribed with the most recent enchantments.
              </p>
            </div>
          )}

          {status === 'update-available' && updateInfo && (
            <div className="p-4 bg-[var(--app-bg-subtle)] rounded">
              <p className="mb-2 font-medium" style={{ color: 'var(--app-text)' }}>
                ✨ New Power Forged: v{updateInfo.version}
              </p>
              <p className="text-sm mb-4" style={{ color: 'var(--app-text-muted)' }}>
                The smiths have completed a new artifact. Ready to be summoned.
              </p>
            </div>
          )}

          {status === 'downloading' && downloadProgress && (
            <div className="p-4 bg-[var(--app-bg-subtle)] rounded">
              <p className="mb-3 font-medium" style={{ color: 'var(--app-text)' }}>
                ⚡ Channeling the update through the aether...
              </p>
              <div className="mb-2 bg-[var(--app-bg)] rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${downloadProgress.percent}%` }}
                />
              </div>
              <div className="flex justify-between text-sm" style={{ color: 'var(--app-text-muted)' }}>
                <span>{downloadProgress.percent.toFixed(1)}%</span>
                <span>
                  {formatBytes(downloadProgress.transferred)} / {formatBytes(downloadProgress.total)}
                </span>
              </div>
              <div className="text-sm text-center mt-2" style={{ color: 'var(--app-text-muted)' }}>
                {formatSpeed(downloadProgress.bytesPerSecond)}
              </div>
            </div>
          )}

          {status === 'downloaded' && updateInfo && (
            <div className="p-4 bg-[var(--app-bg-subtle)] rounded">
              <p className="mb-2 font-medium" style={{ color: 'var(--app-text)' }}>
                🎲 Natural 20! Artifact secured.
              </p>
              <p className="text-sm mb-2" style={{ color: 'var(--app-text-muted)' }}>
                Version {updateInfo.version} awaits installation.
              </p>
              <p className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
                The ritual requires a restart to bind the new powers.
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded">
              <p className="mb-2 font-medium text-red-500">💀 Critical Failure</p>
              <p className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
                {errorMessage || 'The update ritual was interrupted by mysterious forces. The cosmic archives may be unreachable.'}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {isElectron && (status === 'idle' || status === 'no-update' || status === 'error') && (
            <button
              onClick={handleCheckForUpdates}
              disabled={status === 'checking'}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-medium transition"
            >
              🔮 Consult the Archives
            </button>
          )}

          {status === 'update-available' && (
            <button
              onClick={handleDownload}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-medium transition"
            >
              ⚡ Summon the Artifact
            </button>
          )}

          {status === 'downloaded' && (
            <button
              onClick={handleInstall}
              className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded font-medium transition"
            >
              ⚔️ Install & Reforge
            </button>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 border border-[var(--app-border)] hover:bg-[var(--app-bg-subtle)] rounded font-medium transition"
            style={{ color: 'var(--app-text)' }}
          >
            {status === 'downloaded' ? 'Later' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateManager;
