import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUserProfile } from "../api/userApi";

const ProtectedRoute = ({
  children,
  requireAdmin = false,
  disallowAdmin = false,
  allowAdminWithoutOrganization = false,
}) => {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let isMounted = true;

    const validateSession = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        if (isMounted) setStatus("unauthorized");
        return;
      }

      try {
        const profile = await getCurrentUserProfile();
        const isAdmin = profile?.role === "ADMIN";
        const hasOrganization = Boolean(profile?.organizationId);

        if (requireAdmin && !isAdmin) {
          if (isMounted) setStatus("forbidden");
          return;
        }

        if (disallowAdmin && isAdmin) {
          if (isMounted) setStatus("admin_redirect");
          return;
        }

        if (
          isAdmin &&
          !hasOrganization &&
          !allowAdminWithoutOrganization &&
          requireAdmin
        ) {
          if (isMounted) setStatus("setup_org");
          return;
        }

        if (isMounted) setStatus("ok");
      } catch (_) {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        if (isMounted) setStatus("unauthorized");
      }
    };

    validateSession();

    return () => {
      isMounted = false;
    };
  }, [allowAdminWithoutOrganization, disallowAdmin, requireAdmin]);

  if (status === "loading") {
    return null;
  }

  if (status === "unauthorized") {
    return <Navigate to="/" replace />;
  }

  if (status === "forbidden") {
    return <Navigate to="/home" replace />;
  }

  if (status === "admin_redirect") {
    return <Navigate to="/admin" replace />;
  }

  if (status === "setup_org") {
    return <Navigate to="/admin/setup-organization" replace />;
  }

  return children;
};

export default ProtectedRoute;
