import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import { applyTheme, getCurrentMode, getCurrentPaletteId } from './utils/theme';
import './i18n';
import './index.css';

const savedMode = getCurrentMode() || 'light';
applyTheme(savedMode, getCurrentPaletteId());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
