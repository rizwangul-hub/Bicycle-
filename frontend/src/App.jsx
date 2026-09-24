import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import {
  Login,
  Dashboard,
  CreateDeclaration,
  Declarations,
  DeclarationDetail,
} from './pages';
import {
  AdminDashboard,
  AdminShops,
  AdminUsers,
  AdminDeclarations,
} from './pages/admin';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Shop Staff Routes */}
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

          {/* Protected Admin Routes (Full Access for ADMIN role) */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/declarations"
            element={
              <AdminRoute>
                <AdminDeclarations />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/shops"
            element={
              <AdminRoute>
                <AdminShops />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
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
