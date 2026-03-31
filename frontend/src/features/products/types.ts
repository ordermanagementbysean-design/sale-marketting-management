export interface ProductSalePeriodCostEntry {
  id: number;
  product_sale_period_id: number;
  ads_run_cost: string | number;
  created_at: string;
  updated_at: string;
}

export interface ProductSalePeriod {
  id: number;
  product_id: number;
  start_at: string;
  end_at: string;
  marketing_user_id?: number | null;
  marketing_user?: { id: number; name: string; email: string };
  /** Số form nhận (leads / forms received). */
  forms_received?: number;
  /** Đơn hàng thực tế. */
  real_orders?: number;
  purchase_cost?: string | number;
  selling_price?: string | number;
  shipping_cost?: string | number;
  fee_or_tax?: string | number;
  operating_cost?: string | number;
  created_at: string;
  updated_at: string;
  ad_links?: ProductAdLink[];
  cost_entries?: ProductSalePeriodCostEntry[];
}

export interface CreateProductSalePeriodCostEntryPayload {
  ads_run_cost: number;
}

/** Sale period with product and ad_links for list view */
export interface SalePeriodListItem extends ProductSalePeriod {
  product: { id: number; name: string; code: string };
}

export interface SalePeriodStatusReportCostBreakdown {
  total_input_cost: number;
  risk_cost: number;
  shipping_cost: number;
  total_fee_tax: number;
  operating_cost: number;
}

/** Row from GET /api/sale-periods/status-report */
export interface SalePeriodStatusReportRow {
  sale_period_id: number;
  product_id: number;
  product: { id: number; name: string; code: string } | null;
  marketing_user?: { id: number; name: string; email: string } | null;
  purchase_cost: number;
  selling_price: number;
  fee_or_tax: number;
  shipping_cost: number;
  start_at: string;
  end_at: string;
  period_days_total: number;
  days_selling_until_now: number;
  forms_received: number;
  real_orders: number;
  revenue: number;
  total_ads_run_cost: number;
  ads_run_cost_per_form: number | null;
  ads_run_cost_per_order: number | null;
  ad_cost_to_revenue_percent: number | null;
  total_cost: number;
  total_cost_breakdown: SalePeriodStatusReportCostBreakdown;
  /** Same formula as cost modal: count × operating_cost_per_entry */
  cost_entries_count: number;
  operating_cost_per_entry: number;
  profit: number;
  profit_to_revenue_percent: number | null;
}

export interface Product {
  id: number;
  name: string;
  code: string;
  unit: string;
  purchase_price: string | number;
  unit_price: string | number;
  vat_percent: string | number;
  vat_code: string | null;
  weight_gram: number;
  status: 0 | 1;
  created_at: string;
  updated_at: string;
}

export interface ProductAdLinkMetrics {
  orders_count: number;
  revenue: number;
  product_cost: number;
  conversion_rate: number | null;
  cpo: number | null;
  roas: number | null;
  profit: number;
}

export interface ProductAdLink {
  id: number;
  product_id: number;
  product_sale_period_id: number | null;
  name: string;
  ad_url: string | null;
  ad_identifier: string | null;
  clicks: number;
  ad_cost: string | number;
  created_at: string;
  updated_at: string;
  metrics?: ProductAdLinkMetrics;
}

export interface ProductEditLog {
  id: number;
  product_id: number;
  user_id: number;
  changes: Record<string, { old: unknown; new: unknown }>;
  created_at: string;
  user?: { id: number; name: string; email: string };
}

export interface ProductVisibilityRule {
  id: number;
  product_id: number;
  role: string;
  allow_all: boolean;
}

export interface ProductWithLogs extends Product {
  edit_logs?: ProductEditLog[];
  visibility_rules?: ProductVisibilityRule[];
  allowed_users?: { id: number; name: string; email: string; role: string }[];
  sale_periods?: ProductSalePeriod[];
  ad_links?: ProductAdLink[];
}

export interface VisibilityConfig {
  allow_all: boolean;
  user_ids: number[];
}

export type ProductVisibilityPayload = Record<string, VisibilityConfig>;

export interface ProductFilters {
  page?: number;
  per_page?: number;
  status?: number;
  /** When true (and user can edit products), API returns active and inactive products. */
  include_inactive?: boolean;
  search?: string;
  /** Exclude products that have a sale period covering today. */
  exclude_in_active_sale_period?: boolean;
}

export interface UpdateProductPayload {
  name?: string;
  code?: string;
  unit?: string;
  purchase_price?: number;
  unit_price?: number;
  vat_percent?: number;
  vat_code?: string | null;
  weight_gram?: number;
  status?: 0 | 1;
}

export interface CreateProductAdLinkPayload {
  product_sale_period_id: number;
  name: string;
  ad_url?: string | null;
  ad_identifier?: string | null;
  clicks?: number;
  ad_cost?: number;
}

export interface UpdateProductAdLinkPayload {
  product_sale_period_id?: number;
  name?: string;
  ad_url?: string | null;
  ad_identifier?: string | null;
  clicks?: number;
  ad_cost?: number;
}

export interface CreateProductSalePeriodPayload {
  start_at: string;
  end_at: string;
  marketing_user_id: number;
  forms_received?: number;
  real_orders?: number;
  purchase_cost: number;
  selling_price: number;
  shipping_cost: number;
  fee_or_tax: number;
  operating_cost?: number;
}

export interface UpdateProductSalePeriodPayload {
  start_at?: string;
  end_at?: string;
  marketing_user_id?: number;
  forms_received?: number;
  real_orders?: number;
  purchase_cost?: number;
  selling_price?: number;
  shipping_cost?: number;
  fee_or_tax?: number;
  operating_cost?: number;
}
