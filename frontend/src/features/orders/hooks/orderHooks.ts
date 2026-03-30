import { useQuery } from "@tanstack/react-query";
import { getOrders } from "../services/orderApi";
import type { OrderFilters, OrderResponse } from "../types";

/** Don't retry on 4xx (e.g. missing company_id, access denied); retrying won't fix them. */
const retryUnlessClientError = (
  failureCount: number,
  error: unknown,
  maxRetries: number
): boolean => {
  const status = error && typeof error === "object" && "response" in error
    ? (error as { response?: { status?: number } }).response?.status
    : undefined;
  if (status != null && status >= 400 && status < 500) return false;
  return failureCount < maxRetries;
};

/** Orders list query — use only from `OrderPage` so `/api/orders` runs on that route only. */
export const searchOrders = (
  filters: OrderFilters,
  retries: number = 0,
  enabled: boolean = true
) => {
  return useQuery<OrderResponse>({
    queryKey: ["orders", filters],
    queryFn: () => getOrders(filters),
    enabled,
    staleTime: 1000 * 30,
    retry: (failureCount, error) =>
      retryUnlessClientError(failureCount, error, retries),
  });
};