import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createUser,
  deleteUser,
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
