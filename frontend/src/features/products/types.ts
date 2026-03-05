export interface ProductSalePeriod {
  id: number;
  product_id: number;
  start_at: string;
  end_at: string;
  created_at: string;
  updated_at: string;
  ad_links?: ProductAdLink[];
}

/** Sale period with product and ad_links for list view */
export interface SalePeriodListItem extends ProductSalePeriod {
  product: { id: number; name: string; code: string };
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
  search?: string;
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
}

export interface UpdateProductSalePeriodPayload {
  start_at?: string;
  end_at?: string;
}
