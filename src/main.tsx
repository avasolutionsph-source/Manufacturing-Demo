import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

async function enableMocking() {
  // Enable MSW in all environments since this is a demo app with no real backend
  const { worker } = await import('./mocks/browser');

  // Start the worker
  return worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: {
      url: '/mockServiceWorker.js',
    },
  });
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
