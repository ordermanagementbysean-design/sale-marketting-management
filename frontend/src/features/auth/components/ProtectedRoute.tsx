import { memo, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { panelPath } from "@/constants/routes";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRouteComponent = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          bgcolor: "grey.100",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={panelPath("login")} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const ProtectedRoute = memo(ProtectedRouteComponent);
