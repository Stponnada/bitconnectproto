// src/components/ProtectedRoute.tsx (Corrected Architecture)

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Spinner from './Spinner';

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  // THIS IS THE NEW, 3-STEP LOGIC:
  // 1. If the context is still loading, show the spinner.
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark">
        <Spinner />
      </div>
    );
  }

  // 2. If loading is finished AND there is no user, redirect to login.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. If loading is finished AND there is a user, show the requested page.
  return <Outlet />;
};

export default ProtectedRoute;
