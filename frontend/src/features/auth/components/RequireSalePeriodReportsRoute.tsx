import { memo, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { useAuth } from "../context/AuthContext";

interface RequireSalePeriodReportsRouteProps {
  children: ReactNode;
}

/**
 * Routes for sale period list / status report (see UserRole::canViewSalePeriodsAndReports on the API).
 */
const RequireSalePeriodReportsRouteComponent = ({
  children,
}: RequireSalePeriodReportsRouteProps) => {
  const { isLoading, canViewSalePeriodsAndReports } = useAuth();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "40vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!canViewSalePeriodsAndReports) {
    return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
};

export const RequireSalePeriodReportsRoute = memo(RequireSalePeriodReportsRouteComponent);
