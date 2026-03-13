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
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Collapse from "@mui/material/Collapse";
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from "@mui/icons-material";
import { TEMPLATES, TEMPLATE_LIST } from "../templates";
import type { TemplateConfig, TemplateId, FormValues, FieldStyle } from "../types";
import { getDefaultFormValues, getEffectiveValuesForPreview, normalizeDateForCountdown, normalizeTimeForCountdown } from "../utils";
import { buildHtml } from "../buildHtml";
import { fetchDataFromUrl, mapFetchedDataToFormValues } from "../services/fetchFromUrl";
import { editWithAi } from "../services/editWithAi";

/** Label cho dropdown: dùng template.name từ config (tự có khi thêm template). */
const getTemplateOptionLabel = (option: TemplateConfig) => option.name;

function parseObjectList(value: string): Record<string, string>[] {
  if (!value || typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

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
  const [fullScreenPreviewOpen, setFullScreenPreviewOpen] = useState(false);
  /** section.id -> true = collapsed. Undefined/false = expanded. */
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

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

  /** Cập nhật một phần tử trong field kiểu image_list (value ở form là chuỗi nhiều dòng). */
  const updateImageListItem = useCallback((key: string, index: number, value: string, currentLength: number) => {
    setFormValues((prev) => {
      const current = String(prev[key] ?? "").split(/\n/);
      const next = current.length >= currentLength ? [...current] : [...Array.from({ length: currentLength }, (_, i) => current[i] ?? "")];
      next[index] = value;
      return { ...prev, [key]: next.join("\n") };
    });
  }, []);

  /** Thêm một ô ảnh trống vào cuối image_list. */
  const appendImageListItem = useCallback((key: string) => {
    setFormValues((prev) => {
      const current = String(prev[key] ?? "").split(/\n/).filter(Boolean);
      return { ...prev, [key]: [...current, ""].join("\n") };
    });
  }, []);

  /** Cập nhật một ô trong object_list (value = JSON array of objects). */
  const updateObjectListItem = useCallback((key: string, index: number, subKey: string, value: string) => {
    setFormValues((prev) => {
      const arr = parseObjectList(String(prev[key] ?? "[]"));
      const next = arr.length > index ? [...arr] : [...arr, ...Array.from({ length: index - arr.length + 1 }, () => ({} as Record<string, string>))];
      next[index] = { ...(next[index] || {}), [subKey]: value };
      return { ...prev, [key]: JSON.stringify(next) };
    });
  }, []);

  /** Thêm một dòng trống vào object_list. */
  const appendObjectListItem = useCallback((key: string, listItemKeys: string[]) => {
    setFormValues((prev) => {
      const arr = parseObjectList(String(prev[key] ?? "[]"));
      const empty: Record<string, string> = {};
      listItemKeys.forEach((k) => (empty[k] = ""));
      return { ...prev, [key]: JSON.stringify([...arr, empty]) };
    });
  }, []);

  const toggleSectionCollapsed = useCallback((sectionId: string) => {
    setCollapsedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  }, []);

  const toggleExpandCollapseAll = useCallback(() => {
    if (!template) return;
    const allCollapsed = template.sections.every((s) => collapsedSections[s.id] === true);
    const next = template.sections.reduce<Record<string, boolean>>((acc, s) => {
      acc[s.id] = !allCollapsed;
      return acc;
    }, {});
    setCollapsedSections(next);
  }, [template, collapsedSections]);

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
        getOptionLabel={getTemplateOptionLabel}
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
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={toggleExpandCollapseAll}
                  aria-label={template.sections.every((s) => collapsedSections[s.id]) ? "Mở rộng tất cả" : "Thu gọn tất cả"}
                >
                  {template.sections.every((s) => collapsedSections[s.id]) ? "Mở rộng tất cả" : "Thu gọn tất cả"}
                </Button>
              </Box>
              {template.sections.map((section) => {
                const isCollapsed = collapsedSections[section.id] === true;
                return (
                  <Card key={section.id} variant="outlined">
                    <Box
                      component="button"
                      type="button"
                      onClick={() => toggleSectionCollapsed(section.id)}
                      sx={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        p: 1.5,
                        pr: 0.5,
                        textAlign: "left",
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                      aria-expanded={!isCollapsed}
                    >
                      <Typography variant="subtitle2" color="primary" fontWeight={600}>
                        {section.label}
                      </Typography>
                      <IconButton size="small" aria-label={isCollapsed ? "Mở rộng" : "Thu gọn"}>
                        {isCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                      </IconButton>
                    </Box>
                    <Collapse in={!isCollapsed}>
                      <CardContent sx={{ pt: 0 }}>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 1 }}>
                      {section.fields.map((field) => {
                        const style = field.style as FieldStyle | undefined;
                        const sxFromStyle =
                          style && typeof style === "object"
                            ? {
                                ...(style.fontSize && { fontSize: style.fontSize }),
                                ...(style.fontWeight && { fontWeight: style.fontWeight }),
                                ...(style.color && { color: style.color }),
                                ...(style.textAlign && { textAlign: style.textAlign }),
                                ...(style.lineHeight && { lineHeight: style.lineHeight }),
                                ...(style.letterSpacing && { letterSpacing: style.letterSpacing }),
                              }
                            : {};
                        if (field.type === "image_list") {
                          const raw = String(values[field.key] ?? "").trim();
                          const lines = raw ? raw.split(/\n/).map((s) => s.trim()) : [];
                          const items = lines.length > 0 ? lines : (field.values ?? [""]);
                          return (
                            <Box key={field.key} sx={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 220, width: "100%" }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                {field.label}
                                {field.required ? " *" : ""}
                              </Typography>
                              {items.map((url, index) => (
                                <TextField
                                  key={`${field.key}-${index}`}
                                  size="small"
                                  variant="outlined"
                                  type="url"
                                  placeholder={field.placeholder ?? "https://..."}
                                  value={url}
                                  onChange={(e) => updateImageListItem(field.key, index, e.target.value, items.length)}
                                  sx={{ ...sxFromStyle }}
                                />
                              ))}
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => appendImageListItem(field.key)}
                                sx={{ alignSelf: "flex-start" }}
                              >
                                + Thêm ảnh
                              </Button>
                            </Box>
                          );
                        }
                        if (field.type === "string_list") {
                          const raw = String(values[field.key] ?? "").trim();
                          const lines = raw ? raw.split(/\n/).map((s) => s.trim()) : [];
                          const items = lines.length > 0 ? lines : (field.values as string[] | undefined) ?? [""];
                          return (
                            <Box key={field.key} sx={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 220, width: "100%" }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                {field.label}
                                {field.required ? " *" : ""}
                              </Typography>
                              {items.map((line, index) => (
                                <TextField
                                  key={`${field.key}-${index}`}
                                  size="small"
                                  variant="outlined"
                                  placeholder={field.placeholder}
                                  value={line}
                                  onChange={(e) => updateImageListItem(field.key, index, e.target.value, items.length)}
                                  sx={{ ...sxFromStyle }}
                                />
                              ))}
                              <Button size="small" variant="outlined" onClick={() => appendImageListItem(field.key)} sx={{ alignSelf: "flex-start" }}>
                                + Thêm dòng
                              </Button>
                            </Box>
                          );
                        }
                        if (field.type === "object_list" && field.listItemKeys && field.listItemKeys.length > 0) {
                          const arr = parseObjectList(String(values[field.key] ?? ""));
                          const defaultArr = Array.isArray(field.values) && field.values.length > 0 && typeof field.values[0] === "object" && field.values[0] !== null ? (field.values as Record<string, string>[]) : null;
                          const items = arr.length > 0 ? arr : defaultArr ?? [{} as Record<string, string>];
                          return (
                            <Box key={field.key} sx={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 280, width: "100%" }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                {field.label}
                                {field.required ? " *" : ""}
                              </Typography>
                              {items.map((row, index) => (
                                <Box key={`${field.key}-${index}`} sx={{ display: "flex", flexDirection: "column", gap: 1, p: 1, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                                  {field.listItemKeys!.map((subKey) => (
                                    <TextField
                                      key={subKey}
                                      size="small"
                                      variant="outlined"
                                      label={subKey}
                                      value={row[subKey] ?? ""}
                                      onChange={(e) => updateObjectListItem(field.key, index, subKey, e.target.value)}
                                      multiline={subKey === "desc" || subKey === "comment" || subKey === "text" || subKey === "answer" || subKey === "a"}
                                      minRows={subKey === "desc" || subKey === "comment" || subKey === "text" || subKey === "answer" || subKey === "a" ? 2 : undefined}
                                    />
                                  ))}
                                </Box>
                              ))}
                              <Button size="small" variant="outlined" onClick={() => appendObjectListItem(field.key, field.listItemKeys!)} sx={{ alignSelf: "flex-start" }}>
                                + Thêm
                              </Button>
                            </Box>
                          );
                        }
                        if (field.options && field.options.length > 0) {
                          const val = String(values[field.key] ?? field.defaultValue ?? "");
                          return (
                            <FormControl key={field.key} size="small" sx={{ minWidth: 220, ...sxFromStyle }}>
                              <InputLabel id={`${field.key}-label`}>{field.label}</InputLabel>
                              <Select
                                labelId={`${field.key}-label`}
                                value={val}
                                label={field.label}
                                onChange={(e) => updateField(field.key, e.target.value)}
                              >
                                {field.options.map((opt) => (
                                  <MenuItem key={opt} value={opt}>
                                    {opt}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          );
                        }
                        return (
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
                            sx={{ minWidth: 220, ...sxFromStyle }}
                            className={style?.className}
                            size="small"
                            variant="outlined"
                          />
                        );
                      })}
                    </Box>
                      </CardContent>
                    </Collapse>
                  </Card>
                );
              })}
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
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
            <Button variant="outlined" onClick={handleCopyHtml}>
              Copy HTML
            </Button>
            <Button variant="outlined" onClick={handleDownloadHtml}>
              Tải file HTML
            </Button>
            <Button variant="contained" onClick={() => setFullScreenPreviewOpen(true)}>
              Xem full screen
            </Button>
          </Box>
          <Box
            sx={{
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              overflow: "hidden",
              height: "min(85vh, 900px)",
              minHeight: 520,
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
          <Dialog
            fullScreen
            open={fullScreenPreviewOpen}
            onClose={() => setFullScreenPreviewOpen(false)}
            PaperProps={{ sx: { bgcolor: "grey.100" } }}
          >
            <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1.5 }}>
              <Typography variant="h6">Preview full screen</Typography>
              <IconButton aria-label="Đóng" onClick={() => setFullScreenPreviewOpen(false)} size="small">
                ✕
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <iframe
                  title="Preview full screen"
                  srcDoc={previewHtml}
                  style={{
                    width: "100%",
                    height: "100%",
                    minHeight: "calc(100vh - 56px)",
                    border: "none",
                  }}
                  sandbox="allow-same-origin allow-scripts"
                />
              </Box>
            </DialogContent>
          </Dialog>
        </>
      )}
    </Box>
  );
};

export const AIPageBuilderPage = memo(AIPageBuilderPageComponent);
