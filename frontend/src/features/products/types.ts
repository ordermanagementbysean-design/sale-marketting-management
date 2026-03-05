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
