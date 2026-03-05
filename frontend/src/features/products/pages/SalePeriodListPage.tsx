import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import type { SxProps, Theme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useSalePeriodsList } from "../hooks/productHooks";
import type { SalePeriodListItem } from "../types";

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

const getRowId = (row: SalePeriodListItem) => row.id;

const SalePeriodListPageComponent = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { canEditProducts } = useAuth();
  const { data: periods = [], isLoading, error } = useSalePeriodsList();

  const rows = useMemo(() => (error ? [] : periods), [error, periods]);

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
        field: "start_at",
        headerName: t("products.salePeriods.startAt"),
        width: 120,
        valueFormatter: (v) => (v ? String(v).slice(0, 10) : ""),
      },
      {
        field: "end_at",
        headerName: t("products.salePeriods.endAt"),
        width: 120,
        valueFormatter: (v) => (v ? String(v).slice(0, 10) : ""),
      },
      {
        field: "ad_links",
        headerName: t("products.salePeriodList.adLinks"),
        flex: 1,
        minWidth: 200,
        valueGetter: (_, row) => row.ad_links ?? [],
        renderCell: ({ row }) => {
          const links = row.ad_links ?? [];
          if (links.length === 0) return "–";
          return links.map((l) => l.name).join(", ");
        },
      },
    ],
    [t]
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
    </Box>
  );
};

const SalePeriodListPage = memo(SalePeriodListPageComponent);
export default SalePeriodListPage;
