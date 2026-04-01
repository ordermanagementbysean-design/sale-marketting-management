import { memo, useCallback, useEffect, useRef, useState } from "react";
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
import type { ProductImportRowError } from "../types";
import { useProductImportStatus, useQueueProductImport } from "../hooks/productHooks";
import {
  toProductImportApiRow,
  type ProductImportParseResult,
  type ProductImportRow,
} from "../utils/productImportFormat";
import { parseProductImportXlsx } from "../utils/productImportXlsx";

const wrapperSx: SxProps<Theme> = { width: "100%", maxWidth: 720 };

function queueErrorMessage(err: unknown, fallback: string): string {
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
  const [postImportRowErrors, setPostImportRowErrors] = useState<ProductImportRowError[] | null>(
    null
  );
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning" | "info";
  }>({ open: false, message: "", severity: "info" });

  const terminalNotifiedImportIdRef = useRef<string | null>(null);

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
      setPostImportRowErrors(null);
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
        terminalNotifiedImportIdRef.current = null;
        setActiveImportId(res.import_id);
      },
      onError: (err: unknown) => {
        const msg = queueErrorMessage(err, t("products.productImport.queueFailed"));
        setSnackbar({ open: true, message: msg, severity: "error" });
        resetParse();
        setFileLabel("");
        setPostImportRowErrors(null);
        queueMutation.reset();
      },
    });
  }, [canQueue, queueMutation, resetParse, t, validRows]);

  useEffect(() => {
    if (activeImportId == null || !importStatus.data) {
      return;
    }
    const { status } = importStatus.data;
    if (status !== "completed" && status !== "failed") {
      return;
    }
    if (terminalNotifiedImportIdRef.current === activeImportId) {
      return;
    }
    terminalNotifiedImportIdRef.current = activeImportId;

    const data = importStatus.data!;
    if (status === "failed") {
      setSnackbar({
        open: true,
        message: data.message ?? t("products.productImport.jobFailed"),
        severity: "error",
      });
      setPostImportRowErrors(null);
    } else {
      const rowErrors = data.row_errors ?? [];
      setSnackbar({
        open: true,
        message: t("products.productImport.resultSummary", { created: data.created ?? 0 }),
        severity: rowErrors.length ? "warning" : "success",
      });
      setPostImportRowErrors(rowErrors.length ? rowErrors : null);
    }

    setActiveImportId(null);
    queueMutation.reset();
    resetParse();
    setFileLabel("");
  }, [activeImportId, importStatus.data, queueMutation, resetParse, t]);

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
          <Typography variant="body2" color="text.secondary" component="div">
            {t("products.productImport.templateDesc")}{" "}
            <Link href={exampleUrl} download="product-import-example.xlsx" underline="hover">
              {t("products.productImport.downloadStaticExample")}
            </Link>
          </Typography>
          <Box>
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
          </Box>
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

        {postImportRowErrors != null && postImportRowErrors.length > 0 && (
          <Alert severity="warning">
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t("products.productImport.serverRowErrorsTitle")}
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              {postImportRowErrors.map((e) => (
                <li key={e.row}>
                  <Typography variant="body2">
                    {t("products.productImport.rowPrefix", { row: e.row })}: {e.messages.join("; ")}
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

export const ProductImportPage = memo(ProductImportPageComponent);
export default ProductImportPage;
