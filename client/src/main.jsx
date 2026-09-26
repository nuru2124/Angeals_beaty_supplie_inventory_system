import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Global Secure API Interceptor: Automatically injects cryptographic Bearer tokens
// and listens for session expirations across all application views
const originalFetch = window.fetch;
window.fetch = async (url, options = {}) => {
  const token = localStorage.getItem('angales_token');
  const headers = new Headers(options.headers || {});

  // Automatically attach Bearer token for internal API requests
  if (token && typeof url === 'string' && url.startsWith('/api')) {
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const modifiedOptions = {
    ...options,
    headers
  };

  const response = await originalFetch(url, modifiedOptions);

  // If unauthorized / token revoked, notify application to show login
  if (response.status === 401 && typeof url === 'string' && !url.includes('/api/auth/login')) {
    window.dispatchEvent(new CustomEvent('angales_session_expired'));
  }

  return response;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
