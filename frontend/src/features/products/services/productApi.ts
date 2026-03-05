import axiosClient from "@/shared/utils/axios";
import type {
  Product,
  ProductFilters,
  ProductVisibilityPayload,
  ProductWithLogs,
  UpdateProductPayload,
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
