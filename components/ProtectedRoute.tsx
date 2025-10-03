import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Spinner from './Spinner';

const ProtectedRoute = () => {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return ( <div className="flex h-screen w-full items-center justify-center bg-dark-primary"><Spinner /></div> );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (profile && !profile.profile_complete && location.pathname !== '/setup') {
    return <Navigate to="/setup" replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;