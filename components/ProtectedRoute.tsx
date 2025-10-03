// src/components/ProtectedRoute.tsx

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Spinner from './Spinner';

const ProtectedRoute = () => {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();

  // 1. While checking for user and profile, show a loading spinner
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // 2. After loading, if there's no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. --- NEW LOGIC ---
  // If the user has a profile but it's incomplete, redirect to the setup page,
  // unless they are already on the setup page (to prevent a loop).
  if (profile && !profile.profile_complete && location.pathname !== '/setup') {
    return <Navigate to="/setup" replace />;
  }
  
  // 4. If everything is fine, show the requested page
  return <Outlet />;
};

export default ProtectedRoute;