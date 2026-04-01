import { type ChangeEvent, memo, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import { panelPath } from "@/constants/routes";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import { useAuth } from "@/features/auth/context/AuthContext";
import {
  useProfitRowColorSettings,
  useResetProfitRowColorSettings,
  useUpdateProfitRowColorSettings,
} from "../hooks/productHooks";
import type { ProfitRowColorSettings } from "../utils/profitPercentRowColors";
import { validateProfitRowColorSettings } from "../utils/profitPercentRowColors";

const wrapperSx: SxProps<Theme> = { width: "100%", maxWidth: 560 };
const colorRowSx: SxProps<Theme> = { display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" };

function ColorField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  disabled: boolean;
}) {
  return (
    <Box sx={colorRowSx}>
      <Typography component="label" variant="body2" sx={{ minWidth: 140 }}>
        {label}
      </Typography>
      <Box
        component="input"
        type="color"
        value={value}
        disabled={disabled}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        sx={{
          width: 56,
          height: 40,
          p: 0,
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          cursor: disabled ? "default" : "pointer",
          bgcolor: "background.paper",
        }}
      />
      <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "monospace" }}>
        {value}
      </Typography>
    </Box>
  );
}

const SalePeriodStatusReportProfitColorsPageComponent = () => {
  const { t } = useTranslation();
  const { canEditProducts } = useAuth();
  const { data, isLoading, isError, error } = useProfitRowColorSettings();
  const updateMutation = useUpdateProfitRowColorSettings();
  const resetMutation = useResetProfitRowColorSettings();

  const [lowMax, setLowMax] = useState("");
  const [reachMax, setReachMax] = useState("");
  const [colors, setColors] = useState<ProfitRowColorSettings["colors"] | null>(null);
  const [labels, setLabels] = useState<ProfitRowColorSettings["labels"] | null>(null);

  useEffect(() => {
    if (data) {
      setLowMax(String(data.lowMaxPercent));
      setReachMax(String(data.reachMaxPercent));
      setColors({ ...data.colors });
      setLabels({ ...data.labels });
    }
  }, [data]);

  const draftSettings: ProfitRowColorSettings | null = useMemo(() => {
    if (!colors || !labels) return null;
    return {
      lowMaxPercent: Number.parseFloat(lowMax.replace(",", ".")) || 0,
      reachMaxPercent: Number.parseFloat(reachMax.replace(",", ".")) || 0,
      colors: { ...colors },
      labels: { ...labels },
    };
  }, [lowMax, reachMax, colors, labels]);

  const validationKey = draftSettings ? validateProfitRowColorSettings(draftSettings) : null;

  const [savedFlash, setSavedFlash] = useState(false);

  const handleSave = useCallback(() => {
    if (!draftSettings || !canEditProducts) return;
    const trimmed: ProfitRowColorSettings = {
      ...draftSettings,
      labels: {
        negative: draftSettings.labels.negative.trim(),
        low: draftSettings.labels.low.trim(),
        reach: draftSettings.labels.reach.trim(),
        super: draftSettings.labels.super.trim(),
      },
    };
    const err = validateProfitRowColorSettings(trimmed);
    if (err) return;
    updateMutation.mutate(trimmed, {
      onSuccess: () => {
        setSavedFlash(true);
        window.setTimeout(() => setSavedFlash(false), 2500);
      },
    });
  }, [draftSettings, canEditProducts, updateMutation]);

  const handleReset = useCallback(() => {
    if (!canEditProducts) return;
    resetMutation.mutate(undefined, {
      onSuccess: () => {
        setSavedFlash(true);
        window.setTimeout(() => setSavedFlash(false), 2500);
      },
    });
  }, [canEditProducts, resetMutation]);

  const readOnly = !canEditProducts;
  const saving = updateMutation.isPending || resetMutation.isPending;

  return (
    <Box sx={wrapperSx}>
      <Typography variant="h5" component="h1" sx={{ mb: 1 }}>
        {t("products.salePeriodStatusReport.profitColors.title")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t("products.salePeriodStatusReport.profitColors.subtitle")}
      </Typography>

      {readOnly && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t("products.salePeriodStatusReport.profitColors.readOnlyHint")}
        </Alert>
      )}

      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={32} />
        </Box>
      )}

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t("products.salePeriodStatusReport.profitColors.loadError")}
          {error instanceof Error ? ` ${error.message}` : ""}
        </Alert>
      )}

      {updateMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t("products.salePeriodStatusReport.profitColors.saveError")}
        </Alert>
      )}

      {resetMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t("products.salePeriodStatusReport.profitColors.resetError")}
        </Alert>
      )}

      {savedFlash && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {t("products.salePeriodStatusReport.profitColors.saved")}
        </Alert>
      )}

      {!isLoading && data && colors && labels && (
        <>
          {validationKey && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {t(`products.salePeriodStatusReport.profitColors.errors.${validationKey}`)}
            </Alert>
          )}

          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Stack spacing={2}>
              <Typography variant="subtitle2">
                {t("products.salePeriodStatusReport.profitColors.thresholdsTitle")}
              </Typography>
              <TextField
                label={t("products.salePeriodStatusReport.profitColors.lowMaxLabel")}
                type="number"
                value={lowMax}
                onChange={(e) => setLowMax(e.target.value)}
                inputProps={{ step: 0.1 }}
                fullWidth
                size="small"
                disabled={readOnly || saving}
              />
              <TextField
                label={t("products.salePeriodStatusReport.profitColors.reachMaxLabel")}
                type="number"
                value={reachMax}
                onChange={(e) => setReachMax(e.target.value)}
                inputProps={{ step: 0.1 }}
                fullWidth
                size="small"
                disabled={readOnly || saving}
              />
              <Typography variant="caption" color="text.secondary">
                {t("products.salePeriodStatusReport.profitColors.bandsHint")}
              </Typography>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Stack spacing={2}>
              <Typography variant="subtitle2">
                {t("products.salePeriodStatusReport.profitColors.tooltipLabelsTitle")}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t("products.salePeriodStatusReport.profitColors.tooltipLabelsHint")}
              </Typography>
              <TextField
                label={t("products.salePeriodStatusReport.profitColors.tooltipLabelNegative")}
                value={labels.negative}
                onChange={(e) => setLabels((lb) => (lb ? { ...lb, negative: e.target.value } : lb))}
                fullWidth
                size="small"
                disabled={readOnly || saving}
              />
              <TextField
                label={t("products.salePeriodStatusReport.profitColors.tooltipLabelLow")}
                value={labels.low}
                onChange={(e) => setLabels((lb) => (lb ? { ...lb, low: e.target.value } : lb))}
                fullWidth
                size="small"
                disabled={readOnly || saving}
              />
              <TextField
                label={t("products.salePeriodStatusReport.profitColors.tooltipLabelReach")}
                value={labels.reach}
                onChange={(e) => setLabels((lb) => (lb ? { ...lb, reach: e.target.value } : lb))}
                fullWidth
                size="small"
                disabled={readOnly || saving}
              />
              <TextField
                label={t("products.salePeriodStatusReport.profitColors.tooltipLabelSuper")}
                value={labels.super}
                onChange={(e) => setLabels((lb) => (lb ? { ...lb, super: e.target.value } : lb))}
                fullWidth
                size="small"
                disabled={readOnly || saving}
              />
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Stack spacing={2}>
              <Typography variant="subtitle2">{t("products.salePeriodStatusReport.profitColors.colorsTitle")}</Typography>
              <ColorField
                label={t("products.salePeriodStatusReport.profitColors.colorNegative")}
                value={colors.negative}
                disabled={readOnly || saving}
                onChange={(hex) => setColors((c) => (c ? { ...c, negative: hex } : c))}
              />
              <ColorField
                label={t("products.salePeriodStatusReport.profitColors.colorLow")}
                value={colors.low}
                disabled={readOnly || saving}
                onChange={(hex) => setColors((c) => (c ? { ...c, low: hex } : c))}
              />
              <ColorField
                label={t("products.salePeriodStatusReport.profitColors.colorReach")}
                value={colors.reach}
                disabled={readOnly || saving}
                onChange={(hex) => setColors((c) => (c ? { ...c, reach: hex } : c))}
              />
              <ColorField
                label={t("products.salePeriodStatusReport.profitColors.colorSuper")}
                value={colors.super}
                disabled={readOnly || saving}
                onChange={(hex) => setColors((c) => (c ? { ...c, super: hex } : c))}
              />
            </Stack>
          </Paper>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={readOnly || saving || !!validationKey}
            >
              {updateMutation.isPending ? t("users.saving") : t("products.salePeriodStatusReport.profitColors.save")}
            </Button>
            <Button variant="outlined" onClick={handleReset} disabled={readOnly || saving}>
              {resetMutation.isPending ? t("users.saving") : t("products.salePeriodStatusReport.profitColors.resetDefaults")}
            </Button>
            <Button component={RouterLink} to={panelPath("/products/sale-periods/status-report")} variant="text">
              {t("products.salePeriodStatusReport.profitColors.backToReport")}
            </Button>
          </Stack>
        </>
      )}
    </Box>
  );
};

export const SalePeriodStatusReportProfitColorsPage = memo(SalePeriodStatusReportProfitColorsPageComponent);
export default SalePeriodStatusReportProfitColorsPage;
