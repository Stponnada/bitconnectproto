// src/components/UnauthenticatedRoute.tsx

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Spinner from './Spinner';

const UnauthenticatedRoute = () => {
  // We ONLY need user and isLoading here. The profile check is handled by ProtectedRoute.
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-dark-primary">
        <Spinner />
      </div>
    );
  }

  // If a user is logged in, redirect them away from the login page.
  // The ProtectedRoute component will then correctly handle routing them
  // to either the homepage or the setup page.
  if (user) {
    return <Navigate to="/" replace />;
  }

  // If there's no user, allow access to the login page.
  return <Outlet />;
};

export default UnauthenticatedRoute;