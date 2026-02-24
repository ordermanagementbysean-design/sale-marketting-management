import { useQuery } from "@tanstack/react-query";
import { getOrders } from "../services/orderApi";
import type { OrderFilters, OrderResponse } from "../types";

export const useOrders = (filters: OrderFilters) => {
  return useQuery<OrderResponse>({
    queryKey: ["orders", filters],
    queryFn: () => getOrders(filters),
    staleTime: 1000 * 30,
  });
};