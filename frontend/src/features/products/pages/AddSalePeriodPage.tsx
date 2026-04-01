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
import { panelPath } from "@/constants/routes";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useMarketingUsersAll } from "@/features/users/hooks/userHooks";
import type { UserWithRoles } from "@/features/users/types";
import {
  useCreateProductSalePeriod,
  useCreateProductSalePeriodCostEntry,
  useProductSearch,
} from "../hooks/productHooks";
import {
  buildAdsOnlyCostEntryPayload,
  DEFAULT_SALE_PERIOD_OPERATING_COST,
  emptyAdsOnlyCostForm,
  shouldSkipCostEntryAdsOnly,
  type AdsOnlyCostForm,
} from "../utils/salePeriodCostForm";
import type { Product } from "../types";

const PRODUCT_SEARCH_DEBOUNCE_MS = 300;
const PRODUCT_SEARCH_PAGE_SIZE = 25;
const wrapperSx: SxProps<Theme> = { maxWidth: 480 };
const fieldSx: SxProps<Theme> = { mb: 2 };
const sectionSx: SxProps<Theme> = { mt: 3, mb: 2 };

const AddSalePeriodPageComponent = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { canEditProducts, canViewSalePeriodsAndReports } = useAuth();

  const [productOpen, setProductOpen] = useState(false);
  const [productInputValue, setProductInputValue] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const debouncedSearch = useDebounce(productInputValue, PRODUCT_SEARCH_DEBOUNCE_MS);
  const { data: productsRes, isLoading: productsLoading } = useProductSearch(
    {
      search: debouncedSearch.trim() || undefined,
      per_page: PRODUCT_SEARCH_PAGE_SIZE,
      exclude_in_active_sale_period: true,
    },
    productOpen
  );
  const productOptions = productsRes?.data ?? [];
  const productId = selectedProduct?.id ?? "";

  const [marketingInputValue, setMarketingInputValue] = useState("");
  const [selectedMarketingUser, setSelectedMarketingUser] = useState<UserWithRoles | null>(null);
  const { data: marketingOptions = [], isLoading: marketingLoading } = useMarketingUsersAll(canEditProducts);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [formsReceived, setFormsReceived] = useState("");
  const [realOrders, setRealOrders] = useState("");
  const [periodPurchaseCost, setPeriodPurchaseCost] = useState("");
  const [periodSellingPrice, setPeriodSellingPrice] = useState("");
  const [periodShippingCost, setPeriodShippingCost] = useState("");
  const [periodFeeOrTax, setPeriodFeeOrTax] = useState("");
  const [periodOperatingCost, setPeriodOperatingCost] = useState(DEFAULT_SALE_PERIOD_OPERATING_COST);
  const [costForm, setCostForm] = useState<AdsOnlyCostForm>(() => emptyAdsOnlyCostForm());
  const [submitError, setSubmitError] = useState("");

  const createPeriodMutation = useCreateProductSalePeriod();
  const createCostEntryMutation = useCreateProductSalePeriodCostEntry();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitError("");
      if (
        typeof productId !== "number" ||
        !startAt.trim() ||
        !endAt.trim() ||
        !selectedMarketingUser
      )
        return;

      const pc = Number(String(periodPurchaseCost).replace(/,/g, "").trim());
      const sp = Number(String(periodSellingPrice).replace(/,/g, "").trim());
      const psc = Number(String(periodShippingCost).replace(/,/g, "").trim());
      const fot = Number(String(periodFeeOrTax).replace(/,/g, "").trim());
      const oc = Number(String(periodOperatingCost).replace(/,/g, "").trim());
      if (
        !Number.isFinite(pc) ||
        pc < 0 ||
        !Number.isFinite(sp) ||
        sp < 0 ||
        !Number.isFinite(psc) ||
        psc < 0 ||
        !Number.isFinite(fot) ||
        fot < 0 ||
        !Number.isFinite(oc) ||
        oc < 0
      ) {
        setSubmitError(t("products.addSalePeriodPage.periodPricingInvalid"));
        return;
      }

      createPeriodMutation.mutate(
        {
          productId,
          payload: {
            start_at: startAt,
            end_at: endAt,
            marketing_user_id: selectedMarketingUser.id,
            forms_received: Math.max(0, Math.floor(Number(formsReceived) || 0)),
            real_orders: Math.max(0, Math.floor(Number(realOrders) || 0)),
            purchase_cost: pc,
            selling_price: sp,
            shipping_cost: psc,
            fee_or_tax: fot,
            operating_cost: oc,
          },
        },
        {
          onError: (err: Error) => {
            const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
            setSubmitError(msg ?? t("products.salePeriodOverlapError"));
          },
          onSuccess: (period) => {
            const goAfterSuccess = () =>
              navigate(
                canViewSalePeriodsAndReports ? panelPath("/products/sale-periods") : panelPath("/products")
              );
            const maybeCostThenList = () => {
              if (shouldSkipCostEntryAdsOnly(costForm)) {
                goAfterSuccess();
                return;
              }
              const costPayload = buildAdsOnlyCostEntryPayload(costForm.ads);
              if (!costPayload) {
                setSubmitError(t("products.addSalePeriodPage.costEntryInvalid"));
                return;
              }
              createCostEntryMutation.mutate(
                {
                  productId,
                  periodId: period.id,
                  payload: costPayload,
                },
                {
                  onSuccess: goAfterSuccess,
                  onError: () => {
                    setSubmitError(t("products.addSalePeriodPage.costEntryCreateError"));
                  },
                }
              );
            };
            maybeCostThenList();
          },
        }
      );
    },
    [
      productId,
      startAt,
      endAt,
      periodPurchaseCost,
      periodSellingPrice,
      periodShippingCost,
      periodFeeOrTax,
      periodOperatingCost,
      formsReceived,
      realOrders,
      costForm,
      selectedMarketingUser,
      createPeriodMutation,
      createCostEntryMutation,
      navigate,
      canViewSalePeriodsAndReports,
      t,
    ]
  );

  const handleReset = useCallback(() => {
    setSelectedProduct(null);
    setProductInputValue("");
    setSelectedMarketingUser(null);
    setMarketingInputValue("");
    setStartAt("");
    setEndAt("");
    setFormsReceived("");
    setRealOrders("");
    setPeriodPurchaseCost("");
    setPeriodSellingPrice("");
    setPeriodShippingCost("");
    setPeriodFeeOrTax("");
    setPeriodOperatingCost(DEFAULT_SALE_PERIOD_OPERATING_COST);
    setCostForm(emptyAdsOnlyCostForm());
    setSubmitError("");
  }, []);

  const goToProducts = useCallback(() => {
    navigate(panelPath("/products"));
  }, [navigate]);

  const isPending =
    createPeriodMutation.isPending || createCostEntryMutation.isPending;

  if (!canEditProducts) {
    return (
      <Box sx={wrapperSx}>
        <Alert severity="warning" sx={fieldSx}>
          {t("products.addSalePeriodPage.noPermission")}
        </Alert>
        <Button variant="outlined" onClick={() => navigate(panelPath("/products"))}>
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

      <Autocomplete<UserWithRoles>
        fullWidth
        inputValue={marketingInputValue}
        onInputChange={(_, value) => setMarketingInputValue(value)}
        options={marketingOptions}
        loading={marketingLoading}
        getOptionLabel={(option) =>
          typeof option === "object" && option ? `${option.name} (${option.email})` : ""
        }
        value={selectedMarketingUser}
        onChange={(_, newValue) => setSelectedMarketingUser(newValue)}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        noOptionsText={t("products.addSalePeriodPage.noMarketingUsersFound")}
        renderInput={(params) => (
          <TextField
            {...params}
            label={t("products.addSalePeriodPage.marketingUser")}
            required={!selectedMarketingUser}
            placeholder={t("products.addSalePeriodPage.searchMarketingPlaceholder")}
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

      <TextField
        fullWidth
        type="number"
        label={t("products.salePeriods.formsReceived")}
        value={formsReceived}
        onChange={(e) => setFormsReceived(e.target.value)}
        inputProps={{ min: 0, step: 1 }}
        placeholder="0"
        sx={fieldSx}
      />
      <TextField
        fullWidth
        type="number"
        label={t("products.salePeriods.realOrders")}
        value={realOrders}
        onChange={(e) => setRealOrders(e.target.value)}
        inputProps={{ min: 0, step: 1 }}
        placeholder="0"
        sx={fieldSx}
      />

      <Typography variant="subtitle2" sx={sectionSx}>
        {t("products.salePeriods.periodPricingTitle")}
      </Typography>
      <TextField
        fullWidth
        type="number"
        label={t("products.salePeriods.periodPurchaseCost")}
        value={periodPurchaseCost}
        onChange={(e) => setPeriodPurchaseCost(e.target.value)}
        required
        inputProps={{ min: 0, step: 0.01 }}
        sx={fieldSx}
      />
      <TextField
        fullWidth
        type="number"
        label={t("products.salePeriods.periodSellingPrice")}
        value={periodSellingPrice}
        onChange={(e) => setPeriodSellingPrice(e.target.value)}
        required
        inputProps={{ min: 0, step: 0.01 }}
        sx={fieldSx}
      />
      <TextField
        fullWidth
        type="number"
        label={t("products.salePeriods.periodShippingCost")}
        value={periodShippingCost}
        onChange={(e) => setPeriodShippingCost(e.target.value)}
        required
        inputProps={{ min: 0, step: 0.01 }}
        sx={fieldSx}
      />
      <TextField
        fullWidth
        type="number"
        label={t("products.salePeriods.periodFeeOrTax")}
        value={periodFeeOrTax}
        onChange={(e) => setPeriodFeeOrTax(e.target.value)}
        required
        inputProps={{ min: 0, step: 0.01 }}
        sx={fieldSx}
      />
      <TextField
        fullWidth
        type="number"
        label={t("products.salePeriods.periodOperatingCost")}
        value={periodOperatingCost}
        onChange={(e) => setPeriodOperatingCost(e.target.value)}
        required
        inputProps={{ min: 0, step: 100000 }}
        sx={fieldSx}
      />

      <Typography variant="subtitle2" sx={sectionSx}>
        {t("products.salePeriodCosts.sectionTitle")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t("products.addSalePeriodPage.costSnapshotDesc")}
      </Typography>
      <TextField
        fullWidth
        type="number"
        label={t("products.salePeriodCosts.adsRunCost")}
        value={costForm.ads}
        onChange={(e) => setCostForm((f) => ({ ...f, ads: e.target.value }))}
        inputProps={{ min: 0, step: 0.01 }}
        sx={fieldSx}
      />

      <Box sx={{ display: "flex", gap: 2, mt: 3, flexWrap: "wrap" }}>
        <Button
          type="submit"
          variant="contained"
          disabled={
            isPending ||
            productId === "" ||
            !startAt.trim() ||
            !endAt.trim() ||
            !selectedMarketingUser ||
            !periodPurchaseCost.trim() ||
            !periodSellingPrice.trim() ||
            !periodShippingCost.trim() ||
            !periodFeeOrTax.trim() ||
            !periodOperatingCost.trim()
          }
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
