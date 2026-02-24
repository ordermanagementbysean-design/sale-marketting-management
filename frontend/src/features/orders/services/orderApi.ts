import axiosClient from "@/shared/utils/axios";
import type { Order, OrderFilters, OrderResponse } from "../types";

/** Laravel paginated response shape */
interface LaravelPaginatedResponse<T> {
  data: T[];
  total: number;
  current_page?: number;
  last_page?: number;
  per_page?: number;
}

export const getOrders = async (
  filters: OrderFilters
): Promise<OrderResponse> => {
  const { data } = await axiosClient.get<LaravelPaginatedResponse<Order>>(
    "/api/orders",
    { params: filters }
  );

  return {
    data: data.data ?? [],
    total: data.total ?? 0,
  };
};