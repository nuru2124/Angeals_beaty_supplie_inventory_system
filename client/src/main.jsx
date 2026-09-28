import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { handleMockRequest } from './demo/demoEngine';

// Global Secure API Interceptor:
// Automatically routes internal API requests through the client-side Pitch Demo Engine
// on Vercel and demo environments, with token injection and session expiration handling.
const originalFetch = window.fetch;

window.fetch = async (url, options = {}) => {
  const isApiRequest = typeof url === 'string' && url.startsWith('/api');
  const token = localStorage.getItem('angales_token');
  const headers = new Headers(options.headers || {});

  if (token && isApiRequest && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const modifiedOptions = {
    ...options,
    headers
  };

  // On Vercel, static preview environments, or Pitch Demo mode:
  // Route /api calls through the high-speed interactive Demo Engine
  const isVercelOrRemote = typeof window !== 'undefined' && (
    window.location.hostname.includes('vercel.app') ||
    window.location.hostname !== 'localhost' ||
    localStorage.getItem('angales_demo_mode') !== 'disabled'
  );

  if (isApiRequest && isVercelOrRemote) {
    try {
      return await handleMockRequest(url, modifiedOptions);
    } catch (err) {
      console.warn('Demo Engine handler warning:', err);
    }
  }

  try {
    const response = await originalFetch(url, modifiedOptions);

    // If live API returns 404 on Vercel, fallback to Demo Engine
    if (response.status === 404 && isApiRequest) {
      return await handleMockRequest(url, modifiedOptions);
    }

    if (response.status === 401 && isApiRequest && !url.includes('/api/auth/login')) {
      window.dispatchEvent(new CustomEvent('angales_session_expired'));
    }

    return response;
  } catch (netErr) {
    // If backend is offline or unreachable, seamlessly activate Pitch Demo Engine
    if (isApiRequest) {
      return await handleMockRequest(url, modifiedOptions);
    }
    throw netErr;
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
