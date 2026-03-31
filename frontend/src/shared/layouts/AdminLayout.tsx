import { Component, type ErrorInfo, type ReactNode, memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar, SIDEBAR_WIDTH } from "./components/Sidebar";
import { Header } from "./components/Header";

class OutletErrorBoundary extends Component<
  { children: ReactNode; pathname: string },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error): { error: Error } {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Route render error:", error, info.componentStack);
  }

  componentDidUpdate(prevProps: { pathname: string }): void {
    if (prevProps.pathname !== this.props.pathname && this.state.error) {
      this.setState({ error: null });
    }
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <Box sx={{ p: 3 }}>
          <Typography color="error" gutterBottom>
            {this.state.error.message}
          </Typography>
          <Button variant="outlined" size="small" onClick={() => this.setState({ error: null })}>
            Retry
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

const mainWrapperSx: SxProps<Theme> = {
  display: "flex",
  minHeight: "100vh",
  bgcolor: "grey.50",
};

const mainAreaSx: SxProps<Theme> = {
  flexGrow: 1,
  display: "flex",
  flexDirection: "column",
  width: { xs: "100%", sm: `calc(100% - ${SIDEBAR_WIDTH}px)` },
  minHeight: "100vh",
};

const contentSx: SxProps<Theme> = {
  flex: 1,
  p: 3,
  overflow: "auto",
};

const pathToTitleKey: Record<string, string> = {
  "/dashboard": "layout.header.overview",
  "/orders": "layout.header.orders",
  "/products": "layout.header.products",
  "/products/new": "layout.header.createProduct",
  "/products/import": "layout.header.productImport",
  "/products/sale-periods": "layout.header.salePeriodList",
  "/products/sale-periods/import": "layout.header.salePeriodImport",
  "/products/sale-periods/status-report": "layout.header.salePeriodStatusReport",
  "/products/sale-periods/status-report/profit-colors": "layout.header.salePeriodStatusReportProfitColors",
  "/products/add-sale-period": "layout.header.addSalePeriod",
  "/users": "layout.header.users",
  "/profile": "layout.header.profile",
  "/profile/change-password": "users.changePasswordTitle",
  "/ai-page-builder": "layout.header.aiPageBuilder",
};

const AdminLayoutComponent = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const title = useMemo(
    () => t(pathToTitleKey[pathname] ?? "layout.header.admin"),
    [pathname, t]
  );

  return (
    <Box sx={mainWrapperSx}>
      <Sidebar />
      <Box component="main" sx={mainAreaSx}>
        <Header title={title} />
        <Box component="main" sx={contentSx}>
          <OutletErrorBoundary pathname={pathname}>
            <Outlet />
          </OutletErrorBoundary>
        </Box>
      </Box>
    </Box>
  );
};

export default memo(AdminLayoutComponent);
