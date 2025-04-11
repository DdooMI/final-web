import { useAuth } from '../zustand/auth';
import { Navigate, useLocation } from 'react-router-dom';

export const ProtectedRoute = ({ children }) => {
  const { user, role } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role !== 'admin') {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};