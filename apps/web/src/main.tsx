/**
 * Copyright 2026 Google LLC
 * Licensed under the Apache License, Version 2.0
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, AppStateProvider } from '@immersive-lang/ui';
import '@immersive-lang/ui/styles';
import App from './App';

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
