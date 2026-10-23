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
    // Ask AI Pipe's official helper to restore its sign-in profile. Preserve a
    // manually entered token if the user has not connected through AI Pipe.
    try {
      const profile = await getAIPipeProfile();
      if (profile.token) {
        localStorage.setItem(KEY, JSON.stringify({ token: profile.token, email: profile.email || undefined, method: 'aipipe' }));
      }
    } catch {
      // Manual token mode remains available if the helper is unavailable.
    }
  }
  createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
}

void bootstrap();
