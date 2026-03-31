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
import { useProductImportStatus, useQueueProductImport } from "../hooks/productHooks";
import {
  toProductImportApiRow,
  type ProductImportParseResult,
  type ProductImportRow,
} from "../utils/productImportFormat";
import { parseProductImportXlsx } from "../utils/productImportXlsx";

const wrapperSx: SxProps<Theme> = { width: "100%", maxWidth: 720 };

const ProductImportPageComponent = () => {
  const { t } = useTranslation();
  const { canEditProducts } = useAuth();
  const queueMutation = useQueueProductImport();
  const [activeImportId, setActiveImportId] = useState<string | null>(null);
  const importStatus = useProductImportStatus(activeImportId);

  const [fileLabel, setFileLabel] = useState<string>("");
  const [sheetErrors, setSheetErrors] = useState<string[]>([]);
  const [parseResults, setParseResults] = useState<ProductImportParseResult[]>([]);
  const [validRows, setValidRows] = useState<ProductImportRow[]>([]);

  const exampleUrl = `${import.meta.env.BASE_URL}product-import-example.xlsx`;

  const resetParse = useCallback(() => {
    setSheetErrors([]);
    setParseResults([]);
    setValidRows([]);
    setActiveImportId(null);
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
      const parsed = parseProductImportXlsx(buf);
      setSheetErrors(parsed.sheetErrors);
      setParseResults(parsed.parseResults);
      setValidRows(parsed.validRows);
    },
    [resetParse]
  );

  const clientFailures = parseResults.filter(
    (r): r is Extract<ProductImportParseResult, { ok: false }> => !r.ok
  );
  const polling =
    activeImportId != null &&
    (importStatus.data?.status === "queued" || importStatus.data?.status === "processing");
  const doneStatus = activeImportId != null ? importStatus.data?.status : undefined;
  const terminalImport =
    activeImportId != null &&
    (importStatus.data?.status === "completed" || importStatus.data?.status === "failed");
  const canQueue =
    canEditProducts &&
    sheetErrors.length === 0 &&
    clientFailures.length === 0 &&
    validRows.length > 0 &&
    !queueMutation.isPending &&
    !polling &&
    activeImportId === null;

  const handleQueue = useCallback(() => {
    if (!canQueue) return;
    const rows = validRows.map(toProductImportApiRow);
    queueMutation.mutate(rows, {
      onSuccess: (res) => {
        setActiveImportId(res.import_id);
      },
    });
  }, [canQueue, queueMutation, validRows]);

  const handleStartOver = useCallback(() => {
    resetParse();
    setFileLabel("");
    queueMutation.reset();
  }, [queueMutation, resetParse]);

  return (
    <Box sx={wrapperSx}>
      <Typography variant="h5" component="h1" sx={{ mb: 1 }}>
        {t("products.productImport.title")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t("products.productImport.subtitle")}
      </Typography>

      {!canEditProducts && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t("products.productImport.noPermission")}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {t("products.productImport.templateTitle")}
        </Typography>
        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            {t("products.productImport.templateDesc")}
          </Typography>
          <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1}>
            <Button
              variant="outlined"
              component="a"
              href={exampleUrl}
              download="product-import-example.xlsx"
            >
              {t("products.productImport.downloadStaticExample")}
            </Button>
            <Button variant="outlined" component="label" disabled={!canEditProducts}>
              {t("products.productImport.chooseFile")}
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
            {t("products.productImport.selectedFile", { name: fileLabel })}
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
              {t("products.productImport.clientErrorsTitle", { count: clientFailures.length })}
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              {clientFailures.map((r) => (
                <li key={r.rowIndex}>
                  <Typography variant="body2" component="span">
                    {t("products.productImport.rowPrefix", { row: r.rowIndex })}: {r.errors.join("; ")}
                  </Typography>
                </li>
              ))}
            </Box>
          </Alert>
        )}

        {sheetErrors.length === 0 && parseResults.length > 0 && clientFailures.length === 0 && (
          <Alert severity="success">
            {t("products.productImport.readyToQueue", { count: validRows.length })}
          </Alert>
        )}

        {polling && (
          <Alert severity="info">{t("products.productImport.processingHint")}</Alert>
        )}

        <Button
          variant="contained"
          onClick={handleQueue}
          disabled={!canQueue}
        >
          {queueMutation.isPending
            ? t("products.productImport.queueing")
            : t("products.productImport.queueImport")}
        </Button>

        {queueMutation.isError && (
          <Alert severity="error">
            {t("products.productImport.queueFailed")}
            {queueMutation.error instanceof Error ? ` ${queueMutation.error.message}` : ""}
          </Alert>
        )}

        {doneStatus === "completed" && importStatus.data && (
          <Alert severity={importStatus.data.row_errors?.length ? "warning" : "success"}>
            <Typography variant="body2">
              {t("products.productImport.resultSummary", {
                created: importStatus.data.created ?? 0,
              })}
            </Typography>
            {importStatus.data.row_errors && importStatus.data.row_errors.length > 0 && (
              <Box component="ul" sx={{ m: 0, pl: 2, mt: 1 }}>
                {importStatus.data.row_errors.map((e) => (
                  <li key={e.row}>
                    <Typography variant="body2">
                      {t("products.productImport.rowPrefix", { row: e.row })}: {e.messages.join("; ")}
                    </Typography>
                  </li>
                ))}
              </Box>
            )}
          </Alert>
        )}

        {doneStatus === "failed" && (
          <Alert severity="error">
            {importStatus.data?.message ?? t("products.productImport.jobFailed")}
          </Alert>
        )}

        {terminalImport && (
          <Button variant="outlined" onClick={handleStartOver}>
            {t("products.productImport.startOver")}
          </Button>
        )}
      </Stack>
    </Box>
  );
};

export const ProductImportPage = memo(ProductImportPageComponent);
export default ProductImportPage;
