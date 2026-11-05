
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ requiredRole }) {
  const { user, loading } = useAuth();

  // Wait until the existing login session is checked.
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-500">Checking access...</p>
      </div>
    );
  }

  // User must be logged in.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check whether the user has the required role.
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
