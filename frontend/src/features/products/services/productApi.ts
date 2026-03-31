import axiosClient from "@/shared/utils/axios";
import type {
  CreateProductAdLinkPayload,
  CreateProductSalePeriodCostEntryPayload,
  CreateProductSalePeriodPayload,
  Product,
  ProductAdLink,
  ProductFilters,
  ProductSalePeriod,
  ProductSalePeriodCostEntry,
  ProductVisibilityPayload,
  ProductWithLogs,
  ProductImportApiRow,
  ProductImportQueuedResponse,
  ProductImportStatusResponse,
  SalePeriodImportApiRow,
  SalePeriodImportResponse,
  SalePeriodListItem,
  SalePeriodStatusReportRow,
  UpdateProductAdLinkPayload,
  CreateProductPayload,
  UpdateProductPayload,
  UpdateProductSalePeriodPayload,
} from "../types";
import type { ProfitRowColorSettingsApi } from "../utils/profitPercentRowColors";

interface LaravelPaginatedResponse<T> {
  data: T[];
  total: number;
  current_page?: number;
  last_page?: number;
  per_page?: number;
}

export async function getProducts(
  params?: ProductFilters
): Promise<{ data: Product[]; total: number }> {
  const { data } = await axiosClient.get<LaravelPaginatedResponse<Product>>(
    "/api/products",
    { params }
  );
  return {
    data: data.data ?? [],
    total: data.total ?? 0,
  };
}

export async function getProduct(id: number): Promise<ProductWithLogs> {
  const { data } = await axiosClient.get<ProductWithLogs>(`/api/products/${id}`);
  return data;
}

export async function updateProduct(
  id: number,
  payload: UpdateProductPayload
): Promise<Product> {
  const { data } = await axiosClient.put<Product>(`/api/products/${id}`, payload);
  return data;
}

export async function createProduct(payload: CreateProductPayload): Promise<Product> {
  const { data } = await axiosClient.post<Product>("/api/products", payload);
  return data;
}

export async function getProductEligibleUsers(): Promise<
  { id: number; name: string; email: string; role: string }[]
> {
  const { data } = await axiosClient.get<
    { id: number; name: string; email: string; role: string }[]
  >("/api/products/eligible-users");
  return data ?? [];
}

export async function updateProductVisibility(
  id: number,
  payload: { visibility: ProductVisibilityPayload }
): Promise<ProductWithLogs> {
  const { data } = await axiosClient.put<ProductWithLogs>(
    `/api/products/${id}/visibility`,
    payload
  );
  return data;
}

export async function getSalePeriodsList(): Promise<SalePeriodListItem[]> {
  const { data } = await axiosClient.get<unknown>("/api/sale-periods");
  return Array.isArray(data) ? (data as SalePeriodListItem[]) : [];
}

export async function importSalePeriods(rows: SalePeriodImportApiRow[]): Promise<SalePeriodImportResponse> {
  const { data } = await axiosClient.post<SalePeriodImportResponse>("/api/sale-periods/import", { rows });
  return data;
}

export async function queueProductImport(
  rows: ProductImportApiRow[]
): Promise<ProductImportQueuedResponse> {
  const { data } = await axiosClient.post<ProductImportQueuedResponse>("/api/products/import", { rows });
  return data;
}

export async function getProductImportStatus(importId: string): Promise<ProductImportStatusResponse> {
  const { data } = await axiosClient.get<ProductImportStatusResponse>(
    `/api/products/import/${importId}`
  );
  return data;
}

export async function getSalePeriodsStatusReport(): Promise<SalePeriodStatusReportRow[]> {
  const { data } = await axiosClient.get<SalePeriodStatusReportRow[]>(
    "/api/sale-periods/status-report"
  );
  return data ?? [];
}

export async function getProfitRowColorSettings(): Promise<ProfitRowColorSettingsApi> {
  const { data } = await axiosClient.get<ProfitRowColorSettingsApi>(
    "/api/sale-periods/profit-row-color-settings"
  );
  return data;
}

export async function updateProfitRowColorSettings(
  payload: ProfitRowColorSettingsApi
): Promise<ProfitRowColorSettingsApi> {
  const { data } = await axiosClient.put<ProfitRowColorSettingsApi>(
    "/api/sale-periods/profit-row-color-settings",
    payload
  );
  return data;
}

export async function resetProfitRowColorSettings(): Promise<ProfitRowColorSettingsApi> {
  const { data } = await axiosClient.post<ProfitRowColorSettingsApi>(
    "/api/sale-periods/profit-row-color-settings/reset"
  );
  return data;
}

export async function getProductSalePeriods(
  productId: number
): Promise<ProductSalePeriod[]> {
  const { data } = await axiosClient.get<ProductSalePeriod[]>(
    `/api/products/${productId}/sale-periods`
  );
  return data ?? [];
}

export async function createProductSalePeriod(
  productId: number,
  payload: CreateProductSalePeriodPayload
): Promise<ProductSalePeriod> {
  const { data } = await axiosClient.post<ProductSalePeriod>(
    `/api/products/${productId}/sale-periods`,
    payload
  );
  return data;
}

export async function updateProductSalePeriod(
  productId: number,
  periodId: number,
  payload: UpdateProductSalePeriodPayload
): Promise<ProductSalePeriod> {
  const { data } = await axiosClient.put<ProductSalePeriod>(
    `/api/products/${productId}/sale-periods/${periodId}`,
    payload
  );
  return data;
}

export async function deleteProductSalePeriod(
  productId: number,
  periodId: number
): Promise<void> {
  await axiosClient.delete(
    `/api/products/${productId}/sale-periods/${periodId}`
  );
}

export async function getProductSalePeriodCostEntries(
  productId: number,
  periodId: number
): Promise<ProductSalePeriodCostEntry[]> {
  const { data } = await axiosClient.get<ProductSalePeriodCostEntry[]>(
    `/api/products/${productId}/sale-periods/${periodId}/cost-entries`
  );
  return data ?? [];
}

export async function createProductSalePeriodCostEntry(
  productId: number,
  periodId: number,
  payload: CreateProductSalePeriodCostEntryPayload
): Promise<ProductSalePeriodCostEntry> {
  const { data } = await axiosClient.post<ProductSalePeriodCostEntry>(
    `/api/products/${productId}/sale-periods/${periodId}/cost-entries`,
    payload
  );
  return data;
}

export async function updateProductSalePeriodCostEntry(
  productId: number,
  periodId: number,
  entryId: number,
  payload: CreateProductSalePeriodCostEntryPayload
): Promise<ProductSalePeriodCostEntry> {
  const { data } = await axiosClient.put<ProductSalePeriodCostEntry>(
    `/api/products/${productId}/sale-periods/${periodId}/cost-entries/${entryId}`,
    payload
  );
  return data;
}

export async function getProductAdLinks(productId: number): Promise<ProductAdLink[]> {
  const { data } = await axiosClient.get<ProductAdLink[]>(
    `/api/products/${productId}/ad-links`
  );
  return data ?? [];
}

export async function createProductAdLink(
  productId: number,
  payload: CreateProductAdLinkPayload
): Promise<ProductAdLink> {
  const { data } = await axiosClient.post<ProductAdLink>(
    `/api/products/${productId}/ad-links`,
    payload
  );
  return data;
}

export async function updateProductAdLink(
  productId: number,
  adLinkId: number,
  payload: UpdateProductAdLinkPayload
): Promise<ProductAdLink> {
  const { data } = await axiosClient.put<ProductAdLink>(
    `/api/products/${productId}/ad-links/${adLinkId}`,
    payload
  );
  return data;
}

export async function deleteProductAdLink(
  productId: number,
  adLinkId: number
): Promise<void> {
  await axiosClient.delete(`/api/products/${productId}/ad-links/${adLinkId}`);
}
