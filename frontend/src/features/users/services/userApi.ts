import axiosClient from "@/shared/utils/axios";
import type {
  CreateUserPayload,
  RoleOption,
  UpdateUserPayload,
  UserWithRoles,
  UsersPaginatedResponse,
} from "../types";

export const getUsers = async (params?: {
  page?: number;
  per_page?: number;
}): Promise<UsersPaginatedResponse> => {
  const { data } = await axiosClient.get<UsersPaginatedResponse>("/api/users", {
    params,
  });
  return data;
};

export const getRoles = async (): Promise<RoleOption[]> => {
  const { data } = await axiosClient.get<RoleOption[]>("/api/roles");
  return data;
};

export const getUser = async (id: number): Promise<UserWithRoles> => {
  const { data } = await axiosClient.get<UserWithRoles>(`/api/users/${id}`);
  return data;
};

export const createUser = async (
  payload: CreateUserPayload
): Promise<UserWithRoles> => {
  const { data } = await axiosClient.post<UserWithRoles>("/api/users", payload);
  return data;
};

export const updateUser = async (
  id: number,
  payload: UpdateUserPayload
): Promise<UserWithRoles> => {
  const { data } = await axiosClient.put<UserWithRoles>(
    `/api/users/${id}`,
    payload
  );
  return data;
};

export const deleteUser = async (id: number): Promise<void> => {
  await axiosClient.delete(`/api/users/${id}`);
};
