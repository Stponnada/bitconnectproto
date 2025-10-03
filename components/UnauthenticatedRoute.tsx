// src/components/UnauthenticatedRoute.tsx

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Spinner from './Spinner';

const UnauthenticatedRoute = () => {
  // We need the profile here to make an intelligent redirect decision.
  const { user, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-dark-primary">
        <Spinner />
      </div>
    );
  }

  // If a user is logged in, we need to redirect them away from the login page.
  if (user) {
    
    // --- THIS IS THE FIX ---
    // Instead of always redirecting to "/", we check the profile status first.
    if (profile && !profile.profile_complete) {
      // If the profile is incomplete, send them directly to the setup page.
      return <Navigate to="/setup" replace />;
    }
    
    // Otherwise, the profile is complete, so send them to the homepage.
    return <Navigate to="/" replace />;
  }

  // If there's no user, allow access to the login page.
  return <Outlet />;
};

export default UnauthenticatedRoute;