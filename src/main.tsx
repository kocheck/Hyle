import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import PrivacyErrorBoundary from './components/PrivacyErrorBoundary.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PrivacyErrorBoundary supportEmail="support@hyle.app">
      <App />
    </PrivacyErrorBoundary>
  </React.StrictMode>,
)

// Use contextBridge
window.ipcRenderer.on('main-process-message', (_event, message) => {
  console.log(message)
})
