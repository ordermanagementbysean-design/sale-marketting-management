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
  search?: string;
  role?: string;
}): Promise<UsersPaginatedResponse> => {
  const { data } = await axiosClient.get<UsersPaginatedResponse>("/api/users", {
    params,
  });
  return data;
};

const MARKETING_ROLE = "marketing";
const MARKETING_USERS_PAGE_SIZE = 100;

/** All marketing-role users (paginates until last page). For client-side search in autocompletes. */
export async function getAllMarketingUsers(): Promise<UserWithRoles[]> {
  const all: UserWithRoles[] = [];
  let page = 1;
  let lastPage = 1;
  do {
    const res = await getUsers({
      page,
      per_page: MARKETING_USERS_PAGE_SIZE,
      role: MARKETING_ROLE,
    });
    all.push(...(res.data ?? []));
    lastPage = res.last_page ?? 1;
    page += 1;
  } while (page <= lastPage);
  return all;
}

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
