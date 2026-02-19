
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { UniversalBuildMonitor } from './utils/buildMonitor';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("[Critical] Sanctuary Core failed: Root element missing.");
}

console.log("[Sanctuary] Initializing Core v24.0.0 • Sovereign Bridge Protocol...");

// --- INITIALIZE THE HISTORIAN ---
UniversalBuildMonitor.initialize({
    appName: "COUNCIL_OF_CODEX",
    initialBuildInfo: {
        environment: 'production',
        version: '24.0.0'
    }
});

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
