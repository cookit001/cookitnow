import React from 'react';
import ReactDOM from 'react-dom/client';
// Fix: Explicitly add file extension to assist module resolution.
import App from './App.tsx';
import { ToastProvider } from './components/ToastProvider.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
);