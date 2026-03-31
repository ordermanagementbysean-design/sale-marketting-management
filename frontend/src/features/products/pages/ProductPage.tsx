import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Autocomplete from "@mui/material/Autocomplete";
import IconButton from "@mui/material/IconButton";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import type { SxProps, Theme } from "@mui/material/styles";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "@/features/auth/context/AuthContext";
import { isYmdBeforeLocalToday } from "@/shared/utils/localDateYmd";
import { useMarketingUsersAll } from "@/features/users/hooks/userHooks";
import type { UserWithRoles } from "@/features/users/types";
import {
  useCreateProductAdLink,
  useCreateProductSalePeriod,
  useDeleteProductAdLink,
  useDeleteProductSalePeriod,
  useProduct,
  useProductEligibleUsers,
  useProducts,
  useUpdateProduct,
  useUpdateProductAdLink,
  useUpdateProductSalePeriod,
  useUpdateProductVisibility,
} from "../hooks/productHooks";
import type { Product, ProductAdLink, ProductSalePeriod, ProductWithLogs } from "../types";
import { DEFAULT_SALE_PERIOD_OPERATING_COST } from "../utils/salePeriodCostForm";

const VISIBILITY_DEPARTMENTS = ["marketing", "sale", "customer_service"] as const;
type VisibilityDept = (typeof VISIBILITY_DEPARTMENTS)[number];

type VisibilityOption =
  | { id: "all"; name: string; email: string }
  | { id: number; name: string; email: string };

function isAllOption(o: VisibilityOption): o is { id: "all"; name: string; email: string } {
  return o.id === "all";
}

function createAllOption(label: string): VisibilityOption {
  return { id: "all", name: label, email: "" };
}

const getRowId = (row: Product) => row.id;

const PAGE_SIZE = 15;

function marketingUserFromPeriod(period: ProductSalePeriod | null): UserWithRoles | null {
  const mu = period?.marketing_user;
  if (!mu) return null;
  return {
    id: mu.id,
    name: mu.name,
    email: mu.email,
    role: "marketing",
    email_verified_at: null,
    created_at: "",
    updated_at: "",
  };
}
const wrapperSx: SxProps<Theme> = { width: "100%" };
const alertSx: SxProps<Theme> = { mb: 2 };
const toolbarSx: SxProps<Theme> = {
  mb: 2,
  display: "flex",
  alignItems: "center",
  gap: 2,
  flexWrap: "wrap",
};
const dataGridSx: SxProps<Theme> = {
  border: "none",
  "& .MuiDataGrid-cell:focus": { outline: "none" },
  "& .MuiDataGrid-columnHeaders": { bgcolor: "grey.100", borderRadius: 1 },
};
const dialogFieldSx: SxProps<Theme> = { mb: 2 };
const logBlockSx: SxProps<Theme> = {
  mt: 2,
  p: 1.5,
  bgcolor: "grey.100",
  borderRadius: 1,
  maxHeight: 200,
  overflow: "auto",
};

const statusLabels: Record<number, string> = {
  0: "products.statusDisabled",
  1: "products.statusActive",
};

function formatChangeKey(key: string): string {
  const map: Record<string, string> = {
    name: "products.fields.name",
    code: "products.fields.code",
    unit: "products.fields.unit",
    purchase_price: "products.fields.purchasePrice",
    unit_price: "products.fields.unitPrice",
    vat_percent: "products.fields.vatPercent",
    vat_code: "products.fields.vatCode",
    weight_gram: "products.fields.weightGram",
    status: "products.fields.status",
  };
  return map[key] ?? key;
}

const ProductPageComponent = () => {
  const { t } = useTranslation();
  const { canEditProducts } = useAuth();
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: PAGE_SIZE,
  });
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filters = useMemo(
    () => ({
      page: paginationModel.page + 1,
      per_page: paginationModel.pageSize,
      ...(canEditProducts && statusFilter === ""
        ? { include_inactive: true as const }
        : statusFilter !== ""
          ? { status: Number(statusFilter) as 0 | 1 }
          : {}),
      ...(search.trim() ? { search: search.trim() } : {}),
    }),
    [paginationModel.page, paginationModel.pageSize, statusFilter, search, canEditProducts]
  );

  const { data: productsData, isLoading, error, refetch } = useProducts(filters);
  const productId = editingProduct?.id ?? null;
  const { data: productDetail, isLoading: loadingDetail } = useProduct(productId);
  const updateProductMutation = useUpdateProduct();
  const { data: eligibleUsers = [] } = useProductEligibleUsers(canEditProducts && dialogOpen);
  const updateVisibilityMutation = useUpdateProductVisibility();
  const createAdLinkMutation = useCreateProductAdLink();
  const updateAdLinkMutation = useUpdateProductAdLink();
  const deleteAdLinkMutation = useDeleteProductAdLink();
  const createPeriodMutation = useCreateProductSalePeriod();
  const updatePeriodMutation = useUpdateProductSalePeriod();
  const deletePeriodMutation = useDeleteProductSalePeriod();

  const [visibilitySelection, setVisibilitySelection] = useState<
    Record<VisibilityDept, VisibilityOption[]>
  >({
    marketing: [],
    sale: [],
    customer_service: [],
  });

  const rows = useMemo(
    () => (error ? [] : productsData?.data ?? []),
    [error, productsData]
  );
  const rowCount = productsData?.total ?? 0;

  const usersByDept = useMemo(() => {
    const marketing = eligibleUsers.filter((u) => u.role === "marketing");
    const sale = eligibleUsers.filter(
      (u) => u.role === "telesale" || u.role === "telesale_leader"
    );
    const customer_service = eligibleUsers.filter(
      (u) => u.role === "customer_service"
    );
    return { marketing, sale, customer_service };
  }, [eligibleUsers]);

  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formUnit, setFormUnit] = useState("");
  const [formPurchasePrice, setFormPurchasePrice] = useState("");
  const [formUnitPrice, setFormUnitPrice] = useState("");
  const [formVatPercent, setFormVatPercent] = useState("");
  const [formVatCode, setFormVatCode] = useState("");
  const [formWeightGram, setFormWeightGram] = useState("");
  const [formStatus, setFormStatus] = useState<0 | 1>(1);

  const [periodDialogOpen, setPeriodDialogOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<ProductSalePeriod | null>(null);
  const [periodStartAt, setPeriodStartAt] = useState("");
  const [periodEndAt, setPeriodEndAt] = useState("");
  const [periodError, setPeriodError] = useState("");
  const [periodMarketingInput, setPeriodMarketingInput] = useState("");
  const [periodMarketingUser, setPeriodMarketingUser] = useState<UserWithRoles | null>(null);
  const [periodFormsReceived, setPeriodFormsReceived] = useState("");
  const [periodRealOrders, setPeriodRealOrders] = useState("");
  const [periodPurchaseCost, setPeriodPurchaseCost] = useState("");
  const [periodSellingPrice, setPeriodSellingPrice] = useState("");
  const [periodShippingCost, setPeriodShippingCost] = useState("");
  const [periodFeeOrTax, setPeriodFeeOrTax] = useState("");
  const [periodOperatingCost, setPeriodOperatingCost] = useState("");
  const { data: periodMarketingOptions = [], isLoading: periodMarketingLoading } =
    useMarketingUsersAll(canEditProducts);

  const periodStartLocked =
    editingPeriod != null && isYmdBeforeLocalToday(editingPeriod.start_at.slice(0, 10));

  const [adLinkDialogOpen, setAdLinkDialogOpen] = useState(false);
  const [adLinkSalePeriodId, setAdLinkSalePeriodId] = useState<number | "">("");
  const [editingAdLink, setEditingAdLink] = useState<ProductAdLink | null>(null);
  const [adLinkName, setAdLinkName] = useState("");
  const [adLinkUrl, setAdLinkUrl] = useState("");
  const [adLinkIdentifier, setAdLinkIdentifier] = useState("");
  const [adLinkClicks, setAdLinkClicks] = useState("");
  const [adLinkCost, setAdLinkCost] = useState("");

  const openEdit = useCallback((product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormCode(product.code);
    setFormUnit(product.unit);
    setFormPurchasePrice(String(product.purchase_price));
    setFormUnitPrice(String(product.unit_price));
    setFormVatPercent(String(product.vat_percent));
    setFormVatCode(product.vat_code ?? "");
    setFormWeightGram(String(product.weight_gram));
    setFormStatus(product.status);
    setVisibilitySelection({
      marketing: [],
      sale: [],
      customer_service: [],
    });
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingProduct(null);
  }, []);

  useEffect(() => {
    if (!productDetail?.visibility_rules || !editingProduct || !eligibleUsers.length) return;
    const rules = productDetail.visibility_rules;
    const allowedUsers = (productDetail as ProductWithLogs).allowed_users ?? [];
    const getSelection = (dept: VisibilityDept): VisibilityOption[] => {
      const roleMap: Record<VisibilityDept, string[]> = {
        marketing: ["marketing"],
        sale: ["telesale", "telesale_leader"],
        customer_service: ["customer_service"],
      };
      const roles = roleMap[dept];
      const allowAll = roles.some(
        (role) => rules.find((r) => r.role === role)?.allow_all ?? true
      );
      if (allowAll) {
        return [createAllOption(t("products.visibilityAllStaff"))];
      }
      const userIds = allowedUsers
        .filter((u) => u.role && roles.includes(u.role))
        .map((u) => u.id);
      return eligibleUsers
        .filter((u) => userIds.includes(u.id))
        .map((u) => ({ id: u.id, name: u.name, email: u.email }));
    };
    setVisibilitySelection({
      marketing: getSelection("marketing"),
      sale: getSelection("sale"),
      customer_service: getSelection("customer_service"),
    });
  }, [
    productDetail?.id,
    productDetail?.visibility_rules,
    productDetail?.allowed_users,
    editingProduct?.id,
    eligibleUsers,
    t,
  ]);

  const handleSaveVisibility = useCallback(() => {
    if (!editingProduct || !canEditProducts) return;
    const visibility: Record<string, { allow_all: boolean; user_ids: number[] }> = {};
    for (const dept of VISIBILITY_DEPARTMENTS) {
      const sel = visibilitySelection[dept] ?? [];
      const allowAll =
        sel.length === 0 || sel.some(isAllOption);
      const userIds = allowAll
        ? []
        : sel.filter((o): o is { id: number; name: string; email: string } => typeof o.id === "number").map((o) => o.id);
      visibility[dept] = { allow_all: allowAll, user_ids: userIds };
    }
    updateVisibilityMutation.mutate(
      { id: editingProduct.id, visibility },
      { onSuccess: () => refetch() }
    );
  }, [
    editingProduct,
    canEditProducts,
    visibilitySelection,
    updateVisibilityMutation,
    refetch,
  ]);

  const salePeriods = useMemo(
    () => (productDetail as ProductWithLogs)?.sale_periods ?? [],
    [productDetail]
  );

  const openAdLinkForm = useCallback(
    (adLink?: ProductAdLink | null) => {
      setEditingAdLink(adLink ?? null);
      setAdLinkName(adLink?.name ?? "");
      setAdLinkUrl(adLink?.ad_url ?? "");
      setAdLinkIdentifier(adLink?.ad_identifier ?? "");
      setAdLinkClicks(String(adLink?.clicks ?? 0));
      setAdLinkCost(String(adLink?.ad_cost ?? 0));
      setAdLinkSalePeriodId(
        adLink?.product_sale_period_id ?? (salePeriods[0]?.id ?? "")
      );
      setAdLinkDialogOpen(true);
    },
    [salePeriods]
  );
  const closeAdLinkDialog = useCallback(() => {
    setAdLinkDialogOpen(false);
    setEditingAdLink(null);
  }, []);
  const handleSaveAdLink = useCallback(() => {
    if (!editingProduct) return;
    const clicks = Number(adLinkClicks) || 0;
    const adCost = Number(adLinkCost) || 0;
    if (editingAdLink) {
      updateAdLinkMutation.mutate(
        {
          productId: editingProduct.id,
          adLinkId: editingAdLink.id,
          payload: {
            ...(adLinkSalePeriodId !== "" && Number(adLinkSalePeriodId) !== editingAdLink.product_sale_period_id
              ? { product_sale_period_id: Number(adLinkSalePeriodId) }
              : {}),
            name: adLinkName.trim(),
            ad_url: adLinkUrl.trim() || null,
            ad_identifier: adLinkIdentifier.trim() || null,
            clicks,
            ad_cost: adCost,
          },
        },
        { onSuccess: closeAdLinkDialog }
      );
    } else {
      if (typeof adLinkSalePeriodId !== "number") return;
      createAdLinkMutation.mutate(
        {
          productId: editingProduct.id,
          payload: {
            product_sale_period_id: Number(adLinkSalePeriodId),
            name: adLinkName.trim(),
            ad_url: adLinkUrl.trim() || null,
            ad_identifier: adLinkIdentifier.trim() || null,
            clicks,
            ad_cost: adCost,
          },
        },
        { onSuccess: closeAdLinkDialog }
      );
    }
  }, [
    editingProduct,
    editingAdLink,
    adLinkSalePeriodId,
    adLinkName,
    adLinkUrl,
    adLinkIdentifier,
    adLinkClicks,
    adLinkCost,
    createAdLinkMutation,
    updateAdLinkMutation,
    closeAdLinkDialog,
  ]);
  const handleDeleteAdLink = useCallback(
    (adLink: ProductAdLink) => {
      if (!editingProduct || !window.confirm(t("products.adLinkDeleteConfirm")))
        return;
      deleteAdLinkMutation.mutate({
        productId: editingProduct.id,
        adLinkId: adLink.id,
      });
    },
    [editingProduct, deleteAdLinkMutation, t]
  );

  const handleSubmit = useCallback(() => {
    if (!editingProduct || !canEditProducts) return;
    const payload = {
      name: formName.trim(),
      code: formCode.trim(),
      unit: formUnit.trim(),
      purchase_price: Number(formPurchasePrice) || 0,
      unit_price: Number(formUnitPrice) || 0,
      vat_percent: Number(formVatPercent) || 0,
      vat_code: formVatCode.trim() || null,
      weight_gram: Number(formWeightGram) || 0,
      status: formStatus,
    };
    updateProductMutation.mutate(
      { id: editingProduct.id, payload },
      { onSuccess: closeDialog }
    );
  }, [
    editingProduct,
    canEditProducts,
    formName,
    formCode,
    formUnit,
    formPurchasePrice,
    formUnitPrice,
    formVatPercent,
    formVatCode,
    formWeightGram,
    formStatus,
    updateProductMutation,
    closeDialog,
  ]);

  const openPeriodForm = useCallback((period?: ProductSalePeriod | null) => {
    setEditingPeriod(period ?? null);
    setPeriodStartAt(period ? period.start_at.slice(0, 10) : "");
    setPeriodEndAt(period ? period.end_at.slice(0, 10) : "");
    setPeriodMarketingUser(marketingUserFromPeriod(period ?? null));
    setPeriodMarketingInput("");
    setPeriodFormsReceived(String(period?.forms_received ?? 0));
    setPeriodRealOrders(String(period?.real_orders ?? 0));
    setPeriodPurchaseCost(period?.purchase_cost != null ? String(period.purchase_cost) : "");
    setPeriodSellingPrice(period?.selling_price != null ? String(period.selling_price) : "");
    setPeriodShippingCost(period?.shipping_cost != null ? String(period.shipping_cost) : "");
    setPeriodFeeOrTax(period?.fee_or_tax != null ? String(period.fee_or_tax) : "");
    setPeriodOperatingCost(
      period?.operating_cost != null ? String(period.operating_cost) : DEFAULT_SALE_PERIOD_OPERATING_COST
    );
    setPeriodError("");
    setPeriodDialogOpen(true);
  }, []);
  const closePeriodDialog = useCallback(() => {
    setPeriodDialogOpen(false);
    setEditingPeriod(null);
    setPeriodError("");
    setPeriodMarketingUser(null);
    setPeriodMarketingInput("");
    setPeriodFormsReceived("");
    setPeriodRealOrders("");
    setPeriodPurchaseCost("");
    setPeriodSellingPrice("");
    setPeriodShippingCost("");
    setPeriodFeeOrTax("");
    setPeriodOperatingCost("");
  }, []);
  const handleSavePeriod = useCallback(() => {
    if (!editingProduct || !canEditProducts) return;
    if (!periodStartAt.trim() || !periodEndAt.trim() || !periodMarketingUser) return;
    setPeriodError("");
    const forms = Math.max(0, Math.floor(Number(periodFormsReceived) || 0));
    const orders = Math.max(0, Math.floor(Number(periodRealOrders) || 0));
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
      setPeriodError(t("products.addSalePeriodPage.periodPricingInvalid"));
      return;
    }
    if (editingPeriod) {
      updatePeriodMutation.mutate(
        {
          productId: editingProduct.id,
          periodId: editingPeriod.id,
          payload: {
            start_at: periodStartAt,
            end_at: periodEndAt,
            marketing_user_id: periodMarketingUser.id,
            forms_received: forms,
            real_orders: orders,
            purchase_cost: pc,
            selling_price: sp,
            shipping_cost: psc,
            fee_or_tax: fot,
            operating_cost: oc,
          },
        },
        {
          onSuccess: closePeriodDialog,
          onError: (err: Error) => {
            const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
            setPeriodError(msg ?? t("products.salePeriodOverlapError"));
          },
        }
      );
    } else {
      createPeriodMutation.mutate(
        {
          productId: editingProduct.id,
          payload: {
            start_at: periodStartAt,
            end_at: periodEndAt,
            marketing_user_id: periodMarketingUser.id,
            forms_received: forms,
            real_orders: orders,
            purchase_cost: pc,
            selling_price: sp,
            shipping_cost: psc,
            fee_or_tax: fot,
            operating_cost: oc,
          },
        },
        {
          onSuccess: closePeriodDialog,
          onError: (err: Error) => {
            const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
            setPeriodError(msg ?? t("products.salePeriodOverlapError"));
          },
        }
      );
    }
  }, [
    editingProduct,
    canEditProducts,
    editingPeriod,
    periodStartAt,
    periodEndAt,
    periodMarketingUser,
    periodFormsReceived,
    periodRealOrders,
    periodPurchaseCost,
    periodSellingPrice,
    periodShippingCost,
    periodFeeOrTax,
    periodOperatingCost,
    createPeriodMutation,
    updatePeriodMutation,
    closePeriodDialog,
    t,
  ]);
  const handleDeletePeriod = useCallback(
    (period: ProductSalePeriod) => {
      if (!editingProduct || !window.confirm(t("products.salePeriodDeleteConfirm")))
        return;
      deletePeriodMutation.mutate({
        productId: editingProduct.id,
        periodId: period.id,
      });
    },
    [editingProduct, deletePeriodMutation, t]
  );

  const getPeriodLabel = useCallback((periodId: number | null) => {
    if (periodId == null) return "–";
    const p = salePeriods.find((sp) => sp.id === periodId);
    return p ? `${p.start_at.slice(0, 10)} – ${p.end_at.slice(0, 10)}` : "–";
  }, [salePeriods]);

  const columns = useMemo<GridColDef<Product>[]>(
    () => [
      { field: "id", headerName: "ID", width: 70 },
      { field: "name", headerName: t("products.fields.name"), flex: 1, minWidth: 160 },
      { field: "code", headerName: t("products.fields.code"), width: 120 },
      { field: "unit", headerName: t("products.fields.unit"), width: 80 },
      {
        field: "purchase_price",
        headerName: t("products.fields.purchasePrice"),
        width: 110,
        valueFormatter: (v) => (v != null ? Number(v).toLocaleString() : ""),
      },
      {
        field: "unit_price",
        headerName: t("products.fields.unitPrice"),
        width: 110,
        valueFormatter: (v) => (v != null ? Number(v).toLocaleString() : ""),
      },
      {
        field: "vat_percent",
        headerName: t("products.fields.vatPercent"),
        width: 90,
        valueFormatter: (v) => (v != null ? `${v}%` : ""),
      },
      { field: "vat_code", headerName: t("products.fields.vatCode"), width: 90 },
      {
        field: "weight_gram",
        headerName: t("products.fields.weightGram"),
        width: 100,
        valueFormatter: (v) => (v != null ? `${v} g` : ""),
      },
      {
        field: "status",
        headerName: t("products.fields.status"),
        width: 120,
        valueFormatter: (v) =>
          typeof v === "number" ? t(statusLabels[v] ?? "") : "",
      },
      ...(canEditProducts
        ? [
            {
              field: "actions",
              headerName: "",
              width: 100,
              sortable: false,
              renderCell: ({ row }: { row: Product }) => (
                <Button
                  size="small"
                  startIcon={<EditOutlinedIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(row);
                  }}
                >
                  {t("products.edit")}
                </Button>
              ),
            } as GridColDef<Product>,
          ]
        : []),
    ],
    [t, canEditProducts, openEdit]
  );

  const editLogs = (productDetail as ProductWithLogs)?.edit_logs ?? [];

  return (
    <Box sx={wrapperSx}>
      {error && (
        <Alert severity="error" sx={alertSx}>
          {t("products.loadError")}
        </Alert>
      )}

      <Box sx={toolbarSx}>
        <TextField
          size="small"
          placeholder={t("products.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 200 }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="product-status-label">{t("products.statusLabel")}</InputLabel>
          <Select
            labelId="product-status-label"
            label={t("products.statusLabel")}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="">{t("products.statusAll")}</MenuItem>
            <MenuItem value="0">{t("products.statusDisabled")}</MenuItem>
            <MenuItem value="1">{t("products.statusActive")}</MenuItem>
          </Select>
        </FormControl>
        {canEditProducts && (
          <Button
            variant="contained"
            size="small"
            component={RouterLink}
            to="/products/new"
            startIcon={<AddIcon />}
          >
            {t("products.addProduct")}
          </Button>
        )}
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={() => refetch()}
          disabled={isLoading}
        >
          {t("orders.refresh")}
        </Button>
      </Box>

      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={getRowId}
        loading={isLoading}
        rowCount={rowCount}
        paginationMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[10, 15, 25, 50]}
        autoHeight
        disableRowSelectionOnClick
        sx={dataGridSx}
        onRowClick={(params) => canEditProducts && openEdit(params.row)}
      />

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{t("products.editProduct")}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={t("products.fields.name")}
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            disabled={!canEditProducts}
            sx={{ ...dialogFieldSx, mt: 2 }}
          />
          <TextField
            fullWidth
            label={t("products.fields.code")}
            value={formCode}
            onChange={(e) => setFormCode(e.target.value)}
            disabled={!canEditProducts}
            sx={dialogFieldSx}
          />
          <TextField
            fullWidth
            label={t("products.fields.unit")}
            value={formUnit}
            onChange={(e) => setFormUnit(e.target.value)}
            disabled={!canEditProducts}
            sx={dialogFieldSx}
          />
          <TextField
            fullWidth
            type="number"
            label={t("products.fields.purchasePrice")}
            value={formPurchasePrice}
            onChange={(e) => setFormPurchasePrice(e.target.value)}
            disabled={!canEditProducts}
            inputProps={{ min: 0, step: 0.01 }}
            sx={dialogFieldSx}
          />
          <TextField
            fullWidth
            type="number"
            label={t("products.fields.unitPrice")}
            value={formUnitPrice}
            onChange={(e) => setFormUnitPrice(e.target.value)}
            disabled={!canEditProducts}
            inputProps={{ min: 0, step: 0.01 }}
            sx={dialogFieldSx}
          />
          <TextField
            fullWidth
            type="number"
            label={t("products.fields.vatPercent")}
            value={formVatPercent}
            onChange={(e) => setFormVatPercent(e.target.value)}
            disabled={!canEditProducts}
            inputProps={{ min: 0, max: 100, step: 0.01 }}
            sx={dialogFieldSx}
          />
          <TextField
            fullWidth
            label={t("products.fields.vatCode")}
            value={formVatCode}
            onChange={(e) => setFormVatCode(e.target.value)}
            disabled={!canEditProducts}
            sx={dialogFieldSx}
          />
          <TextField
            fullWidth
            type="number"
            label={t("products.fields.weightGram")}
            value={formWeightGram}
            onChange={(e) => setFormWeightGram(e.target.value)}
            disabled={!canEditProducts}
            inputProps={{ min: 0, step: 1 }}
            sx={dialogFieldSx}
          />
          <FormControl fullWidth sx={dialogFieldSx} disabled={!canEditProducts}>
            <InputLabel id="edit-status-label">{t("products.fields.status")}</InputLabel>
            <Select
              labelId="edit-status-label"
              label={t("products.fields.status")}
              value={formStatus}
              onChange={(e) => setFormStatus(Number(e.target.value) as 0 | 1)}
            >
              <MenuItem value={0}>{t("products.statusDisabled")}</MenuItem>
              <MenuItem value={1}>{t("products.statusActive")}</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 0.5 }}>
            {t("products.salePeriodsTitle")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {t("products.salePeriodsDesc")}
          </Typography>
          <Box sx={{ mb: 2 }}>
            {salePeriods.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {t("products.noSalePeriods")}
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t("products.salePeriods.startAt")}</TableCell>
                    <TableCell>{t("products.salePeriods.endAt")}</TableCell>
                    <TableCell>{t("products.salePeriods.marketingUser")}</TableCell>
                    <TableCell align="right">{t("products.salePeriods.formsReceived")}</TableCell>
                    <TableCell align="right">{t("products.salePeriods.realOrders")}</TableCell>
                    <TableCell align="right">{t("products.salePeriods.periodPurchaseCost")}</TableCell>
                    <TableCell align="right">{t("products.salePeriods.periodSellingPrice")}</TableCell>
                    <TableCell align="right">{t("products.salePeriods.periodShippingCost")}</TableCell>
                    <TableCell align="right">{t("products.salePeriods.periodFeeOrTax")}</TableCell>
                    <TableCell align="right">{t("products.salePeriods.periodOperatingCost")}</TableCell>
                    {canEditProducts && <TableCell width={120} />}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {salePeriods.map((period) => (
                    <TableRow key={period.id}>
                      <TableCell>{period.start_at.slice(0, 10)}</TableCell>
                      <TableCell>{period.end_at.slice(0, 10)}</TableCell>
                      <TableCell>{period.marketing_user?.name ?? "–"}</TableCell>
                      <TableCell align="right">{period.forms_received ?? 0}</TableCell>
                      <TableCell align="right">{period.real_orders ?? 0}</TableCell>
                      <TableCell align="right">
                        {period.purchase_cost != null ? Number(period.purchase_cost).toLocaleString() : "–"}
                      </TableCell>
                      <TableCell align="right">
                        {period.selling_price != null ? Number(period.selling_price).toLocaleString() : "–"}
                      </TableCell>
                      <TableCell align="right">
                        {period.shipping_cost != null ? Number(period.shipping_cost).toLocaleString() : "–"}
                      </TableCell>
                      <TableCell align="right">
                        {period.fee_or_tax != null ? Number(period.fee_or_tax).toLocaleString() : "–"}
                      </TableCell>
                      <TableCell align="right">
                        {period.operating_cost != null ? Number(period.operating_cost).toLocaleString() : "–"}
                      </TableCell>
                      {canEditProducts && (
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => openPeriodForm(period)}
                            aria-label={t("products.edit")}
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeletePeriod(period)}
                            aria-label={t("users.delete")}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {canEditProducts && (
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => openPeriodForm(null)}
                sx={{ mt: 0.5 }}
              >
                {t("products.addSalePeriod")}
              </Button>
            )}
          </Box>

          {canEditProducts && (
            <>
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                {t("products.visibilityTitle")}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {t("products.visibilityDesc")}
              </Typography>
              {VISIBILITY_DEPARTMENTS.map((dept) => {
                const allOption: VisibilityOption = createAllOption(
                  t("products.visibilityAllStaff")
                );
                const deptUsers: VisibilityOption[] = usersByDept[dept].map(
                  (u) => ({ id: u.id, name: u.name, email: u.email })
                );
                const options: VisibilityOption[] = [allOption, ...deptUsers];
                const value = visibilitySelection[dept];
                return (
                  <Autocomplete<VisibilityOption, true>
                    key={dept}
                    multiple
                    size="small"
                    options={options}
                    getOptionLabel={(opt) =>
                      isAllOption(opt) ? opt.name : `${opt.name} (${opt.email})`
                    }
                    value={value}
                    onChange={(_, selected) => {
                      const hasAll = selected.some(isAllOption);
                      if (hasAll) {
                        setVisibilitySelection((prev) => ({
                          ...prev,
                          [dept]: [allOption],
                        }));
                      } else {
                        setVisibilitySelection((prev) => ({
                          ...prev,
                          [dept]: selected,
                        }));
                      }
                    }}
                    filterOptions={(opts, state) => {
                      const q = state.inputValue.trim().toLowerCase();
                      const filtered = opts.filter((opt) => {
                        if (isAllOption(opt)) return true;
                        return (
                          opt.name.toLowerCase().includes(q) ||
                          opt.email.toLowerCase().includes(q)
                        );
                      });
                      return filtered.sort((a) => (isAllOption(a) ? -1 : 1));
                    }}
                    isOptionEqualToValue={(a, b) => a.id === b.id}
                    sx={{ mb: 1.5 }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t(`products.visibilityDept.${dept}`)}
                        placeholder={t("products.visibilitySearchPlaceholder")}
                      />
                    )}
                  />
                );
              }              )}
            </>
          )}

          <Typography variant="subtitle2" sx={{ mt: 2, mb: 0.5 }}>
            {t("products.adLinksTitle")}
          </Typography>
          <Box sx={{ overflowX: "auto", mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t("products.adLinks.name")}</TableCell>
                  <TableCell>{t("products.adLinks.salePeriod")}</TableCell>
                  <TableCell>{t("products.adLinks.adUrl")}</TableCell>
                  <TableCell align="right">{t("products.adLinks.clicks")}</TableCell>
                  <TableCell align="right">{t("products.adLinks.adCost")}</TableCell>
                  <TableCell align="right">{t("products.metrics.conversionRate")}</TableCell>
                  <TableCell align="right">{t("products.metrics.cpo")}</TableCell>
                  <TableCell align="right">{t("products.metrics.roas")}</TableCell>
                  <TableCell align="right">{t("products.metrics.profit")}</TableCell>
                  {canEditProducts && <TableCell width={80} />}
                </TableRow>
              </TableHead>
              <TableBody>
                {(productDetail as ProductWithLogs)?.ad_links?.length
                  ? (productDetail as ProductWithLogs).ad_links!.map((ad) => (
                      <TableRow key={ad.id}>
                        <TableCell>{ad.name}</TableCell>
                        <TableCell>{getPeriodLabel(ad.product_sale_period_id)}</TableCell>
                        <TableCell sx={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis" }}>
                          {ad.ad_url ?? "-"}
                        </TableCell>
                        <TableCell align="right">{ad.clicks}</TableCell>
                        <TableCell align="right">
                          {Number(ad.ad_cost).toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          {ad.metrics?.conversion_rate != null
                            ? `${(ad.metrics.conversion_rate * 100).toFixed(2)}%`
                            : "-"}
                        </TableCell>
                        <TableCell align="right">
                          {ad.metrics?.cpo != null
                            ? ad.metrics.cpo.toLocaleString()
                            : "-"}
                        </TableCell>
                        <TableCell align="right">
                          {ad.metrics?.roas != null ? ad.metrics.roas.toFixed(2) : "-"}
                        </TableCell>
                        <TableCell align="right">
                          {ad.metrics?.profit != null
                            ? ad.metrics.profit.toLocaleString()
                            : "-"}
                        </TableCell>
                        {canEditProducts && (
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => openAdLinkForm(ad)}
                              aria-label={t("products.edit")}
                            >
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteAdLink(ad)}
                              aria-label={t("users.delete")}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  : (
                      <TableRow>
                        <TableCell colSpan={canEditProducts ? 10 : 9}>
                          {t("products.noAdLinks")}
                        </TableCell>
                      </TableRow>
                    )}
              </TableBody>
            </Table>
          </Box>
          {canEditProducts && (
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => openAdLinkForm(null)}
              disabled={salePeriods.length === 0}
              sx={{ mb: 2 }}
              title={salePeriods.length === 0 ? t("products.addSalePeriodFirst") : undefined}
            >
              {t("products.addAdLink")}
            </Button>
          )}

          <Typography variant="subtitle2" sx={{ mt: 2, mb: 0.5 }}>
            {t("products.editLogs")}
          </Typography>
          {loadingDetail ? (
            <Typography variant="body2" color="text.secondary">
              {t("products.loading")}
            </Typography>
          ) : editLogs.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {t("products.noEditLogs")}
            </Typography>
          ) : (
            <Box sx={logBlockSx}>
              {editLogs.map((log) => (
                <Box key={log.id} sx={{ mb: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(log.created_at).toLocaleString()} –{" "}
                    {log.user?.name ?? log.user_id}
                  </Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2 }}>
                    {Object.entries(log.changes ?? {}).map(([key, val]) => (
                      <li key={key}>
                        <Typography variant="body2">
                          {t(formatChangeKey(key))}: {String((val as { old?: unknown }).old)} →{" "}
                          {String((val as { new?: unknown }).new)}
                        </Typography>
                      </li>
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>{t("users.cancel")}</Button>
          {canEditProducts && (
            <>
              <Button
                variant="outlined"
                onClick={handleSaveVisibility}
                disabled={updateVisibilityMutation.isPending}
              >
                {updateVisibilityMutation.isPending
                  ? t("users.saving")
                  : t("products.saveVisibility")}
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={updateProductMutation.isPending}
              >
                {updateProductMutation.isPending ? t("users.saving") : t("users.save")}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={periodDialogOpen} onClose={closePeriodDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPeriod ? t("products.editSalePeriod") : t("products.addSalePeriod")}
        </DialogTitle>
        <DialogContent>
          {periodError && (
            <Alert severity="error" sx={dialogFieldSx}>
              {periodError}
            </Alert>
          )}
          <Autocomplete<UserWithRoles>
            fullWidth
            inputValue={periodMarketingInput}
            onInputChange={(_, value) => setPeriodMarketingInput(value)}
            options={periodMarketingOptions}
            loading={periodMarketingLoading}
            getOptionLabel={(option) =>
              typeof option === "object" && option ? `${option.name} (${option.email})` : ""
            }
            value={periodMarketingUser}
            onChange={(_, newValue) => setPeriodMarketingUser(newValue)}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            noOptionsText={t("products.addSalePeriodPage.noMarketingUsersFound")}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t("products.addSalePeriodPage.marketingUser")}
                required={!periodMarketingUser}
                placeholder={t("products.addSalePeriodPage.searchMarketingPlaceholder")}
              />
            )}
            sx={dialogFieldSx}
          />
          <TextField
            fullWidth
            type="date"
            label={t("products.salePeriods.startAt")}
            value={periodStartAt}
            onChange={(e) => setPeriodStartAt(e.target.value)}
            disabled={periodStartLocked}
            helperText={periodStartLocked ? t("products.salePeriods.startAtLockedPast") : undefined}
            InputLabelProps={{ shrink: true }}
            sx={dialogFieldSx}
          />
          <TextField
            fullWidth
            type="date"
            label={t("products.salePeriods.endAt")}
            value={periodEndAt}
            onChange={(e) => setPeriodEndAt(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={dialogFieldSx}
          />
          <TextField
            fullWidth
            type="number"
            label={t("products.salePeriods.formsReceived")}
            value={periodFormsReceived}
            onChange={(e) => setPeriodFormsReceived(e.target.value)}
            inputProps={{ min: 0, step: 1 }}
            sx={dialogFieldSx}
          />
          <TextField
            fullWidth
            type="number"
            label={t("products.salePeriods.realOrders")}
            value={periodRealOrders}
            onChange={(e) => setPeriodRealOrders(e.target.value)}
            inputProps={{ min: 0, step: 1 }}
            sx={dialogFieldSx}
          />
          <TextField
            fullWidth
            type="number"
            label={t("products.salePeriods.periodPurchaseCost")}
            value={periodPurchaseCost}
            onChange={(e) => setPeriodPurchaseCost(e.target.value)}
            required
            inputProps={{ min: 0, step: 0.01 }}
            sx={dialogFieldSx}
          />
          <TextField
            fullWidth
            type="number"
            label={t("products.salePeriods.periodSellingPrice")}
            value={periodSellingPrice}
            onChange={(e) => setPeriodSellingPrice(e.target.value)}
            required
            inputProps={{ min: 0, step: 0.01 }}
            sx={dialogFieldSx}
          />
          <TextField
            fullWidth
            type="number"
            label={t("products.salePeriods.periodShippingCost")}
            value={periodShippingCost}
            onChange={(e) => setPeriodShippingCost(e.target.value)}
            required
            inputProps={{ min: 0, step: 0.01 }}
            sx={dialogFieldSx}
          />
          <TextField
            fullWidth
            type="number"
            label={t("products.salePeriods.periodFeeOrTax")}
            value={periodFeeOrTax}
            onChange={(e) => setPeriodFeeOrTax(e.target.value)}
            required
            inputProps={{ min: 0, step: 0.01 }}
            sx={dialogFieldSx}
          />
          <TextField
            fullWidth
            type="number"
            label={t("products.salePeriods.periodOperatingCost")}
            value={periodOperatingCost}
            onChange={(e) => setPeriodOperatingCost(e.target.value)}
            required
            inputProps={{ min: 0, step: 0.01 }}
            sx={dialogFieldSx}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closePeriodDialog}>{t("users.cancel")}</Button>
          <Button
            variant="contained"
            onClick={handleSavePeriod}
            disabled={
              !periodStartAt.trim() ||
              !periodEndAt.trim() ||
              !periodMarketingUser ||
              !periodPurchaseCost.trim() ||
              !periodSellingPrice.trim() ||
              !periodShippingCost.trim() ||
              !periodFeeOrTax.trim() ||
              !periodOperatingCost.trim() ||
              createPeriodMutation.isPending ||
              updatePeriodMutation.isPending
            }
          >
            {editingPeriod ? t("users.save") : t("products.createSalePeriod")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={adLinkDialogOpen} onClose={closeAdLinkDialog} maxWidth="xs" fullWidth>
        <DialogTitle>
          {editingAdLink ? t("products.editAdLink") : t("products.addAdLink")}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={dialogFieldSx} required={!editingAdLink}>
            <InputLabel id="ad-link-period-label">{t("products.adLinks.salePeriod")}</InputLabel>
            <Select<number>
              labelId="ad-link-period-label"
              label={t("products.adLinks.salePeriod")}
              value={typeof adLinkSalePeriodId === "number" ? adLinkSalePeriodId : salePeriods[0]?.id ?? 0}
              onChange={(e) => setAdLinkSalePeriodId(Number(e.target.value))}
            >
              {salePeriods.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.start_at.slice(0, 10)} – {p.end_at.slice(0, 10)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label={t("products.adLinks.name")}
            value={adLinkName}
            onChange={(e) => setAdLinkName(e.target.value)}
            sx={dialogFieldSx}
          />
          <TextField
            fullWidth
            label={t("products.adLinks.adUrl")}
            value={adLinkUrl}
            onChange={(e) => setAdLinkUrl(e.target.value)}
            placeholder="https://..."
            sx={dialogFieldSx}
          />
          <TextField
            fullWidth
            label={t("products.adLinks.adIdentifier")}
            value={adLinkIdentifier}
            onChange={(e) => setAdLinkIdentifier(e.target.value)}
            placeholder="e.g. Facebook ad ID"
            sx={dialogFieldSx}
          />
          <TextField
            fullWidth
            type="number"
            label={t("products.adLinks.clicks")}
            value={adLinkClicks}
            onChange={(e) => setAdLinkClicks(e.target.value)}
            inputProps={{ min: 0 }}
            sx={dialogFieldSx}
          />
          <TextField
            fullWidth
            type="number"
            label={t("products.adLinks.adCost")}
            value={adLinkCost}
            onChange={(e) => setAdLinkCost(e.target.value)}
            inputProps={{ min: 0, step: 0.01 }}
            sx={dialogFieldSx}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAdLinkDialog}>{t("users.cancel")}</Button>
          <Button
            variant="contained"
            onClick={handleSaveAdLink}
            disabled={
              (!editingAdLink && (adLinkSalePeriodId === "" || typeof adLinkSalePeriodId !== "number")) ||
              !adLinkName.trim() ||
              createAdLinkMutation.isPending ||
              updateAdLinkMutation.isPending
            }
          >
            {editingAdLink ? t("users.save") : t("products.createAdLink")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const ProductPage = memo(ProductPageComponent);
export default ProductPage;
