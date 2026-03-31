import { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useImportSalePeriods } from "../hooks/productHooks";
import {
  toSalePeriodImportApiRow,
  type SalePeriodImportParseResult,
  type SalePeriodImportRow,
} from "../utils/salePeriodImportFormat";
import { parseSalePeriodImportXlsx } from "../utils/salePeriodImportXlsx";
import type { SalePeriodImportResponse } from "../types";

const wrapperSx: SxProps<Theme> = { width: "100%", maxWidth: 720 };

const SalePeriodImportPageComponent = () => {
  const { t } = useTranslation();
  const { canEditProducts } = useAuth();
  const importMutation = useImportSalePeriods();
  const [lastResult, setLastResult] = useState<SalePeriodImportResponse | null>(null);
  const [fileLabel, setFileLabel] = useState<string>("");
  const [sheetErrors, setSheetErrors] = useState<string[]>([]);
  const [parseResults, setParseResults] = useState<SalePeriodImportParseResult[]>([]);
  const [validRows, setValidRows] = useState<SalePeriodImportRow[]>([]);

  const exampleUrl = `${import.meta.env.BASE_URL}sale-period-import-example.xlsx`;

  const resetParse = useCallback(() => {
    setSheetErrors([]);
    setParseResults([]);
    setValidRows([]);
    setLastResult(null);
  }, []);

  const onFile = useCallback(
    async (file: File | null) => {
      resetParse();
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
      onSuccess: (res) => setLastResult(res),
    });
  }, [canImport, importMutation, validRows]);

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
          <Typography variant="body2" color="text.secondary">
            {t("products.salePeriodImport.templateDesc")}
          </Typography>
          <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1}>
            <Button
              variant="outlined"
              component="a"
              href={exampleUrl}
              download="sale-period-import-example.xlsx"
            >
              {t("products.salePeriodImport.downloadStaticExample")}
            </Button>
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
          </Stack>
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

        {importMutation.isError && (
          <Alert severity="error">
            {t("products.salePeriodImport.importFailed")}
            {importMutation.error instanceof Error ? ` ${importMutation.error.message}` : ""}
          </Alert>
        )}

        {lastResult && (
          <Alert severity={lastResult.row_errors.length ? "warning" : "success"}>
            <Typography variant="body2">
              {t("products.salePeriodImport.resultSummary", {
                periods: lastResult.created_periods,
                entries: lastResult.created_cost_entries,
              })}
            </Typography>
            {lastResult.row_errors.length > 0 && (
              <Box component="ul" sx={{ m: 0, pl: 2, mt: 1 }}>
                {lastResult.row_errors.map((e) => (
                  <li key={e.row}>
                    <Typography variant="body2">
                      {t("products.salePeriodImport.rowPrefix", { row: e.row })}: {e.messages.join("; ")}
                    </Typography>
                  </li>
                ))}
              </Box>
            )}
          </Alert>
        )}
      </Stack>
    </Box>
  );
};

export const SalePeriodImportPage = memo(SalePeriodImportPageComponent);
export default SalePeriodImportPage;
