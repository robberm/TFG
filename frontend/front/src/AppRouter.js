
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Home from './Home';
import App from './App';
import Objectives from './Objectives';
import Settings from './Settings';
import ProtectedRoute from './components/ProtectedRoute';
import Calendar from './Calendar';

const AppRouter = () => {
  return (
    
      <Routes>
         {/*------------- Rutas públicas ------------- */}
        <Route path="/" element={<App />} />
        
        {/*------------- Rutas protegidas------------- */}
        <Route path="/home" element={<ProtectedRoute><Home/></ProtectedRoute>} />
        <Route path="/objectives" element={<ProtectedRoute><Objectives/></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings/></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><Calendar/></ProtectedRoute>} />
      </Routes>
    
  );
};

export default AppRouter;
