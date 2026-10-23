import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { cleanAuthRedirect, getAIPipeProfile } from './aipipe';
import './styles.css';

const KEY = 'orbit.auth.v1';
const callback = cleanAuthRedirect();

async function bootstrap() {
  if (callback?.token) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...callback, method: 'aipipe' }));
      sessionStorage.removeItem(KEY);
    } catch {}
  } else {
    // Respect an explicitly chosen manual token. Otherwise let AI Pipe's
    // official helper restore/refresh its own sign-in profile on later visits.
    let savedMethod = '';
    try { savedMethod = JSON.parse(localStorage.getItem(KEY) || '{}').method || ''; } catch {}
    if (savedMethod !== 'manual') {
      try {
        const profile = await getAIPipeProfile();
        if (profile.token) {
          localStorage.setItem(KEY, JSON.stringify({ token: profile.token, email: profile.email || undefined, method: 'aipipe' }));
        }
      } catch {
        // Manual token mode remains available if the helper is unavailable.
      }
    }
  }
  createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
}

void bootstrap();
