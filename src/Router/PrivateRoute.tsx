// src/router/PrivateRoute.tsx
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";
import type { AuthUser } from "../context/AuthContext";
import Loader from "../components/common/Loader";

interface PrivateRouteProps {
  children: ReactNode;
  allowedRoles?: AuthUser["role"][];
}

const PrivateRoute = ({ children, allowedRoles }: PrivateRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <Loader />
      </div>
    );
  }

  // লগইন নেই → login page
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // owner সব access পাবে
  if (user.role === "owner") {
    return <>{children}</>;
  }

  // allowedRoles দেওয়া থাকলে check করো
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // student → profile এ redirect
    if (user.role === "student") {
      return <Navigate to="/dashboard/profile" replace />;
    }
    // teacher → dashboard এ redirect
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
