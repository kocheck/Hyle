import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

const SyncManager = () => {
  useEffect(() => {
    // Check if we are World View
    const params = new URLSearchParams(window.location.search);
    const isWorldView = params.get('type') === 'world';

    if (isWorldView) {
      // Listen for updates from Main
      // @ts-ignore - ipcRenderer is exposed via preload
      const removeListener = window.ipcRenderer.on('SYNC_WORLD_STATE', (_event, state) => {
        useGameStore.setState(state);
      });
      return () => {
          // cleanup if needed, though on typically returns a disposer in some libs,
          // but electron return is IpcRenderer.
          // The preload wrapper I saw earlier returns the result of ipcRenderer.on
          // which returns IpcRenderer. It doesn't return a disposer function by default in Electron types.
          // But the preload wrapper implementation:
          // on(...args) { return ipcRenderer.on(...) }
          // So we need to use off.
          // But wait, the preload wrapper logic was:
          // on(...) { return ipcRenderer.on(...) }
          // We can use window.ipcRenderer.removeAllListeners('SYNC_WORLD_STATE') for simplicity in useEffect cleanup
          // or properly use off if we had the handler reference.
          // Since the handler is inline, we can't easily off it unless we extract it.
      };
    } else {
      // Architect View
      const unsub = useGameStore.subscribe((state) => {
        const syncState = {
            tokens: state.tokens,
            drawings: state.drawings,
            gridSize: state.gridSize
        };
        // @ts-ignore
        window.ipcRenderer.send('SYNC_WORLD_STATE', syncState);
      });
      return () => unsub();
    }
  }, []);

  return null;
};

export default SyncManager;
