import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getProduct,
  getProductEligibleUsers,
  getProducts,
  updateProduct,
  updateProductVisibility,
} from "../services/productApi";
import type {
  ProductFilters,
  ProductVisibilityPayload,
  UpdateProductPayload,
} from "../types";

export const productsQueryKey = ["products"] as const;

export function useProducts(params?: ProductFilters) {
  return useQuery({
    queryKey: [...productsQueryKey, params],
    queryFn: () => getProducts(params),
  });
}

export function useProduct(id: number | null) {
  return useQuery({
    queryKey: [...productsQueryKey, id],
    queryFn: () => getProduct(id!),
    enabled: id != null,
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateProductPayload }) =>
      updateProduct(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: productsQueryKey });
      queryClient.invalidateQueries({ queryKey: [...productsQueryKey, id] });
    },
  });
}

export function useProductEligibleUsers(enabled = true) {
  return useQuery({
    queryKey: [...productsQueryKey, "eligible-users"],
    queryFn: getProductEligibleUsers,
    enabled,
  });
}

export function useUpdateProductVisibility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      visibility,
    }: {
      id: number;
      visibility: ProductVisibilityPayload;
    }) => updateProductVisibility(id, { visibility }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: productsQueryKey });
      queryClient.invalidateQueries({ queryKey: [...productsQueryKey, id] });
    },
  });
}
