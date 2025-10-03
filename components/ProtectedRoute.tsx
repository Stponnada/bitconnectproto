// src/components/ProtectedRoute.tsx

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Spinner from './Spinner';

const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();

  // 1. While we're checking for a user, show a loading spinner
  if (isLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-dark-primary">
            <Spinner />
        </div>
    );
  }

  // 2. After loading, if there's a user, show the requested page
  if (user) {
    return <Outlet />; // Renders the child route (e.g., Home, Profile)
  }

  // 3. If there's no user, redirect to the login page
  return <Navigate to="/login" replace />;
};

export default ProtectedRoute;