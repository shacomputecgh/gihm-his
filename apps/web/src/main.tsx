import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { AuthProvider } from './lib/auth';
import { ConnectionProvider } from './lib/connection';
import { Toaster } from './components/ui';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ConnectionProvider>
          <Toaster>
            <App />
          </Toaster>
        </ConnectionProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
