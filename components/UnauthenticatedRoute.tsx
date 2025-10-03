import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Spinner from './Spinner';

const UnauthenticatedRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return ( <div className="flex h-screen w-full items-center justify-center bg-dark-primary"><Spinner /></div> );
  }
  if (user) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

export default UnauthenticatedRoute;