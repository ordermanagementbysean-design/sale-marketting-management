import { memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: string;
  onClick?: () => void;
}

const statCardSx = (onClick?: () => void): SxProps<Theme> => ({
  height: "100%",
  cursor: onClick ? "pointer" : "default",
  transition: "box-shadow 0.2s, transform 0.2s",
  "&:hover": onClick ? { boxShadow: 4, transform: "translateY(-2px)" } : {},
});

const statCardContentSx: SxProps<Theme> = { p: 3 };
const statCardInnerSx: SxProps<Theme> = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
};
const statCardIconSx = (color: string): SxProps<Theme> => ({
  width: 48,
  height: 48,
  borderRadius: 2,
  bgcolor: `${color}20`,
  color,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});
const subtitleSx: SxProps<Theme> = { mt: 0.5, display: "block" };

const StatCard = memo(function StatCard({
  title,
  value,
  subtitle,
  icon,
  color = "primary.main",
  onClick,
}: StatCardProps) {
  const cardSx = useMemo(() => statCardSx(onClick), [onClick]);
  const iconBoxSx = useMemo(() => statCardIconSx(color), [color]);
  return (
    <Card onClick={onClick} sx={cardSx}>
      <CardContent sx={statCardContentSx}>
        <Box sx={statCardInnerSx}>
          <Box>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={subtitleSx}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={iconBoxSx}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );
});

const GRID_SIZE = { xs: 12, sm: 6, md: 3 } as const;
const quickCardSx: SxProps<Theme> = { mt: 3 };
const quickCardContentSx: SxProps<Theme> = { p: 3 };
const quickButtonSx: SxProps<Theme> = {
  display: "inline-flex",
  alignItems: "center",
  gap: 1,
  px: 2,
  py: 1.5,
  borderRadius: 1,
  border: "none",
  bgcolor: "primary.main",
  color: "primary.contrastText",
  fontWeight: 600,
  cursor: "pointer",
  "&:hover": { bgcolor: "primary.dark" },
};
const pageTitleSx: SxProps<Theme> = { mb: 3 };

const cartIcon = <ShoppingCartOutlinedIcon fontSize="medium" />;
const pendingIcon = <PendingActionsIcon fontSize="medium" />;
const shippingIcon = <LocalShippingOutlinedIcon fontSize="medium" />;
const trendingIcon = <TrendingUpIcon fontSize="medium" />;

const DashboardPageComponent = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const goToOrders = useCallback(() => {
    navigate("/orders");
  }, [navigate]);

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} sx={pageTitleSx}>
        {t("dashboard.welcome")}
      </Typography>

      <Grid container spacing={3}>
        <Grid size={GRID_SIZE}>
          <StatCard
            title={t("dashboard.totalOrders")}
            value="—"
            subtitle={t("dashboard.totalOrdersSub")}
            icon={cartIcon}
            color="primary.main"
            onClick={goToOrders}
          />
        </Grid>
        <Grid size={GRID_SIZE}>
          <StatCard
            title={t("dashboard.pending")}
            value="—"
            subtitle={t("dashboard.pendingSub")}
            icon={pendingIcon}
            color="warning.main"
          />
        </Grid>
        <Grid size={GRID_SIZE}>
          <StatCard
            title={t("dashboard.transporting")}
            value="—"
            subtitle={t("dashboard.transportingSub")}
            icon={shippingIcon}
            color="info.main"
          />
        </Grid>
        <Grid size={GRID_SIZE}>
          <StatCard
            title={t("dashboard.delivered")}
            value="—"
            subtitle={t("dashboard.deliveredSub")}
            icon={trendingIcon}
            color="success.main"
          />
        </Grid>
      </Grid>

      <Card sx={quickCardSx}>
        <CardContent sx={quickCardContentSx}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {t("dashboard.quickAccess")}
          </Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
            {t("dashboard.quickAccessDesc")}
          </Typography>
          <Box component="button" onClick={goToOrders} sx={quickButtonSx}>
            <ShoppingCartOutlinedIcon fontSize="small" />
            {t("dashboard.viewOrders")}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

const DashboardPage = memo(DashboardPageComponent);
export default DashboardPage;
