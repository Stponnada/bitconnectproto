// src/components/UnauthenticatedRoute.tsx

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Spinner from './Spinner';

const UnauthenticatedRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-dark-primary">
        <Spinner />
      </div>
    );
  }

  // If loading is finished AND a user exists, redirect them away from login.
  if (user) {
    return <Navigate to="/" replace />;
  }

  // If loading is finished and there is no user, show the login page.
  return <Outlet />;
};

export default UnauthenticatedRoute;