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
import Snackbar from "@mui/material/Snackbar";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableContainer from "@mui/material/TableContainer";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Autocomplete from "@mui/material/Autocomplete";
import IconButton from "@mui/material/IconButton";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import type { SxProps, Theme } from "@mui/material/styles";
import { DataGrid, GridColDef, GridRowId, GridRowSelectionModel } from "@mui/x-data-grid";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "@/features/auth/context/AuthContext";
import { isYmdBeforeLocalToday } from "@/shared/utils/localDateYmd";
import { useMarketingUsersAll } from "@/features/users/hooks/userHooks";
import type { UserWithRoles } from "@/features/users/types";
import {
  useCreateProductSalePeriod,
  useDeleteProduct,
  useDeleteProductSalePeriod,
  useProduct,
  useProductEligibleUsers,
  useProducts,
  useUpdateProduct,
  useUpdateProductSalePeriod,
  useUpdateProductVisibility,
} from "../hooks/productHooks";
import type { Product, ProductSalePeriod, ProductWithLogs } from "../types";
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
  "& .MuiDataGrid-cell[data-field=\"actions\"]": {
    display: "flex",
    alignItems: "center",
    py: 0,
  },
};

/** Row action icons: no visible border until hover. */
const rowActionIconSx: SxProps<Theme> = {
  border: "1px solid transparent",
  borderRadius: 1,
  boxSizing: "border-box",
  "&:hover": {
    borderColor: "primary.main",
    bgcolor: "action.hover",
  },
};

const dialogFieldSx: SxProps<Theme> = { mb: 2 };

const statusLabels: Record<number, string> = {
  0: "products.statusDisabled",
  1: "products.statusActive",
};

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const data = (err as { response?: { data?: unknown } }).response?.data;
    if (data && typeof data === "object") {
      const d = data as { message?: unknown; errors?: Record<string, string[] | string> };
      if (typeof d.message === "string" && d.message.trim()) {
        return d.message;
      }
      if (d.errors && typeof d.errors === "object") {
        const vals = Object.values(d.errors).flatMap((v) => (Array.isArray(v) ? v : [v]));
        const first = vals.find((x): x is string => typeof x === "string" && x.trim().length > 0);
        if (first) {
          return first;
        }
      }
    }
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}

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
    allowed_users: "products.editLog.allowedUsers",
    visibility_roles: "products.editLog.visibilityRoles",
  };
  return map[key] ?? key;
}

function formatChangeValueForLog(value: unknown, t?: (key: string) => string): string {
  if (value === null || value === undefined) {
    return "—";
  }
  if (Array.isArray(value)) {
    return value.length === 0 ? "—" : value.join(", ");
  }
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const o = value as Record<string, unknown>;
    const keys = Object.keys(o);
    if (keys.length === 0) {
      return "—";
    }
    const looksLikeRoleAllowAll = keys.every((k) => typeof o[k] === "boolean");
    if (looksLikeRoleAllowAll && t) {
      return [...keys]
        .sort()
        .map((role) => {
          const allow = o[role] === true;
          return `${role}: ${allow ? t("products.editLog.visibilityRoleAll") : t("products.editLog.visibilityRoleRestricted")}`;
        })
        .join("; ");
    }
    return keys
      .sort()
      .map((k) => `${k}: ${String(o[k])}`)
      .join("; ");
  }
  return String(value);
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
  const [visibilityDialogOpen, setVisibilityDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyProductId, setHistoryProductId] = useState<number | null>(null);
  const [historyProductName, setHistoryProductName] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [bulkDeleteToast, setBulkDeleteToast] = useState<{
    open: boolean;
    severity: "success" | "error";
    message: string;
  }>({
    open: false,
    severity: "success",
    message: "",
  });
  const [pageNotice, setPageNotice] = useState<{
    open: boolean;
    severity: "success" | "error";
    message: string;
  }>({ open: false, severity: "success", message: "" });

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
  const { data: productDetail } = useProduct(productId);
  const historyQueryId = historyDialogOpen ? historyProductId : null;
  const { data: historyProductDetail, isLoading: historyDetailLoading } =
    useProduct(historyQueryId);
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();
  const { data: eligibleUsers = [] } = useProductEligibleUsers(
    canEditProducts && (dialogOpen || visibilityDialogOpen)
  );
  const updateVisibilityMutation = useUpdateProductVisibility();
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

  const openEdit = useCallback((product: Product) => {
    setVisibilityDialogOpen(false);
    setHistoryDialogOpen(false);
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
    setVisibilityDialogOpen(false);
    setEditingProduct(null);
  }, []);

  const openHistoryForRow = useCallback((product: Product) => {
    setHistoryProductId(product.id);
    setHistoryProductName(product.name);
    setHistoryDialogOpen(true);
  }, []);

  const closeHistoryDialog = useCallback(() => {
    setHistoryDialogOpen(false);
    setHistoryProductId(null);
    setHistoryProductName("");
  }, []);

  const handleClosePageNotice = useCallback(
    (_?: unknown, reason?: string) => {
      if (reason === "clickaway") {
        return;
      }
      setPageNotice((n) => ({ ...n, open: false }));
    },
    []
  );

  const closeVisibilityDialog = useCallback(() => {
    setVisibilityDialogOpen(false);
    if (!dialogOpen) {
      setEditingProduct(null);
    }
  }, [dialogOpen]);

  const openProductVisibilityForRow = useCallback((product: Product) => {
    setDialogOpen(false);
    setHistoryDialogOpen(false);
    setEditingProduct(product);
    setVisibilitySelection({
      marketing: [],
      sale: [],
      customer_service: [],
    });
    setVisibilityDialogOpen(true);
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
      {
        onSuccess: () => {
          refetch();
          closeVisibilityDialog();
          setPageNotice({
            open: true,
            severity: "success",
            message: t("products.viewPermissionSaved"),
          });
        },
        onError: (err: unknown) => {
          closeVisibilityDialog();
          setPageNotice({
            open: true,
            severity: "error",
            message: getApiErrorMessage(err, t("products.viewPermissionSaveError")),
          });
        },
      }
    );
  }, [
    editingProduct,
    canEditProducts,
    visibilitySelection,
    updateVisibilityMutation,
    refetch,
    t,
    closeVisibilityDialog,
  ]);

  const salePeriods = useMemo(
    () => (productDetail as ProductWithLogs)?.sale_periods ?? [],
    [productDetail]
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
      {
        onSuccess: () => {
          refetch();
          closeDialog();
          setPageNotice({
            open: true,
            severity: "success",
            message: t("products.productInfoSaved"),
          });
        },
        onError: (err: unknown) => {
          closeDialog();
          setPageNotice({
            open: true,
            severity: "error",
            message: getApiErrorMessage(err, t("products.productUpdateError")),
          });
        },
      }
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
    refetch,
    t,
    closeDialog,
  ]);

  const handleDeleteSelected = useCallback(async () => {
    if (!canEditProducts || selectedProductIds.length === 0) return;
    if (!window.confirm(t("products.bulkDeleteConfirm", { count: selectedProductIds.length }))) {
      return;
    }
    try {
      await Promise.all(selectedProductIds.map((id) => deleteProductMutation.mutateAsync(id)));
      setSelectedProductIds([]);
      setBulkDeleteToast({
        open: true,
        severity: "success",
        message: t("products.bulkDeleteSuccess", { count: selectedProductIds.length }),
      });
    } catch {
      setBulkDeleteToast({
        open: true,
        severity: "error",
        message: t("products.bulkDeleteError"),
      });
    }
  }, [canEditProducts, selectedProductIds, t, deleteProductMutation]);

  const handleCloseBulkDeleteToast = useCallback(() => {
    setBulkDeleteToast((prev) => ({ ...prev, open: false }));
  }, []);

  const handleRowSelectionChange = useCallback(
    (model: GridRowSelectionModel) => {
      if (Array.isArray(model)) {
        setSelectedProductIds(model.map((id) => Number(id)));
        return;
      }

      if (typeof model !== "object" || model == null || !("type" in model) || !("ids" in model)) {
        setSelectedProductIds([]);
        return;
      }

      const { type, ids } = model as { type: "include" | "exclude"; ids: Set<GridRowId> };

      if (type === "include") {
        setSelectedProductIds(Array.from(ids, (id) => Number(id)));
        return;
      }

      // Exclude model: selection is "all rows" minus `ids`. Empty `ids` => everything selected (MUI "select all").
      if (ids.size === 0) {
        setSelectedProductIds(rows.map((r) => r.id));
        return;
      }
      setSelectedProductIds(rows.filter((r) => !ids.has(r.id)).map((r) => r.id));
    },
    [rows]
  );

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

  const historyTableRows = useMemo(() => {
    const logs = (historyProductDetail as ProductWithLogs | undefined)?.edit_logs ?? [];
    const out: {
      rowKey: string;
      time: string;
      userName: string;
      change: string;
      oldVal: string;
      newVal: string;
    }[] = [];
    for (const log of logs) {
      const time = new Date(log.created_at).toLocaleString();
      const userName = log.user?.name ?? String(log.user_id ?? "—");
      const changes = log.changes ?? {};
      for (const [key, val] of Object.entries(changes)) {
        const v = val as { old?: unknown; new?: unknown };
        out.push({
          rowKey: `${log.id}-${key}`,
          time,
          userName,
          change: t(formatChangeKey(key)),
          oldVal: formatChangeValueForLog(v.old, t),
          newVal: formatChangeValueForLog(v.new, t),
        });
      }
    }
    return out;
  }, [historyProductDetail, t]);

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
              headerName: t("products.actionsColumn"),
              width: 152,
              sortable: false,
              renderCell: ({ row }: { row: Product }) => (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.25,
                    height: "100%",
                    width: "100%",
                    minHeight: 0,
                  }}
                >
                  <Tooltip title={t("products.edit")}>
                    <IconButton
                      size="small"
                      color="primary"
                      aria-label={t("products.edit")}
                      sx={rowActionIconSx}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(row);
                      }}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t("products.rowVisibility")}>
                    <IconButton
                      size="small"
                      color="primary"
                      aria-label={t("products.rowVisibility")}
                      sx={rowActionIconSx}
                      onClick={(e) => {
                        e.stopPropagation();
                        openProductVisibilityForRow(row);
                      }}
                    >
                      <VisibilityOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t("products.rowHistory")}>
                    <IconButton
                      size="small"
                      color="primary"
                      aria-label={t("products.rowHistory")}
                      sx={rowActionIconSx}
                      onClick={(e) => {
                        e.stopPropagation();
                        openHistoryForRow(row);
                      }}
                    >
                      <HistoryOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              ),
            } as GridColDef<Product>,
          ]
        : []),
    ],
    [t, canEditProducts, openEdit, openProductVisibilityForRow, openHistoryForRow]
  );

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
          <>
            <Button
              variant="outlined"
              size="small"
              component={RouterLink}
              to="/products/import"
              startIcon={<UploadFileOutlinedIcon />}
            >
              {t("layout.sidebar.productImport")}
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<DeleteOutlineIcon />}
              onClick={handleDeleteSelected}
              disabled={selectedProductIds.length === 0 || deleteProductMutation.isPending}
            >
              {t("products.deleteSelected", { count: selectedProductIds.length })}
            </Button>
            <Button
              variant="contained"
              size="small"
              component={RouterLink}
              to="/products/new"
              startIcon={<AddIcon />}
            >
              {t("products.addProduct")}
            </Button>
          </>
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
        disableRowSelectionExcludeModel
        checkboxSelection={canEditProducts}
        onRowSelectionModelChange={handleRowSelectionChange}
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
          {canEditProducts && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
              {t("products.editDialogProductFieldsHint")}
            </Typography>
          )}
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
        </DialogContent>
        <DialogActions sx={{ flexWrap: "wrap", gap: 1 }}>
          <Button onClick={closeDialog}>{t("users.cancel")}</Button>
          {canEditProducts && (
            <Button
              type="button"
              variant="contained"
              onClick={handleSubmit}
              disabled={updateProductMutation.isPending}
            >
              {updateProductMutation.isPending
                ? t("users.saving")
                : t("products.saveProductInfo")}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog
        open={historyDialogOpen}
        onClose={closeHistoryDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {t("products.historyDialogTitle", {
            name: (historyProductDetail?.name ?? historyProductName).trim() || "—",
          })}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TableContainer sx={{ maxHeight: 480 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>{t("products.historyTableTime")}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t("products.historyTableUser")}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t("products.historyTableChange")}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t("products.historyTableOld")}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t("products.historyTableNew")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historyDetailLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                ) : historyTableRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Typography variant="body2" color="text.secondary">
                        {t("products.noEditLogs")}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  historyTableRows.map((r) => (
                    <TableRow key={r.rowKey}>
                      <TableCell sx={{ whiteSpace: "nowrap", verticalAlign: "top" }}>{r.time}</TableCell>
                      <TableCell sx={{ verticalAlign: "top" }}>{r.userName}</TableCell>
                      <TableCell
                        sx={{
                          verticalAlign: "top",
                          maxWidth: 220,
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                        }}
                      >
                        {r.change}
                      </TableCell>
                      <TableCell
                        sx={{
                          verticalAlign: "top",
                          maxWidth: 360,
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                        }}
                      >
                        {r.oldVal}
                      </TableCell>
                      <TableCell
                        sx={{
                          verticalAlign: "top",
                          maxWidth: 360,
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                        }}
                      >
                        {r.newVal}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeHistoryDialog}>{t("products.historyDialogClose")}</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={visibilityDialogOpen}
        onClose={closeVisibilityDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {t("products.productVisibilityDialogTitle", {
            name: (editingProduct?.name ?? formName.trim()) || "—",
          })}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, mt: 0.5 }}>
            {t("products.productVisibilityDialogSubtitle")}
          </Typography>
          {canEditProducts && (
            <>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t("products.visibilityTitle")}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {t("products.visibilityDesc")}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                {t("products.editDialogVisibilityHint")}
              </Typography>
              {VISIBILITY_DEPARTMENTS.map((dept) => {
                const allOption: VisibilityOption = createAllOption(
                  t("products.visibilityAllStaff")
                );
                const deptUsers: VisibilityOption[] = usersByDept[dept].map((u) => ({
                  id: u.id,
                  name: u.name,
                  email: u.email,
                }));
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
              })}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ flexWrap: "wrap", gap: 1 }}>
          <Button type="button" onClick={closeVisibilityDialog}>
            {t("users.cancel")}
          </Button>
          {canEditProducts && (
            <Button
              type="button"
              variant="contained"
              onClick={handleSaveVisibility}
              disabled={updateVisibilityMutation.isPending}
            >
              {updateVisibilityMutation.isPending
                ? t("users.saving")
                : t("products.saveViewPermission")}
            </Button>
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

      <Snackbar
        open={bulkDeleteToast.open}
        autoHideDuration={2500}
        onClose={handleCloseBulkDeleteToast}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseBulkDeleteToast}
          severity={bulkDeleteToast.severity}
          variant="filled"
        >
          {bulkDeleteToast.message}
        </Alert>
      </Snackbar>
      <Snackbar
        open={pageNotice.open}
        autoHideDuration={4500}
        onClose={handleClosePageNotice}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{
          top: "50%",
          left: "50%",
          right: "auto",
          bottom: "auto",
          transform: "translate(-50%, -50%)",
        }}
      >
        <Alert
          onClose={() => setPageNotice((n) => ({ ...n, open: false }))}
          severity={pageNotice.severity}
          variant="filled"
          sx={{ minWidth: 280, maxWidth: 480, boxShadow: 3 }}
        >
          {pageNotice.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const ProductPage = memo(ProductPageComponent);
export default ProductPage;
