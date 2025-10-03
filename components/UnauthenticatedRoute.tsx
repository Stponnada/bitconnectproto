// src/components/UnauthenticatedRoute.tsx

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Spinner from './Spinner';

const UnauthenticatedRoute = () => {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-dark-primary">
        <Spinner />
      </div>
    );
  }

  if (user) {
    // User is logged in, so redirect them away from the login page
    if (profile && !profile.profile_complete) {
      // If profile is incomplete, force them to the setup page
      return <Navigate to="/setup" replace />;
    }
    // Otherwise, they are fully set up, so send them to the homepage
    return <Navigate to="/" replace />;
  }

  // User is not logged in, so allow them to see the child route (the Login page)
  return <Outlet />;
};

export default UnauthenticatedRoute;