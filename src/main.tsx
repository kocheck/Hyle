import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import PrivacyErrorBoundary from './components/PrivacyErrorBoundary.tsx'
import PendingErrorsIndicator from './components/PendingErrorsIndicator.tsx'
import { initGlobalErrorHandlers } from './utils/globalErrorHandler.ts'
import { initStorage } from './services/storage.ts'
import './index.css'

// Initialize global error handlers for non-React errors
// This catches window.onerror and unhandled promise rejections
initGlobalErrorHandlers()

/**
 * Initialize app with async dependencies
 *
 * Storage service must be initialized before React renders,
 * as components may call getStorage() during mount.
 */
async function initApp() {
  try {
    // Initialize storage service (detects Electron vs Web)
    await initStorage()
    console.log('[main] Storage initialized successfully')
  } catch (error) {
    console.error('[main] Failed to initialize storage:', error)
    // Continue anyway - components will handle storage errors
  }

  // Render React app
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <PrivacyErrorBoundary supportEmail="support@hyle.app">
        <App />
        <PendingErrorsIndicator supportEmail="support@hyle.app" position="bottom-right" />
      </PrivacyErrorBoundary>
    </React.StrictMode>,
  )
}

// Start app initialization
initApp()

// Use contextBridge (if available - not present in browser testing)
if (window.ipcRenderer) {
  window.ipcRenderer.on('main-process-message', (_event, message) => {
    console.log(message)
  })
}
