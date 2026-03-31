import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createProductAdLink,
  createProductSalePeriod,
  createProductSalePeriodCostEntry,
  updateProductSalePeriodCostEntry,
  deleteProductAdLink,
  deleteProductSalePeriod,
  getProduct,
  getProductAdLinks,
  getProductEligibleUsers,
  getProductSalePeriodCostEntries,
  getProductSalePeriods,
  createProduct,
  getProducts,
  getSalePeriodsList,
  getSalePeriodsStatusReport,
  importSalePeriods,
  getProfitRowColorSettings,
  resetProfitRowColorSettings,
  updateProfitRowColorSettings,
  updateProduct,
  updateProductAdLink,
  updateProductSalePeriod,
  updateProductVisibility,
} from "../services/productApi";
import type {
  CreateProductAdLinkPayload,
  CreateProductSalePeriodCostEntryPayload,
  CreateProductSalePeriodPayload,
  CreateProductPayload,
  ProductFilters,
  ProductVisibilityPayload,
  SalePeriodImportApiRow,
  UpdateProductAdLinkPayload,
  UpdateProductPayload,
  UpdateProductSalePeriodPayload,
} from "../types";
import {
  profitRowColorSettingsFromApi,
  profitRowColorSettingsToApi,
  type ProfitRowColorSettings,
} from "../utils/profitPercentRowColors";

export const productsQueryKey = ["products"] as const;

export function useProducts(params?: ProductFilters) {
  return useQuery({
    queryKey: [...productsQueryKey, params],
    queryFn: () => getProducts(params),
  });
}

/** Search products for autocomplete; only active (selling) products. Debounce `search` in the caller. */
export function useProductSearch(
  params: { search?: string; per_page?: number; exclude_in_active_sale_period?: boolean },
  enabled: boolean
) {
  return useQuery({
    queryKey: [...productsQueryKey, "search", { ...params, status: 1 }],
    queryFn: () =>
      getProducts({
        per_page: params.per_page ?? 25,
        status: 1,
        search: params.search,
        exclude_in_active_sale_period: params.exclude_in_active_sale_period,
      }),
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

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProductPayload) => createProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsQueryKey });
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

export function useSalePeriodsStatusReport() {
  return useQuery({
    queryKey: [...productsQueryKey, "sale-periods-status-report"],
    queryFn: getSalePeriodsStatusReport,
  });
}

export function useImportSalePeriods() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rows: SalePeriodImportApiRow[]) => importSalePeriods(rows),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsQueryKey });
      queryClient.invalidateQueries({ queryKey: [...productsQueryKey, "sale-periods-list"] });
      queryClient.invalidateQueries({ queryKey: [...productsQueryKey, "sale-periods-status-report"] });
    },
  });
}

export function useProfitRowColorSettings() {
  return useQuery({
    queryKey: [...productsQueryKey, "profit-row-color-settings"],
    queryFn: async () => {
      const api = await getProfitRowColorSettings();
      return profitRowColorSettingsFromApi(api);
    },
  });
}

export function useUpdateProfitRowColorSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: ProfitRowColorSettings) =>
      updateProfitRowColorSettings(profitRowColorSettingsToApi(settings)).then((api) =>
        profitRowColorSettingsFromApi(api)
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...productsQueryKey, "profit-row-color-settings"] });
    },
  });
}

export function useResetProfitRowColorSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => resetProfitRowColorSettings().then((api) => profitRowColorSettingsFromApi(api)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...productsQueryKey, "profit-row-color-settings"] });
    },
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
      queryClient.invalidateQueries({
        queryKey: [...productsQueryKey, "sale-periods-status-report"],
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
      queryClient.invalidateQueries({
        queryKey: [...productsQueryKey, "sale-periods-status-report"],
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
      queryClient.invalidateQueries({
        queryKey: [...productsQueryKey, "sale-periods-status-report"],
      });
    },
  });
}

export function useProductSalePeriodCostEntries(
  productId: number | null,
  periodId: number | null,
  enabled: boolean
) {
  return useQuery({
    queryKey: [...productsQueryKey, productId, periodId, "cost-entries"],
    queryFn: () => getProductSalePeriodCostEntries(productId!, periodId!),
    enabled: Boolean(enabled && productId != null && periodId != null),
    retry: false,
  });
}

export function useCreateProductSalePeriodCostEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      periodId,
      payload,
    }: {
      productId: number;
      periodId: number;
      payload: CreateProductSalePeriodCostEntryPayload;
    }) => createProductSalePeriodCostEntry(productId, periodId, payload),
    onSuccess: (_, { productId, periodId }) => {
      invalidateAfterCostEntryWrite(queryClient, productId, periodId);
    },
  });
}

function invalidateAfterCostEntryWrite(
  queryClient: ReturnType<typeof useQueryClient>,
  productId: number,
  periodId: number
): void {
  queryClient.invalidateQueries({ queryKey: productsQueryKey });
  queryClient.invalidateQueries({ queryKey: [...productsQueryKey, productId] });
  queryClient.invalidateQueries({
    queryKey: [...productsQueryKey, productId, "sale-periods"],
  });
  queryClient.invalidateQueries({
    queryKey: [...productsQueryKey, "sale-periods-list"],
  });
  queryClient.invalidateQueries({
    queryKey: [...productsQueryKey, productId, periodId, "cost-entries"],
  });
  queryClient.invalidateQueries({
    queryKey: [...productsQueryKey, "sale-periods-status-report"],
  });
}

export function useUpdateProductSalePeriodCostEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      periodId,
      entryId,
      payload,
    }: {
      productId: number;
      periodId: number;
      entryId: number;
      payload: CreateProductSalePeriodCostEntryPayload;
    }) => updateProductSalePeriodCostEntry(productId, periodId, entryId, payload),
    onSuccess: (_, { productId, periodId }) => {
      invalidateAfterCostEntryWrite(queryClient, productId, periodId);
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
