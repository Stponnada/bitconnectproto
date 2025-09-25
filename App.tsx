import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Login from './pages/Login';
import ProfileSetup from './pages/ProfileSetup';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/setup" element={
            <ProtectedRoute>
              <ProfileSetup />
            </ProtectedRoute>
          } />
          <Route 
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/profile/:username" element={<Profile />} />
                    <Route path="/accounts/edit" element={<Settings />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;