import { memo, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import type { SxProps, Theme } from "@mui/material/styles";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import RefreshIcon from "@mui/icons-material/Refresh";
import { searchOrders } from "../hooks/orderHooks";
import type { Order } from "../types";

const getRowId = (row: Order) => row.id;

const ORDER_STATUS = {
  ALL: "",
  DELIVERED: "delivered",
  TRANSPORTING: "transporting",
  CANCEL: "cancel",
} as const;

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
const INITIAL_PAGINATION = { paginationModel: { pageSize: 25 } } as const;

const wrapperSx: SxProps<Theme> = { width: "100%" };
const alertSx: SxProps<Theme> = { mb: 2 };
const filterRowSx: SxProps<Theme> = { mb: 2, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" };
const formControlSx: SxProps<Theme> = { minWidth: 200 };
const dataGridSx: SxProps<Theme> = {
  border: "none",
  "& .MuiDataGrid-cell:focus": { outline: "none" },
  "& .MuiDataGrid-columnHeaders": { bgcolor: "grey.100", borderRadius: 1 },
};

const OrderPageComponent = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<string>(ORDER_STATUS.ALL);
  const filters = useMemo(() => ({ status }), [status]);

  const { data: orderResponseData, isLoading, error, refetch } = searchOrders(filters, 0);

  const columns = useMemo<GridColDef<Order>[]>(
    () => [
      { field: "id", headerName: t("orders.columns.id"), width: 80 },
      { field: "order_code", headerName: t("orders.columns.orderCode"), flex: 1, minWidth: 120 },
      { field: "customer_name", headerName: t("orders.columns.customer"), flex: 1, minWidth: 160 },
      { field: "phone", headerName: t("orders.columns.phone"), flex: 1, minWidth: 120 },
      { field: "status", headerName: t("orders.columns.status"), width: 130 },
      {
        field: "amount",
        headerName: t("orders.columns.amount"),
        width: 120,
        valueFormatter: (value) =>
          value != null ? new Intl.NumberFormat("vi-VN").format(Number(value)) : "",
      },
      {
        field: "fee",
        headerName: t("orders.columns.fee"),
        width: 100,
        valueFormatter: (value) =>
          value != null ? new Intl.NumberFormat("vi-VN").format(Number(value)) : "",
      },
    ],
    [t]
  );

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const rows = useMemo(
    () => (error ? [] : orderResponseData?.data ?? []),
    [error, orderResponseData]
  );

  return (
    <Box sx={wrapperSx}>
      {error && (
        <Alert severity="error" sx={alertSx}>
          {t("orders.loadError")}
        </Alert>
      )}

      <Box sx={filterRowSx}>
        <FormControl size="small" sx={formControlSx}>
          <InputLabel id="order-status-label">{t("orders.statusLabel")}</InputLabel>
          <Select
            labelId="order-status-label"
            value={status}
            label={t("orders.statusLabel")}
            onChange={(e) => setStatus(e.target.value)}
          >
            <MenuItem value={ORDER_STATUS.ALL}>{t("orders.statusAll")}</MenuItem>
            <MenuItem value={ORDER_STATUS.DELIVERED}>{t("orders.statusDelivered")}</MenuItem>
            <MenuItem value={ORDER_STATUS.TRANSPORTING}>{t("orders.statusTransporting")}</MenuItem>
            <MenuItem value={ORDER_STATUS.CANCEL}>{t("orders.statusCancel")}</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
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
        autoHeight
        pageSizeOptions={[...PAGE_SIZE_OPTIONS]}
        initialState={{ pagination: INITIAL_PAGINATION }}
        disableRowSelectionOnClick
        sx={dataGridSx}
      />
    </Box>
  );
};

const OrderPage = memo(OrderPageComponent);
export default OrderPage;
