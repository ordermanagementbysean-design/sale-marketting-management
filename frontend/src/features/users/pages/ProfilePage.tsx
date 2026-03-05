import { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useRoles, useUpdateUser } from "../hooks/userHooks";

const wrapperSx: SxProps<Theme> = { width: "100%", maxWidth: 480 };
const alertSx: SxProps<Theme> = { mb: 2 };
const fieldSx: SxProps<Theme> = { mb: 2 };
const titleSx: SxProps<Theme> = { mb: 2 };
const buttonGroupSx: SxProps<Theme> = { display: "flex", gap: 2, mt: 2 };

const ProfilePageComponent = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { data: roles = [] } = useRoles();
  const updateUserMutation = useUpdateUser();
  const roleLabel = user?.role
    ? roles.find((r) => r.value === user.role)?.label ?? user.role
    : "";
  const [name, setName] = useState(user?.name ?? "");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      setError(null);
      setSuccess(false);
      updateUserMutation.mutate(
        { id: user.id, payload: { name } },
        {
          onSuccess: () => {
            setSuccess(true);
            refreshUser();
          },
          onError: (err: unknown) => {
            const msg =
              err &&
              typeof err === "object" &&
              "response" in err &&
              err.response &&
              typeof err.response === "object" &&
              "data" in err.response &&
              err.response.data &&
              typeof err.response.data === "object" &&
              "message" in err.response.data &&
              typeof (err.response.data as { message: unknown }).message === "string"
                ? (err.response.data as { message: string }).message
                : err instanceof Error
                  ? err.message
                  : t("users.profileUpdateError");
            setError(msg);
          },
        }
      );
    },
    [user, name, updateUserMutation, refreshUser, t]
  );

  const goToChangePassword = useCallback(() => {
    navigate("/profile/change-password");
  }, [navigate]);

  if (!user) return null;

  return (
    <Box sx={wrapperSx}>
      <Typography variant="h5" component="h1" sx={titleSx}>
        {t("users.profileTitle")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t("users.profileSubtitle")}
      </Typography>
      {success && (
        <Alert severity="success" sx={alertSx} onClose={() => setSuccess(false)}>
          {t("users.profileUpdated")}
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
          label={t("users.columns.name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          sx={fieldSx}
        />
        <TextField
          fullWidth
          label={t("users.columns.email")}
          value={user.email}
          disabled
          sx={fieldSx}
        />
        <TextField
          fullWidth
          label={t("users.roles")}
          value={roleLabel}
          disabled
          sx={fieldSx}
        />
        <Box sx={buttonGroupSx}>
          <Button
            type="submit"
            variant="contained"
            disabled={!name.trim() || updateUserMutation.isPending}
          >
            {updateUserMutation.isPending ? t("users.saving") : t("users.save")}
          </Button>
          <Button
            type="button"
            variant="outlined"
            onClick={goToChangePassword}
          >
            {t("users.changePassword")}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

const ProfilePage = memo(ProfilePageComponent);
export default ProfilePage;
