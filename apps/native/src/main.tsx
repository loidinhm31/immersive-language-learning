import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppStateProvider, ThemeProvider } from '@immersive-lang/ui';
import '@immersive-lang/ui/styles';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <AppStateProvider>
          <App />
        </AppStateProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
