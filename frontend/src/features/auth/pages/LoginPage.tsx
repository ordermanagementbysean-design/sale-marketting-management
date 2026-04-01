import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import type { SxProps, Theme } from "@mui/material/styles";
import { panelPath } from "@/constants/routes";
import { useAuth } from "../context/AuthContext";

const wrapperSx: SxProps<Theme> = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  bgcolor: "grey.100",
  p: 2,
};

const cardSx: SxProps<Theme> = {
  width: "100%",
  maxWidth: 400,
  p: 3,
  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: 2,
};

const loadingSx: SxProps<Theme> = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  bgcolor: "grey.100",
};

const LoginPageComponent = () => {
  const { t } = useTranslation();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={panelPath("/profile")} replace />;
  }
  if (isLoading) {
    return (
      <Box sx={loadingSx}>
        <CircularProgress />
      </Box>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email, password });
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })
              .response?.data?.message ??
            (Array.isArray(
              (err as { response?: { data?: { errors?: Record<string, string[]> } } }).response
                ?.data?.errors?.email
            )
              ? (err as { response: { data: { errors: { email: string[] } } } }).response.data
                  .errors.email[0]
              : null) ??
            t("auth.loginError")
          : t("auth.loginError");
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={wrapperSx}>
      <Box component="form" sx={cardSx} onSubmit={handleSubmit}>
        <Typography variant="h5" component="h1" gutterBottom textAlign="center">
          {t("auth.title")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }} textAlign="center">
          {t("auth.subtitle")}
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          fullWidth
          label={t("auth.email")}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          margin="normal"
        />
        <TextField
          fullWidth
          label={t("auth.password")}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          margin="normal"
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={submitting}
          sx={{ mt: 3 }}
        >
          {submitting ? t("auth.signingIn") : t("auth.signIn")}
        </Button>
      </Box>
    </Box>
  );
};

const LoginPage = memo(LoginPageComponent);
export default LoginPage;
