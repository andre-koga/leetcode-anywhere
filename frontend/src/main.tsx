import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { AuthProvider } from './auth/AuthProvider';
import { ProfileProvider } from './auth/ProfileProvider';
import { requestPersistentStorage } from './db/db';
import './index.css';

registerSW({ immediate: true });
requestPersistentStorage();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ProfileProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ProfileProvider>
    </AuthProvider>
  </StrictMode>,
);
