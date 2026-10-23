import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { cleanAuthRedirect } from './aipipe';
import './styles.css';
const callback = cleanAuthRedirect();
if (callback?.token) {
  try { sessionStorage.setItem('orbit.auth.v1', JSON.stringify({...callback, method:'aipipe'})); } catch {}
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
