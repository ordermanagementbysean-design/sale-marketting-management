import { memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import type { SxProps, Theme } from "@mui/material/styles";
import { useNavigate, useLocation } from "react-router-dom";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import { useAuth } from "@/features/auth/context/AuthContext";

const SIDEBAR_WIDTH = 260;

const allMenuItems = [
  { path: "/", labelKey: "layout.sidebar.overview", icon: <DashboardOutlinedIcon />, requireManageUsers: false },
  { path: "/orders", labelKey: "layout.sidebar.orders", icon: <ShoppingCartOutlinedIcon />, requireManageUsers: false },
  { path: "/products", labelKey: "layout.sidebar.products", icon: <Inventory2OutlinedIcon />, requireManageUsers: false },
  { path: "/users", labelKey: "layout.sidebar.users", icon: <PeopleOutlinedIcon />, requireManageUsers: true },
  { path: "/profile", labelKey: "layout.sidebar.profile", icon: <PersonOutlinedIcon />, requireManageUsers: false },
] as const;

const rootSx: SxProps<Theme> = {
  width: SIDEBAR_WIDTH,
  flexShrink: 0,
  bgcolor: "background.paper",
  borderRight: 1,
  borderColor: "divider",
  height: "100vh",
  display: "flex",
  flexDirection: "column",
};

const logoWrapperSx: SxProps<Theme> = { p: 2, borderBottom: 1, borderColor: "divider" };
const logoTextSx: SxProps<Theme> = { fontSize: "1.25rem", fontWeight: 700, color: "primary.main" };
const listSx: SxProps<Theme> = { flex: 1, pt: 1 };

const itemButtonSx: SxProps<Theme> = {
  mx: 1,
  borderRadius: 1,
  "&.Mui-selected": {
    bgcolor: "primary.main",
    color: "primary.contrastText",
    "&:hover": { bgcolor: "primary.dark" },
    "& .MuiListItemIcon-root": { color: "inherit" },
  },
};
const itemIconSx: SxProps<Theme> = { minWidth: 40 };

const SidebarComponent = () => {
  const { t } = useTranslation();
  const { canManageUsers } = useAuth();
  const navigate = useNavigate();
  const pathname = useLocation().pathname;

  const handleNav = useCallback(
    (path: string) => () => {
      navigate(path);
    },
    [navigate]
  );

  const menuItems = useMemo(
    () =>
      allMenuItems
        .filter((item) => !item.requireManageUsers || canManageUsers)
        .map((item) => ({ ...item, label: t(item.labelKey) })),
    [t, canManageUsers]
  );

  return (
    <Box sx={rootSx}>
      <Box sx={logoWrapperSx}>
        <Box component="span" sx={logoTextSx}>
          {t("layout.sidebar.appName")}
        </Box>
      </Box>
      <List component="nav" sx={listSx}>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.path}
            selected={pathname === item.path}
            onClick={handleNav(item.path)}
            sx={itemButtonSx}
          >
            <ListItemIcon sx={itemIconSx}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
};

export const Sidebar = memo(SidebarComponent);
export { SIDEBAR_WIDTH };
