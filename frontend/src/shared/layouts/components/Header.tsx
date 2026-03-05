import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import AppBar from "@mui/material/AppBar";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircle from "@mui/icons-material/AccountCircle";
import { useAuth } from "@/features/auth/context/AuthContext";

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

const appBarSx: SxProps<Theme> = {
  bgcolor: "background.paper",
  color: "text.primary",
  borderBottom: 1,
  borderColor: "divider",
};

const titleSx: SxProps<Theme> = { flexGrow: 1, fontWeight: 600 };
const menuButtonSx: SxProps<Theme> = { mr: 1 };

const languageSelectSx: SxProps<Theme> = { minWidth: 120, mr: 1, "& .MuiSelect-select": { py: 1 } };

const HeaderComponent = ({
  title,
  onMenuClick,
  showMenuButton = false,
}: HeaderProps) => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const [accountAnchor, setAccountAnchor] = useState<null | HTMLElement>(null);
  const displayTitle = title ?? t("layout.header.admin");

  const handleAccountOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAccountAnchor(e.currentTarget);
  };
  const handleAccountClose = () => setAccountAnchor(null);
  const handleLogout = () => {
    handleAccountClose();
    logout();
  };

  return (
    <AppBar position="sticky" elevation={0} sx={appBarSx}>
      <Toolbar>
        {showMenuButton && (
          <IconButton
            color="inherit"
            aria-label="menu"
            onClick={onMenuClick}
            edge="start"
            sx={menuButtonSx}
          >
            <MenuIcon />
          </IconButton>
        )}
        <Typography variant="h6" component="h1" sx={titleSx}>
          {displayTitle}
        </Typography>
        <Select
          size="small"
          value={i18n.language.startsWith("en") ? "en" : "vi"}
          onChange={(e) => i18n.changeLanguage(e.target.value)}
          sx={languageSelectSx}
          variant="outlined"
        >
          <MenuItem value="vi">{t("languages.vi")}</MenuItem>
          <MenuItem value="en">{t("languages.en")}</MenuItem>
        </Select>
        <IconButton
          color="inherit"
          size="large"
          aria-label="account"
          onClick={handleAccountOpen}
        >
          <AccountCircle />
        </IconButton>
        <Menu
          anchorEl={accountAnchor}
          open={!!accountAnchor}
          onClose={handleAccountClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          {user && (
            <MenuItem disabled sx={{ opacity: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
            </MenuItem>
          )}
          <MenuItem onClick={handleLogout}>{t("auth.logout")}</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export const Header = memo(HeaderComponent);
