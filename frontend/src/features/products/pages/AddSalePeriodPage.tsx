import { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useAuth } from "@/features/auth/context/AuthContext";
import {
  useCreateProductAdLink,
  useCreateProductSalePeriod,
  useProductSearch,
} from "../hooks/productHooks";
import type { Product } from "../types";

const PRODUCT_SEARCH_DEBOUNCE_MS = 300;
const PRODUCT_SEARCH_PAGE_SIZE = 25;

const wrapperSx: SxProps<Theme> = { maxWidth: 480 };
const fieldSx: SxProps<Theme> = { mb: 2 };
const sectionSx: SxProps<Theme> = { mt: 3, mb: 2 };

const AddSalePeriodPageComponent = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { canEditProducts } = useAuth();

  const [productOpen, setProductOpen] = useState(false);
  const [productInputValue, setProductInputValue] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const debouncedSearch = useDebounce(productInputValue, PRODUCT_SEARCH_DEBOUNCE_MS);
  const { data: productsRes, isLoading: productsLoading } = useProductSearch(
    { search: debouncedSearch.trim() || undefined, per_page: PRODUCT_SEARCH_PAGE_SIZE },
    productOpen
  );
  const productOptions = productsRes?.data ?? [];
  const productId = selectedProduct?.id ?? "";
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [adLinkName, setAdLinkName] = useState("");
  const [adLinkUrl, setAdLinkUrl] = useState("");
  const [adLinkIdentifier, setAdLinkIdentifier] = useState("");
  const [adLinkClicks, setAdLinkClicks] = useState("");
  const [adLinkCost, setAdLinkCost] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const createPeriodMutation = useCreateProductSalePeriod();
  const createAdLinkMutation = useCreateProductAdLink();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitError("");
      setSuccessMessage("");
      if (typeof productId !== "number" || !startAt.trim() || !endAt.trim()) return;

      createPeriodMutation.mutate(
        {
          productId,
          payload: { start_at: startAt, end_at: endAt },
        },
        {
          onError: (err: Error) => {
            const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
            setSubmitError(msg ?? t("products.salePeriodOverlapError"));
          },
          onSuccess: (period) => {
            setSuccessMessage(t("products.addSalePeriodPage.periodCreated"));
            if (adLinkName.trim()) {
              createAdLinkMutation.mutate(
                {
                  productId,
                  payload: {
                    product_sale_period_id: period.id,
                    name: adLinkName.trim(),
                    ad_url: adLinkUrl.trim() || null,
                    ad_identifier: adLinkIdentifier.trim() || null,
                    clicks: Number(adLinkClicks) || 0,
                    ad_cost: Number(adLinkCost) || 0,
                  },
                },
                {
                  onSuccess: () => {
                    setSuccessMessage(t("products.addSalePeriodPage.periodAndAdLinkCreated"));
                    setAdLinkName("");
                    setAdLinkUrl("");
                    setAdLinkIdentifier("");
                    setAdLinkClicks("");
                    setAdLinkCost("");
                  },
                  onError: () => {
                    setSubmitError(t("products.addSalePeriodPage.adLinkCreateError"));
                  },
                }
              );
            }
          },
        }
      );
    },
    [
      productId,
      startAt,
      endAt,
      adLinkName,
      adLinkUrl,
      adLinkIdentifier,
      adLinkClicks,
      adLinkCost,
      createPeriodMutation,
      createAdLinkMutation,
      t,
    ]
  );

  const handleReset = useCallback(() => {
    setSelectedProduct(null);
    setProductInputValue("");
    setStartAt("");
    setEndAt("");
    setAdLinkName("");
    setAdLinkUrl("");
    setAdLinkIdentifier("");
    setAdLinkClicks("");
    setAdLinkCost("");
    setSubmitError("");
    setSuccessMessage("");
  }, []);

  const goToProducts = useCallback(() => {
    navigate("/products");
  }, [navigate]);

  const isPending = createPeriodMutation.isPending || createAdLinkMutation.isPending;

  if (!canEditProducts) {
    return (
      <Box sx={wrapperSx}>
        <Alert severity="warning" sx={fieldSx}>
          {t("products.addSalePeriodPage.noPermission")}
        </Alert>
        <Button variant="outlined" onClick={() => navigate("/products")}>
          {t("products.addSalePeriodPage.backToProducts")}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={wrapperSx} component="form" onSubmit={handleSubmit}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {t("products.addSalePeriodPage.title")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t("products.addSalePeriodPage.subtitle")}
      </Typography>

      {submitError && (
        <Alert severity="error" sx={fieldSx} onClose={() => setSubmitError("")}>
          {submitError}
        </Alert>
      )}
      {successMessage && (
        <Alert severity="success" sx={fieldSx} onClose={() => setSuccessMessage("")}>
          {successMessage}
        </Alert>
      )}

      <Autocomplete<Product>
        fullWidth
        open={productOpen}
        onOpen={() => setProductOpen(true)}
        onClose={() => setProductOpen(false)}
        inputValue={productInputValue}
        onInputChange={(_, value) => setProductInputValue(value)}
        options={productOptions}
        loading={productsLoading}
        getOptionLabel={(option) => (typeof option === "object" && option ? `${option.name} (${option.code})` : "")}
        value={selectedProduct}
        onChange={(_, newValue) => setSelectedProduct(newValue)}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        noOptionsText={t("products.addSalePeriodPage.noProductsFound")}
        renderInput={(params) => (
          <TextField
            {...params}
            label={t("products.addSalePeriodPage.product")}
            required={!selectedProduct}
            placeholder={t("products.addSalePeriodPage.searchProductPlaceholder")}
          />
        )}
        sx={fieldSx}
      />

      <TextField
        fullWidth
        type="date"
        label={t("products.salePeriods.startAt")}
        value={startAt}
        onChange={(e) => setStartAt(e.target.value)}
        required
        InputLabelProps={{ shrink: true }}
        sx={fieldSx}
      />
      <TextField
        fullWidth
        type="date"
        label={t("products.salePeriods.endAt")}
        value={endAt}
        onChange={(e) => setEndAt(e.target.value)}
        required
        InputLabelProps={{ shrink: true }}
        sx={fieldSx}
      />

      <Typography variant="subtitle2" sx={sectionSx}>
        {t("products.addSalePeriodPage.adLinkSection")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t("products.addSalePeriodPage.adLinkSectionDesc")}
      </Typography>
      <TextField
        fullWidth
        label={t("products.adLinks.name")}
        value={adLinkName}
        onChange={(e) => setAdLinkName(e.target.value)}
        placeholder={t("products.addSalePeriodPage.adLinkOptional")}
        sx={fieldSx}
      />
      <TextField
        fullWidth
        label={t("products.adLinks.adUrl")}
        value={adLinkUrl}
        onChange={(e) => setAdLinkUrl(e.target.value)}
        placeholder="https://..."
        sx={fieldSx}
      />
      <TextField
        fullWidth
        label={t("products.adLinks.adIdentifier")}
        value={adLinkIdentifier}
        onChange={(e) => setAdLinkIdentifier(e.target.value)}
        sx={fieldSx}
      />
      <TextField
        fullWidth
        type="number"
        label={t("products.adLinks.clicks")}
        value={adLinkClicks}
        onChange={(e) => setAdLinkClicks(e.target.value)}
        inputProps={{ min: 0 }}
        sx={fieldSx}
      />
      <TextField
        fullWidth
        type="number"
        label={t("products.adLinks.adCost")}
        value={adLinkCost}
        onChange={(e) => setAdLinkCost(e.target.value)}
        inputProps={{ min: 0, step: 0.01 }}
        sx={fieldSx}
      />

      <Box sx={{ display: "flex", gap: 2, mt: 3, flexWrap: "wrap" }}>
        <Button
          type="submit"
          variant="contained"
          disabled={isPending || productId === "" || !startAt.trim() || !endAt.trim()}
        >
          {isPending ? t("users.saving") : t("products.addSalePeriodPage.submit")}
        </Button>
        <Button type="button" variant="outlined" onClick={handleReset} disabled={isPending}>
          {t("products.addSalePeriodPage.reset")}
        </Button>
        <Button type="button" variant="outlined" onClick={goToProducts}>
          {t("products.addSalePeriodPage.backToProducts")}
        </Button>
      </Box>
    </Box>
  );
};

const AddSalePeriodPage = memo(AddSalePeriodPageComponent);
export default AddSalePeriodPage;
