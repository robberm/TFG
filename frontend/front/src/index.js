import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRouter from './AppRouter';
import { BrowserRouter } from 'react-router-dom';
import { ErrorMessageGenerator } from './components/ErrorContext';
import ErrorBox from './components/Error';
import MainLayout from './MainLayout';

import './css/index.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { DarkModeProvider } from './DarkModeContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <DarkModeProvider>
      <ErrorMessageGenerator>
        <ErrorBox />
        <BrowserRouter>
          <MainLayout>
            <AppRouter />
          </MainLayout>
        </BrowserRouter>
      </ErrorMessageGenerator>
    </DarkModeProvider>
  </React.StrictMode>
);
