import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createUser,
  deleteUser,
  getAllMarketingUsers,
  getRoles,
  getUsers,
  updateUser,
} from "../services/userApi";
import type { CreateUserPayload, UpdateUserPayload } from "../types";

export const usersQueryKey = ["users"] as const;
export const rolesQueryKey = ["roles"] as const;

export function useUsers(params?: { page?: number; per_page?: number }) {
  return useQuery({
    queryKey: [...usersQueryKey, params],
    queryFn: () => getUsers(params),
  });
}

/** Load all marketing users once; filter in the UI (e.g. MUI Autocomplete). */
export function useMarketingUsersAll(enabled: boolean) {
  return useQuery({
    queryKey: [...usersQueryKey, "marketing-all"],
    queryFn: getAllMarketingUsers,
    enabled,
    staleTime: 5 * 60 * 1000,
    // Do not retry on 4xx/5xx: avoids hammering the API (default is 3 retries).
    retry: false,
  });
}

export function useRoles() {
  return useQuery({
    queryKey: rolesQueryKey,
    queryFn: getRoles,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKey });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateUserPayload }) =>
      updateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKey });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKey });
    },
  });
}
