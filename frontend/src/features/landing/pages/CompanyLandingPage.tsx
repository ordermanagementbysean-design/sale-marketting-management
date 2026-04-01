import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import type { SxProps, Theme } from "@mui/material/styles";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import HandshakeOutlinedIcon from "@mui/icons-material/HandshakeOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";

const palette = {
  bg: "#0b1220",
  bgElevated: "#121a2b",
  accent: "#e8b84a",
  accentMuted: "rgba(232, 184, 74, 0.15)",
  text: "#e8edf7",
  textMuted: "rgba(232, 237, 247, 0.72)",
  border: "rgba(255,255,255,0.08)",
  mesh:
    "radial-gradient(ellipse 80% 50% at 20% -10%, rgba(232, 184, 74, 0.18), transparent 50%), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(56, 189, 248, 0.12), transparent 45%), linear-gradient(180deg, #0b1220 0%, #0a0f18 100%)",
};

const fontDisplay = '"Fraunces", "Georgia", serif';
const fontBody = '"DM Sans", system-ui, sans-serif';

const sectionSx: SxProps<Theme> = {
  py: { xs: 6, md: 9 },
};

const CompanyLandingPageComponent = () => {
  const { t, i18n } = useTranslation();

  const productItems = useMemo(
    () => [
      t("landing.products.lighting"),
      t("landing.products.security"),
      t("landing.products.lock"),
      t("landing.products.curtain"),
      t("landing.products.audio"),
      t("landing.products.appliances"),
      t("landing.products.integration"),
    ],
    [t]
  );

  const valueItems = useMemo(
    () => [
      {
        icon: <VerifiedOutlinedIcon sx={{ fontSize: 28 }} />,
        titleKey: "landing.values.quality.title",
        bodyKey: "landing.values.quality.body",
      },
      {
        icon: <GroupsOutlinedIcon sx={{ fontSize: 28 }} />,
        titleKey: "landing.values.customer.title",
        bodyKey: "landing.values.customer.body",
      },
      {
        icon: <LightbulbOutlinedIcon sx={{ fontSize: 28 }} />,
        titleKey: "landing.values.innovation.title",
        bodyKey: "landing.values.innovation.body",
      },
      {
        icon: <SecurityOutlinedIcon sx={{ fontSize: 28 }} />,
        titleKey: "landing.values.trust.title",
        bodyKey: "landing.values.trust.body",
      },
      {
        icon: <HandshakeOutlinedIcon sx={{ fontSize: 28 }} />,
        titleKey: "landing.values.partnership.title",
        bodyKey: "landing.values.partnership.body",
      },
    ],
    []
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: palette.bg,
        color: palette.text,
        fontFamily: fontBody,
        backgroundImage: palette.mesh,
        backgroundAttachment: "fixed",
      }}
    >
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          borderBottom: `1px solid ${palette.border}`,
          backdropFilter: "blur(12px)",
          bgcolor: "rgba(11, 18, 32, 0.85)",
        }}
      >
        <Container maxWidth="lg" sx={{ py: 2, display: "flex", alignItems: "center", gap: 2 }}>
          <Typography
            component="span"
            sx={{
              fontFamily: fontDisplay,
              fontWeight: 700,
              fontSize: { xs: "1.05rem", sm: "1.2rem" },
              letterSpacing: "-0.02em",
              flex: 1,
            }}
          >
            {t("landing.navBrand")}
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pt: { xs: 6, md: 10 }, pb: 4 }}>
        <Grid container spacing={4} alignItems="center">
          <Grid size={{ xs: 12, md: 7 }}>
            <Typography
              variant="overline"
              sx={{
                color: palette.accent,
                letterSpacing: "0.2em",
                fontWeight: 600,
                display: "block",
                mb: 2,
              }}
            >
              {t("landing.heroKicker")}
            </Typography>
            <Typography
              component="h1"
              sx={{
                fontFamily: fontDisplay,
                fontWeight: 700,
                fontSize: { xs: "2.25rem", sm: "2.75rem", md: "3.25rem" },
                lineHeight: 1.15,
                letterSpacing: "-0.03em",
                mb: 2,
              }}
            >
              {t("landing.heroTitle")}
            </Typography>
            <Typography
              sx={{
                color: palette.textMuted,
                fontSize: { xs: "1rem", md: "1.125rem" },
                lineHeight: 1.7,
                maxWidth: 560,
                mb: 3,
              }}
            >
              {t("landing.heroSubtitle")}
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                variant="contained"
                size="large"
                href="#about"
                sx={{
                  bgcolor: palette.accent,
                  color: palette.bg,
                  fontWeight: 700,
                  px: 3,
                  "&:hover": { bgcolor: "#f0c65c" },
                }}
              >
                {t("landing.ctaDiscover")}
              </Button>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Box
              sx={{
                position: "relative",
                borderRadius: 3,
                p: 3,
                bgcolor: palette.bgElevated,
                border: `1px solid ${palette.border}`,
                overflow: "hidden",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(135deg, rgba(232,184,74,0.08) 0%, transparent 55%, rgba(56,189,248,0.06) 100%)",
                  pointerEvents: "none",
                },
              }}
            >
              <Typography variant="subtitle2" sx={{ color: palette.accent, mb: 2, position: "relative" }}>
                {t("landing.statsHeading")}
              </Typography>
              <Grid container spacing={2} sx={{ position: "relative" }}>
                {[
                  { label: t("landing.statFounded"), value: "2025" },
                  { label: t("landing.statHQ"), value: t("landing.statHQValue") },
                  { label: t("landing.statTeam"), value: t("landing.statTeamValue") },
                  { label: t("landing.statField"), value: t("landing.statFieldShort") },
                ].map((row) => (
                  <Grid size={6} key={row.label}>
                    <Typography variant="h5" sx={{ fontFamily: fontDisplay, fontWeight: 700 }}>
                      {row.value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: palette.textMuted }}>
                      {row.label}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Container>

      <Box id="about" sx={{ ...sectionSx, bgcolor: "rgba(0,0,0,0.2)" }}>
        <Container maxWidth="lg">
          <Typography
            component="h2"
            sx={{
              fontFamily: fontDisplay,
              fontWeight: 700,
              fontSize: { xs: "1.75rem", md: "2.25rem" },
              mb: 2,
            }}
          >
            {t("landing.aboutTitle")}
          </Typography>
          <Typography sx={{ color: palette.textMuted, lineHeight: 1.85, maxWidth: 900, mb: 3 }}>
            {t("landing.aboutBody")}
          </Typography>
          <Typography sx={{ color: palette.textMuted, lineHeight: 1.85, maxWidth: 900 }}>
            {t("landing.aboutBody2")}
          </Typography>
        </Container>
      </Box>

      <Box sx={sectionSx}>
        <Container maxWidth="lg">
          <Typography
            component="h2"
            sx={{
              fontFamily: fontDisplay,
              fontWeight: 700,
              fontSize: { xs: "1.75rem", md: "2.25rem" },
              mb: 3,
            }}
          >
            {t("landing.productsTitle")}
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
            {productItems.map((label) => (
              <Chip
                key={label}
                label={label}
                sx={{
                  bgcolor: palette.bgElevated,
                  color: palette.text,
                  border: `1px solid ${palette.border}`,
                  py: 2.5,
                  px: 0.5,
                  fontSize: "0.9rem",
                  "& .MuiChip-label": { whiteSpace: "normal", textAlign: "left" },
                }}
              />
            ))}
          </Box>
        </Container>
      </Box>

      <Box sx={{ ...sectionSx, bgcolor: "rgba(0,0,0,0.2)" }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography
                component="h2"
                sx={{
                  fontFamily: fontDisplay,
                  fontWeight: 700,
                  fontSize: "1.35rem",
                  color: palette.accent,
                  mb: 1.5,
                }}
              >
                {t("landing.visionTitle")}
              </Typography>
              <Typography sx={{ color: palette.textMuted, lineHeight: 1.8 }}>{t("landing.visionBody")}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography
                component="h2"
                sx={{
                  fontFamily: fontDisplay,
                  fontWeight: 700,
                  fontSize: "1.35rem",
                  color: palette.accent,
                  mb: 1.5,
                }}
              >
                {t("landing.missionTitle")}
              </Typography>
              <Stack component="ul" spacing={1.5} sx={{ m: 0, pl: 2.5, color: palette.textMuted, lineHeight: 1.7 }}>
                <Typography component="li" variant="body2">
                  {t("landing.mission1")}
                </Typography>
                <Typography component="li" variant="body2">
                  {t("landing.mission2")}
                </Typography>
                <Typography component="li" variant="body2">
                  {t("landing.mission3")}
                </Typography>
                <Typography component="li" variant="body2">
                  {t("landing.mission4")}
                </Typography>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography
                component="h2"
                sx={{
                  fontFamily: fontDisplay,
                  fontWeight: 700,
                  fontSize: "1.35rem",
                  color: palette.accent,
                  mb: 1.5,
                }}
              >
                {t("landing.directionsTitle")}
              </Typography>
              <Typography sx={{ color: palette.textMuted, lineHeight: 1.8 }}>{t("landing.directionsBody")}</Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box sx={sectionSx}>
        <Container maxWidth="lg">
          <Typography
            component="h2"
            sx={{
              fontFamily: fontDisplay,
              fontWeight: 700,
              fontSize: { xs: "1.75rem", md: "2.25rem" },
              mb: 3,
            }}
          >
            {t("landing.valuesTitle")}
          </Typography>
          <Grid container spacing={2.5}>
            {valueItems.map((item) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.titleKey}>
                <Box
                  sx={{
                    height: "100%",
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: palette.bgElevated,
                    border: `1px solid ${palette.border}`,
                    transition: "transform 0.2s, border-color 0.2s",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      borderColor: "rgba(232, 184, 74, 0.35)",
                    },
                  }}
                >
                  <Box sx={{ color: palette.accent, mb: 1.5 }}>{item.icon}</Box>
                  <Typography sx={{ fontWeight: 700, mb: 1, fontFamily: fontDisplay }}>{t(item.titleKey)}</Typography>
                  <Typography variant="body2" sx={{ color: palette.textMuted, lineHeight: 1.7 }}>
                    {t(item.bodyKey)}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Box
        component="footer"
        sx={{
          borderTop: `1px solid ${palette.border}`,
          py: 5,
          bgcolor: palette.bgElevated,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography sx={{ fontFamily: fontDisplay, fontWeight: 700, mb: 2 }}>{t("landing.footerCompany")}</Typography>
              <Typography variant="body2" sx={{ color: palette.textMuted, lineHeight: 1.8 }}>
                {t("landing.footerAddress")}
                <br />
                {t("landing.footerTax")}
                <br />
                {t("landing.footerPhone")}
                <br />
                {t("landing.footerEmail")}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }} sx={{ textAlign: { xs: "left", md: "right" } }}>
              <Typography variant="body2" sx={{ color: palette.textMuted, mb: 2 }}>
                {t("landing.footerNote")}
              </Typography>
              <Button
                component="a"
                href="https://www.hungvietsmarthome.com/"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: palette.accent }}
              >
                hungvietsmarthome.com →
              </Button>
              <Box sx={{ mt: 2 }}>
                <Button
                  size="small"
                  onClick={() => i18n.changeLanguage("vi")}
                  sx={{ color: i18n.language.startsWith("vi") ? palette.accent : palette.textMuted }}
                >
                  VI
                </Button>
                <Typography component="span" sx={{ color: palette.textMuted, mx: 1 }}>
                  |
                </Typography>
                <Button
                  size="small"
                  onClick={() => i18n.changeLanguage("en")}
                  sx={{ color: i18n.language.startsWith("en") ? palette.accent : palette.textMuted }}
                >
                  EN
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

const CompanyLandingPage = memo(CompanyLandingPageComponent);
export default CompanyLandingPage;
