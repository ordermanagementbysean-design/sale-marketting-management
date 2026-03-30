import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import { useSalePeriodsStatusReport } from "../hooks/productHooks";
import type { SalePeriodStatusReportRow } from "../types";
import { operatingCostTotalDisplay } from "../utils/operatingCostDisplay";

const wrapperSx: SxProps<Theme> = { width: "100%" };
const alertSx: SxProps<Theme> = { mb: 2 };

function formatAmount(v: number): string {
  return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatPct(v: number | null): string {
  if (v == null) return "–";
  return `${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
}

function formatAmountWithPct(amount: number, pct: number | null): string {
  const amt = formatAmount(amount);
  if (pct == null) return amt;
  return `${amt}(${formatPct(pct)})`;
}

const tooltipPaperSx: SxProps<Theme> = {
  px: 1.5,
  py: 1,
  maxWidth: 320,
};

function ProductNameCell({ row }: { row: SalePeriodStatusReportRow }) {
  const { t } = useTranslation();
  const label = row.product ? `${row.product.name} (${row.product.code})` : "–";
  const title = (
    <Stack spacing={0.5} component="div">
      <Typography variant="body2">
        {t("products.salePeriodStatusReport.productPurchaseCostLabel")}: {formatAmount(row.purchase_cost)}
      </Typography>
      <Typography variant="body2">
        {t("products.salePeriodStatusReport.productSellingPriceLabel")}: {formatAmount(row.selling_price)}
      </Typography>
      <Typography variant="body2">
        {t("products.salePeriodStatusReport.productFeeOrTaxLabel")}: {formatPct(row.fee_or_tax)}
      </Typography>
      <Typography variant="body2">
        {t("products.salePeriodStatusReport.productShippingCostLabel")}: {formatAmount(row.shipping_cost)}
      </Typography>
    </Stack>
  );

  if (!row.product) {
    return <span>–</span>;
  }

  return (
    <Tooltip title={title} placement="top" arrow slotProps={{ tooltip: { sx: tooltipPaperSx } }}>
      <Box component="span" sx={{ cursor: "help", borderBottom: "1px dotted", borderColor: "divider" }}>
        {label}
      </Box>
    </Tooltip>
  );
}

function TotalAdsMetricsCell({ row }: { row: SalePeriodStatusReportRow }) {
  const { t } = useTranslation();
  const display = formatAmountWithPct(row.total_ads_run_cost, row.ad_cost_to_revenue_percent);
  const title = (
    <Stack spacing={0.5} component="div">
      <Typography variant="caption" display="block" color="text.secondary">
        {t("products.salePeriodStatusReport.adsTooltipTitle")}
      </Typography>
      <Typography variant="body2">
        {t("products.salePeriodStatusReport.adsTooltipTotalRunCost")}: {formatAmount(row.total_ads_run_cost)}
      </Typography>
      <Typography variant="body2">
        {t("products.salePeriodStatusReport.colAdsPerOrder")}:{" "}
        {row.ads_run_cost_per_order != null ? formatAmount(row.ads_run_cost_per_order) : "–"}
      </Typography>
      <Typography variant="body2">
        {t("products.salePeriodStatusReport.colAdsPerForm")}:{" "}
        {row.ads_run_cost_per_form != null ? formatAmount(row.ads_run_cost_per_form) : "–"}
      </Typography>
    </Stack>
  );

  return (
    <Tooltip title={title} placement="top" arrow slotProps={{ tooltip: { sx: tooltipPaperSx } }}>
      <Box component="span" sx={{ cursor: "help", borderBottom: "1px dotted", borderColor: "divider", whiteSpace: "nowrap" }}>
        {display}
      </Box>
    </Tooltip>
  );
}

function RevenueCell({ row }: { row: SalePeriodStatusReportRow }) {
  const { t } = useTranslation();
  const title = (
    <Stack spacing={0.5} component="div">
      <Typography variant="caption" display="block" color="text.secondary">
        {t("products.salePeriodStatusReport.revenueTooltipTitle")}
      </Typography>
      <Typography variant="body2">
        {t("products.salePeriodStatusReport.revenueTooltipFormula", {
          orders: row.real_orders,
          unitPrice: formatAmount(row.selling_price),
          revenue: formatAmount(row.revenue),
        })}
      </Typography>
    </Stack>
  );

  return (
    <Tooltip title={title} placement="top" arrow slotProps={{ tooltip: { sx: tooltipPaperSx } }}>
      <Box component="span" sx={{ cursor: "help", borderBottom: "1px dotted", borderColor: "divider" }}>
        {formatAmount(row.revenue)}
      </Box>
    </Tooltip>
  );
}

function TotalCostCell({
  row,
  operatingLabel,
}: {
  row: SalePeriodStatusReportRow;
  operatingLabel: string;
}) {
  const { t } = useTranslation();
  const b = row.total_cost_breakdown;
  const operatingLineAmount = operatingCostTotalDisplay(
    row.cost_entries_count,
    row.operating_cost_per_entry
  );
  const title = (
    <Stack spacing={0.5} component="div">
      <Typography variant="caption" display="block" color="text.secondary">
        {t("products.salePeriodStatusReport.totalCostTooltipTitle")}
      </Typography>
      <Typography variant="body2">
        {t("products.salePeriodStatusReport.breakdownInputLine", {
          purchaseCost: formatAmount(row.purchase_cost),
          orders: row.real_orders,
          total: formatAmount(b.total_input_cost),
        })}
      </Typography>
      <Typography variant="body2">
        {t("products.salePeriodStatusReport.breakdownRiskLine", {
          inputCost: formatAmount(b.total_input_cost),
          total: formatAmount(b.risk_cost),
        })}
      </Typography>
      <Typography variant="body2">
        {t("products.salePeriodStatusReport.breakdownShippingLine", {
          perOrder: formatAmount(row.shipping_cost),
          orders: row.real_orders,
          total: formatAmount(b.shipping_cost),
        })}
      </Typography>
      <Typography variant="body2">
        {t("products.salePeriodStatusReport.breakdownFeeTaxLine", {
          rate: formatAmount(row.fee_or_tax),
          revenue: formatAmount(row.revenue),
          total: formatAmount(b.total_fee_tax),
        })}
      </Typography>
      <Typography variant="body2">
        {operatingLabel}: {formatAmount(operatingLineAmount)}
      </Typography>
    </Stack>
  );

  return (
    <Tooltip title={title} placement="top" arrow slotProps={{ tooltip: { sx: tooltipPaperSx } }}>
      <Box component="span" sx={{ textDecoration: "underline dotted", cursor: "help" }}>
        {formatAmount(row.total_cost)}
      </Box>
    </Tooltip>
  );
}

const SalePeriodStatusReportPageComponent = () => {
  const { t } = useTranslation();
  const { data: rows = [], isLoading, error } = useSalePeriodsStatusReport();

  const operatingLabel = useMemo(
    () => t("products.salePeriodStatusReport.breakdownOperating"),
    [t]
  );

  return (
    <Box sx={wrapperSx}>
      <Typography variant="h5" component="h1" sx={{ mb: 1 }}>
        {t("products.salePeriodStatusReport.title")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 720 }}>
        {t("products.salePeriodStatusReport.subtitle")}
      </Typography>

      {error && (
        <Alert severity="error" sx={alertSx}>
          {t("products.salePeriodStatusReport.loadError")}
        </Alert>
      )}

      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={32} />
        </Box>
      )}

      {!isLoading && !error && rows.length === 0 && (
        <Typography color="text.secondary">{t("products.salePeriodStatusReport.empty")}</Typography>
      )}

      {!isLoading && rows.length > 0 && (
        <TableContainer component={Paper} variant="outlined" sx={{ maxWidth: "100%" }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>{t("products.salePeriodStatusReport.colProduct")}</TableCell>
                <TableCell align="right">{t("products.salePeriodStatusReport.colPeriodDaysProgress")}</TableCell>
                <TableCell align="right">{t("products.salePeriodStatusReport.colFormsVsOrders")}</TableCell>
                <TableCell align="right">{t("products.salePeriodStatusReport.colRevenue")}</TableCell>
                <TableCell align="right">{t("products.salePeriodStatusReport.colTotalAdsPctRev")}</TableCell>
                <TableCell align="right">{t("products.salePeriodStatusReport.colTotalCost")}</TableCell>
                <TableCell align="right">{t("products.salePeriodStatusReport.colProfitWithPct")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.sale_period_id} hover>
                  <TableCell>
                    <ProductNameCell row={row} />
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    {row.cost_entries_count} / {row.days_selling_until_now} / {row.period_days_total}
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    {row.forms_received} / {row.real_orders}
                  </TableCell>
                  <TableCell align="right">
                    <RevenueCell row={row} />
                  </TableCell>
                  <TableCell align="right">
                    <TotalAdsMetricsCell row={row} />
                  </TableCell>
                  <TableCell align="right">
                    <TotalCostCell row={row} operatingLabel={operatingLabel} />
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    {formatAmountWithPct(row.profit, row.profit_to_revenue_percent)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export const SalePeriodStatusReportPage = memo(SalePeriodStatusReportPageComponent);
export default SalePeriodStatusReportPage;
