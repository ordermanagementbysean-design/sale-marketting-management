import { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import FormLabel from "@mui/material/FormLabel";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { panelPath } from "@/constants/routes";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useCreateProduct } from "../hooks/productHooks";
import { PRODUCT_VIEWER_ROLE_VALUES } from "../types";

const wrapperSx: SxProps<Theme> = { maxWidth: 520 };
const fieldSx: SxProps<Theme> = { mb: 2 };

const ALL_VIEWER_ROLES = [...PRODUCT_VIEWER_ROLE_VALUES];

const CreateProductPageComponent = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { canEditProducts } = useAuth();
  const createMutation = useCreateProduct();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [unit, setUnit] = useState("cái");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [vatPercent, setVatPercent] = useState("");
  const [vatCode, setVatCode] = useState("");
  const [weightGram, setWeightGram] = useState("");
  const [status, setStatus] = useState<0 | 1>(1);
  const [visibilityAllowAll, setVisibilityAllowAll] = useState(true);
  const [restrictedRoles, setRestrictedRoles] = useState<string[]>(() => [...ALL_VIEWER_ROLES]);
  const [submitError, setSubmitError] = useState("");

  const toggleRestrictedRole = useCallback((role: string, checked: boolean) => {
    setRestrictedRoles((prev) => {
      if (checked) {
        return prev.includes(role) ? prev : [...prev, role];
      }
      return prev.filter((r) => r !== role);
    });
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitError("");
      const n = name.trim();
      const c = code.trim();
      if (!n) {
        setSubmitError(t("products.createProductPage.requiredFields"));
        return;
      }
      if (!visibilityAllowAll && restrictedRoles.length === 0) {
        setSubmitError(t("products.createProductPage.visibilityPickOneRole"));
        return;
      }
      const pp = Number(String(purchasePrice).replace(/,/g, "").trim()) || 0;
      const up = Number(String(unitPrice).replace(/,/g, "").trim()) || 0;
      const vp = Number(String(vatPercent).trim()) || 0;
      const wg = Math.max(0, Math.floor(Number(String(weightGram).trim()) || 0));
      if (
        !Number.isFinite(pp) ||
        pp < 0 ||
        !Number.isFinite(up) ||
        up < 0 ||
        !Number.isFinite(vp) ||
        vp < 0 ||
        vp > 100
      ) {
        setSubmitError(t("products.createProductPage.invalidNumbers"));
        return;
      }
      createMutation.mutate(
        {
          name: n,
          ...(c ? { code: c } : {}),
          unit: unit.trim() || "cái",
          purchase_price: pp,
          unit_price: up,
          vat_percent: vp,
          vat_code: vatCode.trim() || null,
          weight_gram: wg,
          status,
          ...(visibilityAllowAll
            ? { visibility_allow_all: true }
            : { visibility_allow_all: false, visibility_roles: [...restrictedRoles] }),
        },
        {
          onSuccess: () => navigate(panelPath("/products")),
          onError: (err: Error) => {
            const msg = (err as { response?: { data?: { message?: string } } }).response?.data
              ?.message;
            setSubmitError(
              typeof msg === "string" ? msg : t("products.createProductPage.createError")
            );
          },
        }
      );
    },
    [
      name,
      code,
      unit,
      purchasePrice,
      unitPrice,
      vatPercent,
      vatCode,
      weightGram,
      status,
      visibilityAllowAll,
      restrictedRoles,
      createMutation,
      navigate,
      t,
    ]
  );

  if (!canEditProducts) {
    return (
      <Box sx={wrapperSx}>
        <Alert severity="warning" sx={fieldSx}>
          {t("products.createProductPage.noPermission")}
        </Alert>
        <Button variant="outlined" onClick={() => navigate(panelPath("/products"))}>
          {t("products.createProductPage.backToProducts")}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={wrapperSx} component="form" onSubmit={handleSubmit}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {t("products.createProductPage.title")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t("products.createProductPage.subtitle")}
      </Typography>

      {submitError && (
        <Alert severity="error" sx={fieldSx} onClose={() => setSubmitError("")}>
          {submitError}
        </Alert>
      )}

      <TextField
        fullWidth
        required
        label={t("products.fields.name")}
        value={name}
        onChange={(e) => setName(e.target.value)}
        sx={fieldSx}
      />
      <TextField
        fullWidth
        label={t("products.fields.code")}
        helperText={t("products.createProductPage.codeOptional")}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        sx={fieldSx}
      />
      <TextField
        fullWidth
        label={t("products.fields.unit")}
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
        sx={fieldSx}
      />
      <TextField
        fullWidth
        type="number"
        label={t("products.fields.purchasePrice")}
        value={purchasePrice}
        onChange={(e) => setPurchasePrice(e.target.value)}
        inputProps={{ min: 0, step: 0.01 }}
        sx={fieldSx}
      />
      <TextField
        fullWidth
        type="number"
        label={t("products.fields.unitPrice")}
        value={unitPrice}
        onChange={(e) => setUnitPrice(e.target.value)}
        inputProps={{ min: 0, step: 0.01 }}
        sx={fieldSx}
      />
      <TextField
        fullWidth
        type="number"
        label={t("products.fields.vatPercent")}
        value={vatPercent}
        onChange={(e) => setVatPercent(e.target.value)}
        inputProps={{ min: 0, max: 100, step: 0.01 }}
        sx={fieldSx}
      />
      <TextField
        fullWidth
        label={t("products.fields.vatCode")}
        value={vatCode}
        onChange={(e) => setVatCode(e.target.value)}
        sx={fieldSx}
      />
      <TextField
        fullWidth
        type="number"
        label={t("products.fields.weightGram")}
        value={weightGram}
        onChange={(e) => setWeightGram(e.target.value)}
        inputProps={{ min: 0, step: 1 }}
        sx={fieldSx}
      />

      <FormControl component="fieldset" variant="standard" sx={{ ...fieldSx, display: "block" }}>
        <FormLabel component="legend">{t("products.createProductPage.visibilitySection")}</FormLabel>
        <RadioGroup
          value={visibilityAllowAll ? "all" : "restrict"}
          onChange={(_, v) => {
            const all = v === "all";
            setVisibilityAllowAll(all);
            if (!all && restrictedRoles.length === 0) {
              setRestrictedRoles([...ALL_VIEWER_ROLES]);
            }
          }}
        >
          <FormControlLabel
            value="all"
            control={<Radio />}
            label={t("products.createProductPage.visibilityAllowAll")}
          />
          <FormControlLabel
            value="restrict"
            control={<Radio />}
            label={t("products.createProductPage.visibilityRestrict")}
          />
        </RadioGroup>
        {!visibilityAllowAll && (
          <>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
              {t("products.createProductPage.visibilityRestrictHint")}
            </Typography>
            <FormGroup>
              {PRODUCT_VIEWER_ROLE_VALUES.map((role) => (
                <FormControlLabel
                  key={role}
                  control={
                    <Checkbox
                      checked={restrictedRoles.includes(role)}
                      onChange={(_, checked) => toggleRestrictedRole(role, checked)}
                    />
                  }
                  label={t(`products.createProductPage.viewerRole.${role}`)}
                />
              ))}
            </FormGroup>
          </>
        )}
      </FormControl>

      <FormControl fullWidth sx={fieldSx}>
        <InputLabel id="create-product-status-label">{t("products.fields.status")}</InputLabel>
        <Select
          labelId="create-product-status-label"
          label={t("products.fields.status")}
          value={status}
          onChange={(e) => setStatus(Number(e.target.value) as 0 | 1)}
        >
          <MenuItem value={0}>{t("products.statusDisabled")}</MenuItem>
          <MenuItem value={1}>{t("products.statusActive")}</MenuItem>
        </Select>
      </FormControl>

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
        <Button type="submit" variant="contained" disabled={createMutation.isPending}>
          {createMutation.isPending ? t("users.saving") : t("products.createProductPage.submit")}
        </Button>
        <Button variant="outlined" type="button" onClick={() => navigate(panelPath("/products"))}>
          {t("users.cancel")}
        </Button>
      </Box>
    </Box>
  );
};

const CreateProductPage = memo(CreateProductPageComponent);
export default CreateProductPage;
