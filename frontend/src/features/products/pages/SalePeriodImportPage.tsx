import { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import { useAuth } from "@/features/auth/context/AuthContext";
import type { SalePeriodImportRowError } from "../types";
import { useImportSalePeriods } from "../hooks/productHooks";
import {
  toSalePeriodImportApiRow,
  type SalePeriodImportParseResult,
  type SalePeriodImportRow,
} from "../utils/salePeriodImportFormat";
import { parseSalePeriodImportXlsx } from "../utils/salePeriodImportXlsx";

const wrapperSx: SxProps<Theme> = { width: "100%", maxWidth: 720 };

function importErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const data = (err as { response?: { data?: { message?: string } } }).response?.data;
    if (data?.message && typeof data.message === "string" && data.message.trim()) {
      return data.message;
    }
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}

const SalePeriodImportPageComponent = () => {
  const { t } = useTranslation();
  const { canEditProducts } = useAuth();
  const importMutation = useImportSalePeriods();
  const [fileLabel, setFileLabel] = useState<string>("");
  const [sheetErrors, setSheetErrors] = useState<string[]>([]);
  const [parseResults, setParseResults] = useState<SalePeriodImportParseResult[]>([]);
  const [validRows, setValidRows] = useState<SalePeriodImportRow[]>([]);
  const [postImportRowErrors, setPostImportRowErrors] = useState<SalePeriodImportRowError[] | null>(
    null
  );
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning" | "info";
  }>({ open: false, message: "", severity: "info" });

  const exampleUrl = `${import.meta.env.BASE_URL}sale-period-import-example.xlsx`;

  const resetParse = useCallback(() => {
    setSheetErrors([]);
    setParseResults([]);
    setValidRows([]);
  }, []);

  const onFile = useCallback(
    async (file: File | null) => {
      resetParse();
      setPostImportRowErrors(null);
      if (!file) {
        setFileLabel("");
        return;
      }
      setFileLabel(file.name);
      const buf = await file.arrayBuffer();
      const parsed = parseSalePeriodImportXlsx(buf);
      setSheetErrors(parsed.sheetErrors);
      setParseResults(parsed.parseResults);
      setValidRows(parsed.validRows);
    },
    [resetParse]
  );

  const clientFailures = parseResults.filter((r): r is Extract<SalePeriodImportParseResult, { ok: false }> => !r.ok);
  const canImport =
    canEditProducts &&
    sheetErrors.length === 0 &&
    clientFailures.length === 0 &&
    validRows.length > 0 &&
    !importMutation.isPending;

  const handleImport = useCallback(() => {
    if (!canImport) return;
    const rows = validRows.map(toSalePeriodImportApiRow);
    importMutation.mutate(rows, {
      onSuccess: (res) => {
        const rowErrors = res.row_errors ?? [];
        setSnackbar({
          open: true,
          message: t("products.salePeriodImport.resultSummary", {
            periods: res.created_periods,
            entries: res.created_cost_entries,
          }),
          severity: rowErrors.length ? "warning" : "success",
        });
        setPostImportRowErrors(rowErrors.length ? rowErrors : null);
        resetParse();
        setFileLabel("");
        importMutation.reset();
      },
      onError: (err: unknown) => {
        const msg = importErrorMessage(err, t("products.salePeriodImport.importFailed"));
        setSnackbar({ open: true, message: msg, severity: "error" });
        resetParse();
        setFileLabel("");
        setPostImportRowErrors(null);
        importMutation.reset();
      },
    });
  }, [canImport, importMutation, resetParse, t, validRows]);

  return (
    <Box sx={wrapperSx}>
      <Typography variant="h5" component="h1" sx={{ mb: 1 }}>
        {t("products.salePeriodImport.title")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t("products.salePeriodImport.subtitle")}
      </Typography>

      {!canEditProducts && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t("products.salePeriodImport.noPermission")}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {t("products.salePeriodImport.templateTitle")}
        </Typography>
        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary" component="div">
            {t("products.salePeriodImport.templateDesc")}{" "}
            <Link href={exampleUrl} download="sale-period-import-example.xlsx" underline="hover">
              {t("products.salePeriodImport.downloadStaticExample")}
            </Link>
          </Typography>
          <Box>
            <Button variant="outlined" component="label" disabled={!canEditProducts}>
              {t("products.salePeriodImport.chooseFile")}
              <input
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  void onFile(f);
                  e.target.value = "";
                }}
              />
            </Button>
          </Box>
        </Stack>
      </Paper>

      <Stack spacing={2} sx={{ mt: 2 }}>
        {fileLabel ? (
          <Typography variant="body2" color="text.secondary">
            {t("products.salePeriodImport.selectedFile", { name: fileLabel })}
          </Typography>
        ) : null}

        {sheetErrors.map((msg) => (
          <Alert key={msg} severity="error">
            {msg}
          </Alert>
        ))}

        {clientFailures.length > 0 && (
          <Alert severity="error">
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t("products.salePeriodImport.clientErrorsTitle", { count: clientFailures.length })}
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              {clientFailures.map((r) => (
                <li key={r.rowIndex}>
                  <Typography variant="body2" component="span">
                    {t("products.salePeriodImport.rowPrefix", { row: r.rowIndex })}:{" "}
                    {r.errors.join("; ")}
                  </Typography>
                </li>
              ))}
            </Box>
          </Alert>
        )}

        {sheetErrors.length === 0 && parseResults.length > 0 && clientFailures.length === 0 && (
          <Alert severity="success">
            {t("products.salePeriodImport.readyToImport", { count: validRows.length })}
          </Alert>
        )}

        <Button variant="contained" onClick={handleImport} disabled={!canImport}>
          {importMutation.isPending ? t("products.salePeriodImport.importing") : t("products.salePeriodImport.import")}
        </Button>

        {postImportRowErrors != null && postImportRowErrors.length > 0 && (
          <Alert severity="warning">
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t("products.salePeriodImport.serverRowErrorsTitle")}
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              {postImportRowErrors.map((e) => (
                <li key={e.row}>
                  <Typography variant="body2">
                    {t("products.salePeriodImport.rowPrefix", { row: e.row })}: {e.messages.join("; ")}
                  </Typography>
                </li>
              ))}
            </Box>
          </Alert>
        )}
      </Stack>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === "error" ? 8000 : 6000}
        onClose={(_e, reason) => {
          if (reason === "clickaway") {
            return;
          }
          setSnackbar((s) => ({ ...s, open: false }));
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export const SalePeriodImportPage = memo(SalePeriodImportPageComponent);
export default SalePeriodImportPage;
