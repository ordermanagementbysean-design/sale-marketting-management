import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import { TEMPLATES, TEMPLATE_LIST } from "../templates";
import type { TemplateConfig, TemplateId, FormValues } from "../types";
import { getDefaultFormValues, getEffectiveValuesForPreview, normalizeDateForCountdown, normalizeTimeForCountdown } from "../utils";
import { buildHtml } from "../buildHtml";
import { fetchDataFromUrl, mapFetchedDataToFormValues } from "../services/fetchFromUrl";
import { editWithAi } from "../services/editWithAi";

const TEMPLATE_LABELS: Record<TemplateId, string> = {
  long_form_product: "1️⃣ Shopify long-form product page",
  product_showcase: "2️⃣ Product showcase landing",
  problem_solution: "3️⃣ Problem → solution landing",
  bundle_offer: "4️⃣ Bundle offer page",
  viral_tiktok_product: "5️⃣ Viral TikTok product page",
  flash_sale: "6️⃣ Flash sale landing",
};

const AIPageBuilderPageComponent = () => {
  const [selectedId, setSelectedId] = useState<TemplateId | null>(null);
  const [inputMode, setInputMode] = useState<"manual" | "auto">("manual");
  const [formValues, setFormValues] = useState<FormValues>({});
  const [urlInput, setUrlInput] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [instructionInput, setInstructionInput] = useState("");
  /** "reorder_only" = chỉ đổi thứ tự section (không gửi data → ít token); "reorder_and_content" = đổi thứ tự + chỉnh nội dung */
  const [aiEditMode, setAiEditMode] = useState<"reorder_only" | "reorder_and_content">("reorder_only");
  const [aiEditing, setAiEditing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  /** Kết quả lần chạy prompt gần nhất: thời điểm, thành công/thất bại, message lỗi (nếu có) */
  const [lastAiResult, setLastAiResult] = useState<{
    executedAt: Date;
    success: boolean;
    errorMessage: string | null;
  } | null>(null);
  /** Template từ AI (sau khi chỉnh cấu trúc theo instruction); dùng để render preview cùng data form hiện tại */
  const [previewTemplate, setPreviewTemplate] = useState<TemplateConfig | null>(null);

  const template = selectedId ? TEMPLATES[selectedId] : null;
  /** Template dùng cho preview: ưu tiên template từ AI nếu có, không thì template đang chọn */
  const templateForPreview = previewTemplate ?? template;
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const defaultValues = useMemo(() => (template ? getDefaultFormValues(template) : {}), [template]);

  const values = useMemo(() => ({ ...defaultValues, ...formValues }), [defaultValues, formValues]);

  const updateField = useCallback((key: string, value: string | number) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSelectTemplate = useCallback(
    (id: TemplateId) => {
      setSelectedId(id);
      setFormValues({});
      setFetchError(null);
      setPreviewTemplate(null);
    },
    []
  );

  const handleFetchUrl = useCallback(async () => {
    if (!urlInput.trim() || !template) return;
    setFetching(true);
    setFetchError(null);
    try {
      const data = await fetchDataFromUrl(urlInput.trim());
      const mapped = mapFetchedDataToFormValues(data, template.id);
      setFormValues((prev) => ({ ...prev, ...mapped }));
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Failed to fetch URL");
    } finally {
      setFetching(false);
    }
  }, [urlInput, template]);

  const handleEditWithAi = useCallback(async () => {
    if (!template || !instructionInput.trim()) return;
    setAiError(null);
    setAiEditing(true);
    const executedAt = new Date();
    try {
      const newTemplate = await editWithAi({
        instruction: instructionInput.trim(),
        template,
        ...(aiEditMode === "reorder_and_content" ? { data: values } : {}),
      });
      setPreviewTemplate(newTemplate);
      setLastAiResult({ executedAt, success: true, errorMessage: null });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Chỉnh sửa bằng AI thất bại";
      setAiError(errorMessage);
      setLastAiResult({ executedAt, success: false, errorMessage });
    } finally {
      setAiEditing(false);
    }
  }, [template, instructionInput, values, aiEditMode]);

  const valuesForPreview = useMemo(() => {
    if (!templateForPreview) return values;
    // Chỉ ưu tiên defaultValue từ template khi đó là template AI trả về; template gốc thì dùng form values để preview cập nhật khi user sửa.
    if (previewTemplate == null) return values;
    return getEffectiveValuesForPreview(templateForPreview, formValues, defaultValues);
  }, [templateForPreview, previewTemplate, formValues, defaultValues, values]);

  const previewHtml = useMemo(() => {
    if (!templateForPreview) return "";
    return buildHtml(templateForPreview, valuesForPreview);
  }, [templateForPreview, valuesForPreview]);

  const handleCopyHtml = useCallback(() => {
    if (!previewHtml) return;
    navigator.clipboard.writeText(previewHtml);
  }, [previewHtml]);

  const handleDownloadHtml = useCallback(() => {
    if (!previewHtml || !templateForPreview) return;
    const blob = new Blob([previewHtml], { type: "text/html;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `landing-${templateForPreview.id}-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [previewHtml, templateForPreview]);

  // Countdown: parent drives the 4 boxes so it works inside sandboxed iframe preview
  const updatePreviewCountdown = useCallback(() => {
    const endDateRaw = String(valuesForPreview.countdown_end_date ?? "").trim();
    const endTimeRaw = String(valuesForPreview.countdown_end_time ?? "").trim();
    if (!endDateRaw || !endTimeRaw || !templateForPreview?.structure.includes("countdown")) return;
    const doc = previewIframeRef.current?.contentDocument;
    if (!doc) return;
    const endDate = normalizeDateForCountdown(endDateRaw);
    const endTime = normalizeTimeForCountdown(endTimeRaw);
    const deadline = new Date(`${endDate}T${endTime}:00`).getTime();
    if (Number.isNaN(deadline)) return;
    const d = Math.max(0, deadline - Date.now());
    const days = Math.floor(d / 86400000);
    const hours = Math.floor((d % 86400000) / 3600000);
    const mins = Math.floor((d % 3600000) / 60000);
    const secs = Math.floor((d % 60000) / 1000);
    const set = (sel: string, val: number) => {
      const el = doc.querySelector(sel);
      if (el) el.textContent = String(val);
    };
    set(".countdown-days", days);
    set(".countdown-hours", hours);
    set(".countdown-mins", mins);
    set(".countdown-secs", secs);
  }, [templateForPreview?.structure, valuesForPreview.countdown_end_date, valuesForPreview.countdown_end_time]);

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    };
  }, []);

  const handlePreviewLoad = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (!templateForPreview?.structure.includes("countdown")) return;
    const endDate = String(valuesForPreview.countdown_end_date ?? "").trim();
    const endTime = String(valuesForPreview.countdown_end_time ?? "").trim();
    if (!endDate || !endTime) return;
    updatePreviewCountdown();
    countdownIntervalRef.current = setInterval(updatePreviewCountdown, 1000);
  }, [templateForPreview?.structure, valuesForPreview.countdown_end_date, valuesForPreview.countdown_end_time, updatePreviewCountdown]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="h5" fontWeight={600}>
        AI Page Builder
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Chọn 1 template, nhập thông tin (Manual hoặc Auto từ URL), xem preview và xuất HTML/Tailwind.
      </Typography>

      {/* Step 1: Choose template */}
      <Typography variant="subtitle1" fontWeight={600}>
        Bước 1: Chọn template
      </Typography>
      <Autocomplete
        size="small"
        sx={{ minWidth: 320 }}
        options={TEMPLATE_LIST}
        value={template}
        onChange={(_, newValue: TemplateConfig | null) => {
          if (newValue) handleSelectTemplate(newValue.id);
          else setSelectedId(null);
        }}
        getOptionLabel={(option) => TEMPLATE_LABELS[option.id] ?? option.name}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        renderInput={(params) => (
          <TextField {...params} label="Template" placeholder="Chọn hoặc gõ tìm template..." />
        )}
      />

      {!template && (
        <Alert severity="info">Chọn một template ở trên để tiếp tục.</Alert>
      )}

      {template && (
        <>
          {/* Step 2: Input mode */}
          <Typography variant="subtitle1" fontWeight={600}>
            Bước 2: Nhập thông tin
          </Typography>
          <Tabs value={inputMode} onChange={(_, v) => setInputMode(v)}>
            <Tab label="Manual" value="manual" />
            <Tab label="Auto (từ URL)" value="auto" />
          </Tabs>

          {inputMode === "manual" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {template.sections.map((section) => (
                <Card key={section.id} variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      {section.label}
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 1 }}>
                      {section.fields.map((field) => (
                        <TextField
                          key={field.key}
                          label={field.label}
                          type={field.type === "number" ? "number" : "text"}
                          multiline={field.type === "textarea"}
                          minRows={field.type === "textarea" ? 2 : undefined}
                          value={values[field.key] ?? ""}
                          onChange={(e) =>
                            updateField(
                              field.key,
                              field.type === "number" ? Number(e.target.value) : e.target.value
                            )
                          }
                          placeholder={field.placeholder}
                          required={field.required}
                          sx={{ minWidth: 220 }}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          {inputMode === "auto" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Nhập URL trang sản phẩm hoặc landing. Hệ thống sẽ cố lấy title, description, image (nếu truy cập được). Nếu bị chặn CORS, cần backend API fetch URL phía server.
              </Typography>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
                <TextField
                  label="URL"
                  placeholder="https://example.com/product"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  sx={{ flex: 1, minWidth: 280 }}
                  size="small"
                />
                <Button
                  variant="contained"
                  onClick={handleFetchUrl}
                  disabled={fetching || !urlInput.trim()}
                  startIcon={fetching ? <CircularProgress size={16} color="inherit" /> : null}
                >
                  {fetching ? "Đang lấy..." : "Lấy thông tin"}
                </Button>
              </Box>
              {fetchError && <Alert severity="error">{fetchError}</Alert>}
              <Alert severity="info">
                Sau khi lấy xong, bạn có thể chuyển sang Manual để chỉnh từng ô, hoặc xem Preview ngay.
              </Alert>
            </Box>
          )}

          {/* Chỉnh sửa bằng AI */}
          <Typography variant="subtitle1" fontWeight={600}>
            Chỉnh sửa bằng AI (Gemini)
          </Typography>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Nhập hướng dẫn để chỉnh cấu trúc template (vd: &quot;Đưa Customer Reviews lên trước Bundle&quot;). Backend trả về template JSON mới; preview dùng template mới + data form hiện tại, form không bị ghi đè.
              </Typography>
              <FormControl component="fieldset" sx={{ mt: 1 }} disabled={aiEditing}>
                <RadioGroup
                  row
                  value={aiEditMode}
                  onChange={(_, v) => setAiEditMode(v as "reorder_only" | "reorder_and_content")}
                >
                  <FormControlLabel
                    value="reorder_only"
                    control={<Radio size="small" />}
                    label="Chỉ chỉnh vị trí sections (ít token)"
                  />
                  <FormControlLabel
                    value="reorder_and_content"
                    control={<Radio size="small" />}
                    label="Chỉnh cả vị trí & nội dung"
                  />
                </RadioGroup>
              </FormControl>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                <TextField
                  label="Instruction"
                  placeholder="Ví dụ: Làm headline ngắn gọn hơn, thêm cảm giác khẩn cấp"
                  value={instructionInput}
                  onChange={(e) => setInstructionInput(e.target.value)}
                  multiline
                  minRows={2}
                  size="small"
                  variant="outlined"
                  fullWidth
                  disabled={aiEditing}
                />
                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleEditWithAi}
                    disabled={aiEditing || !instructionInput.trim()}
                    startIcon={aiEditing ? <CircularProgress size={16} color="inherit" /> : null}
                  >
                    {aiEditing ? "Đang xử lý..." : "Áp dụng chỉnh sửa AI"}
                  </Button>
                </Box>
                {aiError && <Alert severity="error">{aiError}</Alert>}
                {lastAiResult && (
                  <Alert
                    severity={lastAiResult.success ? "success" : "error"}
                    sx={{ alignItems: "center" }}
                  >
                    <Typography variant="body2" component="span">
                      Prompt đã thực thi lúc{" "}
                      {lastAiResult.executedAt.toLocaleString("vi-VN", {
                        dateStyle: "short",
                        timeStyle: "medium",
                      })}
                      — {lastAiResult.success ? "Thành công." : "Thất bại."}
                      {!lastAiResult.success && lastAiResult.errorMessage && (
                        <> Lỗi: {lastAiResult.errorMessage}</>
                      )}
                    </Typography>
                  </Alert>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Preview & Export */}
          <Typography variant="subtitle1" fontWeight={600}>
            Preview & Export
          </Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Button variant="outlined" onClick={handleCopyHtml}>
              Copy HTML
            </Button>
            <Button variant="outlined" onClick={handleDownloadHtml}>
              Tải file HTML
            </Button>
          </Box>
          <Box
            sx={{
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              overflow: "hidden",
              height: 560,
              bgcolor: "grey.100",
            }}
          >
            <iframe
              ref={previewIframeRef}
              title="Preview"
              srcDoc={previewHtml}
              onLoad={handlePreviewLoad}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
              }}
              sandbox="allow-same-origin allow-scripts"
            />
          </Box>
        </>
      )}
    </Box>
  );
};

export const AIPageBuilderPage = memo(AIPageBuilderPageComponent);
