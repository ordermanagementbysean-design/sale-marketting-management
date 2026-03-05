import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createProductAdLink,
  createProductSalePeriod,
  deleteProductAdLink,
  deleteProductSalePeriod,
  getProduct,
  getProductAdLinks,
  getProductEligibleUsers,
  getProductSalePeriods,
  getProducts,
  getSalePeriodsList,
  updateProduct,
  updateProductAdLink,
  updateProductSalePeriod,
  updateProductVisibility,
} from "../services/productApi";
import type {
  CreateProductAdLinkPayload,
  CreateProductSalePeriodPayload,
  ProductFilters,
  ProductVisibilityPayload,
  UpdateProductAdLinkPayload,
  UpdateProductPayload,
  UpdateProductSalePeriodPayload,
} from "../types";

export const productsQueryKey = ["products"] as const;

export function useProducts(params?: ProductFilters) {
  return useQuery({
    queryKey: [...productsQueryKey, params],
    queryFn: () => getProducts(params),
  });
}

/** Search products for autocomplete; only runs when enabled (e.g. dropdown open). Use with debounced search term. */
export function useProductSearch(params: { search?: string; per_page?: number }, enabled: boolean) {
  return useQuery({
    queryKey: [...productsQueryKey, "search", params],
    queryFn: () => getProducts({ per_page: params.per_page ?? 25, ...params }),
    enabled,
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

export function useSalePeriodsList() {
  return useQuery({
    queryKey: [...productsQueryKey, "sale-periods-list"],
    queryFn: getSalePeriodsList,
  });
}

export function useProductSalePeriods(productId: number | null) {
  return useQuery({
    queryKey: [...productsQueryKey, productId, "sale-periods"],
    queryFn: () => getProductSalePeriods(productId!),
    enabled: productId != null,
  });
}

export function useCreateProductSalePeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      payload,
    }: {
      productId: number;
      payload: CreateProductSalePeriodPayload;
    }) => createProductSalePeriod(productId, payload),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: productsQueryKey });
      queryClient.invalidateQueries({ queryKey: [...productsQueryKey, productId] });
      queryClient.invalidateQueries({
        queryKey: [...productsQueryKey, productId, "sale-periods"],
      });
      queryClient.invalidateQueries({
        queryKey: [...productsQueryKey, "sale-periods-list"],
      });
    },
  });
}

export function useUpdateProductSalePeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      periodId,
      payload,
    }: {
      productId: number;
      periodId: number;
      payload: UpdateProductSalePeriodPayload;
    }) => updateProductSalePeriod(productId, periodId, payload),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: productsQueryKey });
      queryClient.invalidateQueries({ queryKey: [...productsQueryKey, productId] });
      queryClient.invalidateQueries({
        queryKey: [...productsQueryKey, productId, "sale-periods"],
      });
      queryClient.invalidateQueries({
        queryKey: [...productsQueryKey, "sale-periods-list"],
      });
    },
  });
}

export function useDeleteProductSalePeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      periodId,
    }: {
      productId: number;
      periodId: number;
    }) => deleteProductSalePeriod(productId, periodId),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: productsQueryKey });
      queryClient.invalidateQueries({ queryKey: [...productsQueryKey, productId] });
      queryClient.invalidateQueries({
        queryKey: [...productsQueryKey, productId, "sale-periods"],
      });
      queryClient.invalidateQueries({
        queryKey: [...productsQueryKey, "sale-periods-list"],
      });
    },
  });
}

export function useProductAdLinks(productId: number | null) {
  return useQuery({
    queryKey: [...productsQueryKey, productId, "ad-links"],
    queryFn: () => getProductAdLinks(productId!),
    enabled: productId != null,
  });
}

export function useCreateProductAdLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      payload,
    }: {
      productId: number;
      payload: CreateProductAdLinkPayload;
    }) => createProductAdLink(productId, payload),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: productsQueryKey });
      queryClient.invalidateQueries({ queryKey: [...productsQueryKey, productId] });
      queryClient.invalidateQueries({
        queryKey: [...productsQueryKey, productId, "ad-links"],
      });
    },
  });
}

export function useUpdateProductAdLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      adLinkId,
      payload,
    }: {
      productId: number;
      adLinkId: number;
      payload: UpdateProductAdLinkPayload;
    }) => updateProductAdLink(productId, adLinkId, payload),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: productsQueryKey });
      queryClient.invalidateQueries({ queryKey: [...productsQueryKey, productId] });
      queryClient.invalidateQueries({
        queryKey: [...productsQueryKey, productId, "ad-links"],
      });
    },
  });
}

export function useDeleteProductAdLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      adLinkId,
    }: {
      productId: number;
      adLinkId: number;
    }) => deleteProductAdLink(productId, adLinkId),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: productsQueryKey });
      queryClient.invalidateQueries({ queryKey: [...productsQueryKey, productId] });
      queryClient.invalidateQueries({
        queryKey: [...productsQueryKey, productId, "ad-links"],
      });
    },
  });
}
