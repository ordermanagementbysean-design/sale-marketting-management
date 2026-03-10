import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar, SIDEBAR_WIDTH } from "./components/Sidebar";
import { Header } from "./components/Header";

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
  "/": "layout.header.overview",
  "/orders": "layout.header.orders",
  "/products": "layout.header.products",
  "/products/sale-periods": "layout.header.salePeriodList",
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
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default memo(AdminLayoutComponent);
