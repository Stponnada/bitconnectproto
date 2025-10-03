// src/components/ProtectedRoute.tsx

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Spinner from './Spinner';

const ProtectedRoute = () => {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-dark-primary">
        <Spinner />
      </div>
    );
  }

  // If loading is finished and there's no user, redirect to login.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user exists, but their profile is incomplete, force them to setup.
  if (profile && !profile.profile_complete && location.pathname !== '/setup') {
    return <Navigate to="/setup" replace />;
  }
  
  // If everything is fine, show the intended page.
  return <Outlet />;
};

export default ProtectedRoute;