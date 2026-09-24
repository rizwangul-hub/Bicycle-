import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import {
  Login,
  Dashboard,
  CreateDeclaration,
  Declarations,
  DeclarationDetail,
} from './pages';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes (Shop Staff) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-declaration"
            element={
              <ProtectedRoute>
                <CreateDeclaration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/declarations"
            element={
              <ProtectedRoute>
                <Declarations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/declarations/:id"
            element={
              <ProtectedRoute>
                <DeclarationDetail />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
