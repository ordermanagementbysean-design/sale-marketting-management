import { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { changePassword } from "@/features/auth/services/authApi";
import type { ChangePasswordPayload } from "@/features/auth/services/authApi";

const wrapperSx: SxProps<Theme> = { width: "100%", maxWidth: 480 };
const alertSx: SxProps<Theme> = { mb: 2 };
const fieldSx: SxProps<Theme> = { mb: 2 };
const titleSx: SxProps<Theme> = { mb: 2 };
const buttonGroupSx: SxProps<Theme> = { display: "flex", gap: 2, mt: 2 };

const ChangePasswordPageComponent = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSuccess(false);
      if (newPassword !== confirmPassword) {
        setError(t("users.passwordMismatch"));
        return;
      }
      setLoading(true);
      const payload: ChangePasswordPayload = {
        old_password: oldPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      };
      changePassword(payload)
        .then(() => {
          setSuccess(true);
          setOldPassword("");
          setNewPassword("");
          setConfirmPassword("");
          setTimeout(() => navigate("/profile"), 1500);
        })
        .catch((err: unknown) => {
          let msg = t("users.changePasswordError");
          if (
            err &&
            typeof err === "object" &&
            "response" in err &&
            err.response &&
            typeof err.response === "object" &&
            "data" in err.response
          ) {
            const data = (err.response as { data: unknown }).data;
            if (data && typeof data === "object" && "message" in data && typeof (data as { message: unknown }).message === "string") {
              msg = (data as { message: string }).message;
            } else if (data && typeof data === "object" && "errors" in data) {
              const errors = (data as { errors: Record<string, string[]> }).errors;
              const oldErr = errors?.old_password?.[0];
              if (oldErr) msg = oldErr;
            }
          } else if (err instanceof Error) {
            msg = err.message;
          }
          setError(msg);
        })
        .finally(() => setLoading(false));
    },
    [oldPassword, newPassword, confirmPassword, navigate, t]
  );

  const goBack = useCallback(() => {
    navigate("/profile");
  }, [navigate]);

  const isFormValid =
    oldPassword.trim() !== "" &&
    newPassword.trim() !== "" &&
    confirmPassword.trim() !== "" &&
    newPassword === confirmPassword;

  return (
    <Box sx={wrapperSx}>
      <Typography variant="h5" component="h1" sx={titleSx}>
        {t("users.changePasswordTitle")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t("users.changePasswordSubtitle")}
      </Typography>
      {success && (
        <Alert severity="success" sx={alertSx}>
          {t("users.passwordUpdated")}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={alertSx} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label={t("users.oldPassword")}
          type="password"
          autoComplete="current-password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          required
          sx={fieldSx}
        />
        <TextField
          fullWidth
          label={t("users.newPassword")}
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          sx={fieldSx}
        />
        <TextField
          fullWidth
          label={t("users.passwordConfirm")}
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          error={confirmPassword !== "" && newPassword !== confirmPassword}
          helperText={
            confirmPassword !== "" && newPassword !== confirmPassword
              ? t("users.passwordMismatch")
              : undefined
          }
          sx={fieldSx}
        />
        <Box sx={buttonGroupSx}>
          <Button
            type="submit"
            variant="contained"
            disabled={!isFormValid || loading}
          >
            {loading ? t("users.saving") : t("users.changePasswordSubmit")}
          </Button>
          <Button type="button" variant="outlined" onClick={goBack}>
            {t("users.cancel")}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

const ChangePasswordPage = memo(ChangePasswordPageComponent);
export default ChangePasswordPage;
