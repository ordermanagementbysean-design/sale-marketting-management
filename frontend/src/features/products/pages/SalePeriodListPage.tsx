import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useAuth } from "@/features/auth/context/AuthContext";
import {
  inclusiveDaysBetweenYmd,
  isYmdBeforeLocalToday,
  salePeriodDaysPastYmd,
} from "@/shared/utils/localDateYmd";
import { useMarketingUsersAll } from "@/features/users/hooks/userHooks";
import type { UserWithRoles } from "@/features/users/types";
import {
  useCreateProductSalePeriodCostEntry,
  useDeleteProductSalePeriod,
  useProductSalePeriodCostEntries,
  useSalePeriodsList,
  useUpdateProductSalePeriod,
  useUpdateProductSalePeriodCostEntry,
} from "../hooks/productHooks";
import type { ProductSalePeriod, ProductSalePeriodCostEntry, SalePeriodListItem } from "../types";
import {
  buildAdsOnlyCostEntryPayload,
  emptyAdsOnlyCostForm,
  type AdsOnlyCostForm,
} from "../utils/salePeriodCostForm";
import { operatingCostTotalDisplay } from "../utils/operatingCostDisplay";

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
  /** Vertically center cell content (text and icon buttons) within each row. */
  "& .MuiDataGrid-cell": {
    display: "flex",
    alignItems: "center",
    lineHeight: 1.43,
  },
};
const dialogFieldSx: SxProps<Theme> = { mb: 2 };
const costTableHeadSx: SxProps<Theme> = {
  fontSize: "0.7rem",
  fontWeight: 600,
  whiteSpace: "normal",
  lineHeight: 1.2,
  maxWidth: 96,
};

const getRowId = (row: SalePeriodListItem) => row.id;

function formatCostAmount(v: string | number): string {
  return Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function sumCostEntryAds(entries: ProductSalePeriodCostEntry[]): number {
  return entries.reduce((acc, e) => acc + Number(e.ads_run_cost), 0);
}

function parseAdsRunCostInput(s: string): number | null {
  const t = s.trim().replace(/,/g, "");
  if (t === "") return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function adsAmountsDiffer(saved: number, draft: number): boolean {
  return Math.round(saved * 100) !== Math.round(draft * 100);
}

const costSummaryBoxSx: SxProps<Theme> = {
  mb: 2,
  p: 2,
  borderRadius: 1,
  bgcolor: "grey.100",
  border: 1,
  borderColor: "divider",
};

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

/** Stable empty ref — default `= []` in hooks creates a new array each render and breaks useEffect deps. */
const EMPTY_COST_ENTRIES: ProductSalePeriodCostEntry[] = [];

const SalePeriodListPageComponent = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { canEditProducts } = useAuth();
  const { data: periods = [], isLoading, error } = useSalePeriodsList();
  const { data: marketingOptions = [], isLoading: marketingLoading } =
    useMarketingUsersAll(canEditProducts);
  const updatePeriodMutation = useUpdateProductSalePeriod();
  const deletePeriodMutation = useDeleteProductSalePeriod();
  const createCostEntryMutation = useCreateProductSalePeriodCostEntry();
  const updateCostEntryMutation = useUpdateProductSalePeriodCostEntry();

  const [editRow, setEditRow] = useState<SalePeriodListItem | null>(null);
  const [costDialogRow, setCostDialogRow] = useState<SalePeriodListItem | null>(null);
  const [newCostForm, setNewCostForm] = useState<AdsOnlyCostForm>(() => emptyAdsOnlyCostForm());
  const [costDialogError, setCostDialogError] = useState("");
  const [costEntryEditError, setCostEntryEditError] = useState("");
  const [entryAdsDrafts, setEntryAdsDrafts] = useState<Record<number, string>>({});
  const [periodStartAt, setPeriodStartAt] = useState("");
  const [periodEndAt, setPeriodEndAt] = useState("");
  const [periodMarketingInput, setPeriodMarketingInput] = useState("");
  const [periodMarketingUser, setPeriodMarketingUser] = useState<UserWithRoles | null>(null);
  const [periodFormsReceived, setPeriodFormsReceived] = useState("");
  const [periodRealOrders, setPeriodRealOrders] = useState("");
  const [periodPurchaseCost, setPeriodPurchaseCost] = useState("");
  const [periodSellingPrice, setPeriodSellingPrice] = useState("");
  const [periodShippingCost, setPeriodShippingCost] = useState("");
  const [periodFeeOrTax, setPeriodFeeOrTax] = useState("");
  const [periodOperatingCost, setPeriodOperatingCost] = useState("");
  const [periodError, setPeriodError] = useState("");

  const rows = useMemo(() => {
    if (error) return [];
    const list = Array.isArray(periods) ? periods : [];
    return list.filter((r) => r != null && r.id != null);
  }, [error, periods]);

  const periodStartLocked = useMemo(
    () =>
      editRow
        ? isYmdBeforeLocalToday((editRow.start_at ?? "").slice(0, 10))
        : false,
    [editRow]
  );

  const costProductId = costDialogRow?.product.id ?? null;
  const costPeriodId = costDialogRow?.id ?? null;
  const { data: costEntriesData, isLoading: costEntriesLoading } =
    useProductSalePeriodCostEntries(costProductId, costPeriodId, costDialogRow != null);
  const costEntries = costEntriesData ?? EMPTY_COST_ENTRIES;

  const adsEntriesTotal = useMemo(() => sumCostEntryAds(costEntries), [costEntries]);

  const operatingCostTotalForModal = useMemo(() => {
    if (!costDialogRow) return 0;
    return operatingCostTotalDisplay(costEntries.length, Number(costDialogRow.operating_cost ?? 0));
  }, [costDialogRow, costEntries.length, costDialogRow?.operating_cost]);

  const canSaveCostEntry = useMemo(
    () => buildAdsOnlyCostEntryPayload(newCostForm.ads) !== null,
    [newCostForm.ads]
  );

  const canSaveCostEntryEdits = useMemo(() => {
    if (costEntries.length === 0) return false;
    let anyDirty = false;
    for (const e of costEntries) {
      const raw = entryAdsDrafts[e.id];
      if (raw === undefined) return false;
      const parsed = parseAdsRunCostInput(raw);
      if (parsed === null) return false;
      if (adsAmountsDiffer(Number(e.ads_run_cost), parsed)) anyDirty = true;
    }
    return anyDirty;
  }, [costEntries, entryAdsDrafts]);

  const handleSaveCostEntryEdits = useCallback(async () => {
    if (!costDialogRow || !canEditProducts || !canSaveCostEntryEdits) return;
    setCostEntryEditError("");
    const productId = costDialogRow.product.id;
    const periodId = costDialogRow.id;
    const toSave = costEntries.filter((e) => {
      const parsed = parseAdsRunCostInput(entryAdsDrafts[e.id] ?? "");
      return parsed !== null && adsAmountsDiffer(Number(e.ads_run_cost), parsed);
    });
    try {
      await Promise.all(
        toSave.map((e) =>
          updateCostEntryMutation.mutateAsync({
            productId,
            periodId,
            entryId: e.id,
            payload: { ads_run_cost: parseAdsRunCostInput(entryAdsDrafts[e.id] ?? "")! },
          })
        )
      );
    } catch {
      setCostEntryEditError(t("products.salePeriodCosts.updateCostEntryError"));
    }
  }, [
    costDialogRow,
    canEditProducts,
    canSaveCostEntryEdits,
    costEntries,
    entryAdsDrafts,
    updateCostEntryMutation,
    t,
  ]);

  useEffect(() => {
    if (costDialogRow) {
      setNewCostForm(emptyAdsOnlyCostForm());
      setCostDialogError("");
      setCostEntryEditError("");
    }
  }, [costDialogRow]);

  useEffect(() => {
    const next: Record<number, string> = {};
    for (const e of costEntries) {
      next[e.id] = String(Number(e.ads_run_cost));
    }
    setEntryAdsDrafts(next);
  }, [costEntries]);

  const openCosts = useCallback((row: SalePeriodListItem) => {
    setCostDialogRow(row);
  }, []);

  const closeCosts = useCallback(() => {
    setCostDialogRow(null);
  }, []);

  const handleSaveCostEntry = useCallback(() => {
    if (!costDialogRow || !canEditProducts) return;
    setCostDialogError("");
    const payload = buildAdsOnlyCostEntryPayload(newCostForm.ads);
    if (!payload) {
      setCostDialogError(t("products.salePeriodCosts.entryInvalid"));
      return;
    }
    createCostEntryMutation.mutate(
      {
        productId: costDialogRow.product.id,
        periodId: costDialogRow.id,
        payload,
      },
      {
        onSuccess: () => {
          setNewCostForm(emptyAdsOnlyCostForm());
        },
        onError: () => {
          setCostDialogError(t("products.salePeriodCosts.createError"));
        },
      }
    );
  }, [costDialogRow, canEditProducts, newCostForm, createCostEntryMutation, t]);

  const openEdit = useCallback((row: SalePeriodListItem) => {
    setEditRow(row);
    setPeriodStartAt(row.start_at?.slice(0, 10) ?? "");
    setPeriodEndAt(row.end_at?.slice(0, 10) ?? "");
    setPeriodMarketingUser(marketingUserFromPeriod(row));
    setPeriodMarketingInput("");
    setPeriodFormsReceived(String(row.forms_received ?? 0));
    setPeriodRealOrders(String(row.real_orders ?? 0));
    setPeriodPurchaseCost(String(row.purchase_cost ?? ""));
    setPeriodSellingPrice(String(row.selling_price ?? ""));
    setPeriodShippingCost(String(row.shipping_cost ?? ""));
    setPeriodFeeOrTax(String(row.fee_or_tax ?? ""));
    setPeriodOperatingCost(String(row.operating_cost ?? "0"));
    setPeriodError("");
  }, []);

  const closeEdit = useCallback(() => {
    setEditRow(null);
    setPeriodStartAt("");
    setPeriodEndAt("");
    setPeriodMarketingUser(null);
    setPeriodMarketingInput("");
    setPeriodFormsReceived("");
    setPeriodRealOrders("");
    setPeriodPurchaseCost("");
    setPeriodSellingPrice("");
    setPeriodShippingCost("");
    setPeriodFeeOrTax("");
    setPeriodOperatingCost("");
    setPeriodError("");
  }, []);

  const handleSavePeriod = useCallback(() => {
    if (!editRow || !periodMarketingUser) return;
    if (!periodStartAt.trim() || !periodEndAt.trim()) return;
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
    updatePeriodMutation.mutate(
      {
        productId: editRow.product.id,
        periodId: editRow.id,
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
        onSuccess: closeEdit,
        onError: (err: Error) => {
          const msg = (err as { response?: { data?: { message?: string } } }).response?.data
            ?.message;
          setPeriodError(msg ?? t("products.salePeriodOverlapError"));
        },
      }
    );
  }, [
    editRow,
    periodMarketingUser,
    periodStartAt,
    periodEndAt,
    periodFormsReceived,
    periodRealOrders,
    periodPurchaseCost,
    periodSellingPrice,
    periodShippingCost,
    periodFeeOrTax,
    periodOperatingCost,
    updatePeriodMutation,
    closeEdit,
    t,
  ]);

  const handleDelete = useCallback(
    (row: SalePeriodListItem) => {
      if (!window.confirm(t("products.salePeriodDeleteConfirm"))) return;
      deletePeriodMutation.mutate({
        productId: row.product.id,
        periodId: row.id,
      });
    },
    [deletePeriodMutation, t]
  );

  const columns = useMemo<GridColDef<SalePeriodListItem>[]>(
    () => [
      {
        field: "product",
        headerName: t("products.salePeriodList.product"),
        flex: 1,
        minWidth: 180,
        valueGetter: (_, row) => row.product?.name ?? "",
        renderCell: ({ row }) =>
          row.product ? `${row.product.name} (${row.product.code})` : "–",
      },
      {
        field: "marketing_user",
        headerName: t("products.salePeriodList.marketing"),
        minWidth: 160,
        flex: 0.8,
        valueGetter: (_, row) => row.marketing_user?.name ?? "",
        renderCell: ({ row }) => row.marketing_user?.name ?? "–",
      },
      {
        field: "period_dates",
        headerName: t("products.salePeriodList.periodDates"),
        minWidth: 220,
        flex: 0.8,
        valueGetter: (_, row) => {
          const s = row.start_at?.slice(0, 10) ?? "";
          const e = row.end_at?.slice(0, 10) ?? "";
          return s && e ? `${s}|${e}` : "";
        },
        renderCell: ({ row }) => {
          const s = row.start_at?.slice(0, 10);
          const e = row.end_at?.slice(0, 10);
          if (!s || !e) return "–";
          return `${s} -> ${e}`;
        },
      },
      {
        field: "period_progress",
        headerName: t("products.salePeriodList.periodProgress"),
        width: 118,
        align: "center",
        headerAlign: "center",
        type: "number",
        valueGetter: (_, row) => {
          const s = row.start_at?.slice(0, 10);
          const e = row.end_at?.slice(0, 10);
          if (!s || !e) return 0;
          const total = inclusiveDaysBetweenYmd(s, e);
          const past = salePeriodDaysPastYmd(s, e);
          return total * 100_000 + past;
        },
        renderCell: ({ row }) => {
          const s = row.start_at?.slice(0, 10);
          const e = row.end_at?.slice(0, 10);
          if (!s || !e) return "–";
          const total = inclusiveDaysBetweenYmd(s, e);
          const past = salePeriodDaysPastYmd(s, e);
          return `${total}/${past}`;
        },
      },
      {
        field: "forms_vs_orders",
        headerName: t("products.salePeriodList.formsVsRealOrders"),
        width: 108,
        sortable: false,
        align: "center",
        headerAlign: "center",
        valueGetter: (_, row) =>
          `${row.forms_received ?? 0}/${row.real_orders ?? 0}`,
        renderCell: ({ row }) =>
          `${row.forms_received ?? 0}/${row.real_orders ?? 0}`,
      },
      {
        field: "cost_entries",
        headerName: t("products.salePeriodList.costSnapshots"),
        width: 112,
        sortable: false,
        valueGetter: (_, row) => row.cost_entries?.length ?? 0,
        renderCell: ({ row }) => {
          const n = row.cost_entries?.length ?? 0;
          return n === 0 ? "–" : t("products.salePeriodList.costSnapshotCount", { count: n });
        },
      },
      {
        field: "cost_actions",
        headerName: "",
        width: 52,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: ({ row }: { row: SalePeriodListItem }) => (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              openCosts(row);
            }}
            aria-label={t("products.salePeriodCosts.openCosts")}
          >
            <RequestQuoteIcon fontSize="small" />
          </IconButton>
        ),
      },
      ...(canEditProducts
        ? [
            {
              field: "actions",
              headerName: t("products.salePeriodList.actions"),
              width: 100,
              sortable: false,
              filterable: false,
              disableColumnMenu: true,
              renderCell: ({ row }: { row: SalePeriodListItem }) => (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(row);
                    }}
                    aria-label={t("products.editSalePeriod")}
                  >
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(row);
                    }}
                    aria-label={t("users.delete")}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Box>
              ),
            } as GridColDef<SalePeriodListItem>,
          ]
        : []),
    ],
    [t, canEditProducts, openEdit, openCosts, handleDelete]
  );

  const goToAdd = () => navigate("/products/add-sale-period");

  return (
    <Box sx={wrapperSx}>
      {error && (
        <Alert severity="error" sx={alertSx}>
          {t("products.salePeriodList.loadError")}
        </Alert>
      )}

      <Box sx={toolbarSx}>
        <Box sx={{ flex: 1 }} />
        {canEditProducts && (
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={goToAdd}
          >
            {t("products.salePeriodList.addSalePeriod")}
          </Button>
        )}
      </Box>

      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={getRowId}
        loading={isLoading}
        autoHeight
        disableRowSelectionOnClick
        sx={dataGridSx}
        initialState={{
          pagination: { paginationModel: { pageSize: 25 } },
        }}
        pageSizeOptions={[10, 25, 50]}
      />

      <Dialog open={editRow !== null} onClose={closeEdit} maxWidth="sm" fullWidth>
        <DialogTitle>{t("products.editSalePeriod")}</DialogTitle>
        <DialogContent>
          {editRow?.product && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, mt: 0.5 }}>
              {editRow.product.name} ({editRow.product.code})
            </Typography>
          )}
          {periodError && (
            <Alert severity="error" sx={dialogFieldSx}>
              {periodError}
            </Alert>
          )}
          <Autocomplete<UserWithRoles>
            fullWidth
            inputValue={periodMarketingInput}
            onInputChange={(_, value) => setPeriodMarketingInput(value)}
            options={marketingOptions}
            loading={marketingLoading}
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
            inputProps={{ min: 0, step: 0.01 }}
            sx={dialogFieldSx}
          />
          <TextField
            fullWidth
            type="number"
            label={t("products.salePeriods.periodSellingPrice")}
            value={periodSellingPrice}
            onChange={(e) => setPeriodSellingPrice(e.target.value)}
            inputProps={{ min: 0, step: 0.01 }}
            sx={dialogFieldSx}
          />
          <TextField
            fullWidth
            type="number"
            label={t("products.salePeriods.periodShippingCost")}
            value={periodShippingCost}
            onChange={(e) => setPeriodShippingCost(e.target.value)}
            inputProps={{ min: 0, step: 0.01 }}
            sx={dialogFieldSx}
          />
          <TextField
            fullWidth
            type="number"
            label={t("products.salePeriods.periodFeeOrTax")}
            value={periodFeeOrTax}
            onChange={(e) => setPeriodFeeOrTax(e.target.value)}
            inputProps={{ min: 0, step: 0.01 }}
            sx={dialogFieldSx}
          />
          <TextField
            fullWidth
            type="number"
            label={t("products.salePeriods.periodOperatingCost")}
            value={periodOperatingCost}
            onChange={(e) => setPeriodOperatingCost(e.target.value)}
            inputProps={{ min: 0, step: 0.01 }}
            sx={dialogFieldSx}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEdit}>{t("users.cancel")}</Button>
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
              updatePeriodMutation.isPending
            }
          >
            {updatePeriodMutation.isPending ? t("users.saving") : t("users.save")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={costDialogRow !== null} onClose={closeCosts} maxWidth="md" fullWidth>
        <DialogTitle>{t("products.salePeriodCosts.dialogTitle")}</DialogTitle>
        <DialogContent>
          {costDialogRow?.product && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {costDialogRow.product.name} ({costDialogRow.product.code}) ·{" "}
              {costDialogRow.start_at?.slice(0, 10) ?? "–"} –{" "}
              {costDialogRow.end_at?.slice(0, 10) ?? "–"}
            </Typography>
          )}
          {costEntriesLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <>
              <Box sx={costSummaryBoxSx}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: 2,
                    flexWrap: "wrap",
                    mb: 1.5,
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={700}>
                    {t("products.salePeriodCosts.summaryOperatingAdsGrandTotal")}
                  </Typography>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {formatCostAmount(operatingCostTotalForModal + adsEntriesTotal)}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  {t("products.salePeriodCosts.totalRow")}
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                    <Typography variant="body2" color="text.secondary">
                      {t("products.salePeriodCosts.summaryEntryCount")}
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {costEntries.length}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t("products.salePeriodCosts.summaryOperatingTotal")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
                        {t("products.salePeriodCosts.summaryOperatingPeriodNote", {
                          count: costEntries.length,
                          unit: formatCostAmount(Number(costDialogRow?.operating_cost ?? 0)),
                        })}
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={600}>
                      {formatCostAmount(operatingCostTotalForModal)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                    <Typography variant="body2" color="text.secondary">
                      {t("products.salePeriodCosts.summaryAdsTotal")}
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {formatCostAmount(adsEntriesTotal)}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
              <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>
                {t("products.salePeriodCosts.historyTitle")}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {t("products.salePeriodCosts.sectionDesc")}
              </Typography>
              {costEntries.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t("products.salePeriodCosts.noEntries")}
                </Typography>
              ) : (
                <TableContainer sx={{ mb: 2, maxHeight: 280 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={costTableHeadSx}>{t("products.salePeriodCosts.recordedAt")}</TableCell>
                        <TableCell align="right" sx={costTableHeadSx}>
                          {t("products.salePeriodCosts.adsRunCost")}
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {costEntries.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell sx={{ fontSize: "0.8125rem" }}>
                            {new Date(e.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell align="right" sx={{ py: 0.5, minWidth: 140 }}>
                            {canEditProducts ? (
                              <TextField
                                size="small"
                                type="number"
                                value={entryAdsDrafts[e.id] ?? ""}
                                onChange={(ev) =>
                                  setEntryAdsDrafts((d) => ({
                                    ...d,
                                    [e.id]: ev.target.value,
                                  }))
                                }
                                inputProps={{ min: 0, step: 0.01 }}
                                sx={{ width: "100%", maxWidth: 160 }}
                              />
                            ) : (
                              formatCostAmount(e.ads_run_cost)
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}

          {canEditProducts && (
            <>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t("products.salePeriodCosts.addEntry")}
              </Typography>
              {costDialogError && (
                <Alert severity="error" sx={dialogFieldSx}>
                  {costDialogError}
                </Alert>
              )}
              {costEntryEditError && (
                <Alert severity="error" sx={dialogFieldSx}>
                  {costEntryEditError}
                </Alert>
              )}
              <TextField
                fullWidth
                type="number"
                label={t("products.salePeriodCosts.adsRunCost")}
                value={newCostForm.ads}
                onChange={(e) => setNewCostForm((f) => ({ ...f, ads: e.target.value }))}
                inputProps={{ min: 0, step: 0.01 }}
                sx={dialogFieldSx}
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
          <Button onClick={closeCosts}>{t("users.cancel")}</Button>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {canEditProducts && costEntries.length > 0 && (
              <Button
                variant="outlined"
                onClick={() => void handleSaveCostEntryEdits()}
                disabled={
                  updateCostEntryMutation.isPending || !canSaveCostEntryEdits || costEntriesLoading
                }
              >
                {updateCostEntryMutation.isPending
                  ? t("users.saving")
                  : t("products.salePeriodCosts.saveCostEntryChanges")}
              </Button>
            )}
            {canEditProducts && (
              <Button
                variant="contained"
                onClick={handleSaveCostEntry}
                disabled={
                  createCostEntryMutation.isPending || !canSaveCostEntry || costEntriesLoading
                }
              >
                {createCostEntryMutation.isPending ? t("users.saving") : t("products.salePeriodCosts.saveEntry")}
              </Button>
            )}
          </Stack>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const SalePeriodListPage = memo(SalePeriodListPageComponent);
export default SalePeriodListPage;
