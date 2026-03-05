import axiosClient from "@/shared/utils/axios";
import type {
  CreateProductAdLinkPayload,
  CreateProductSalePeriodPayload,
  Product,
  ProductAdLink,
  ProductFilters,
  ProductSalePeriod,
  ProductVisibilityPayload,
  ProductWithLogs,
  SalePeriodListItem,
  UpdateProductAdLinkPayload,
  UpdateProductPayload,
  UpdateProductSalePeriodPayload,
} from "../types";

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
  const { data } = await axiosClient.get<SalePeriodListItem[]>("/api/sale-periods");
  return data ?? [];
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
