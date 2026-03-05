import axiosClient from "@/shared/utils/axios";
import type { LoginCredentials, LoginResponse, MeResponse } from "../types";

export const login = async (
  credentials: LoginCredentials
): Promise<LoginResponse> => {
  const { data } = await axiosClient.post<LoginResponse>(
    "/api/login",
    credentials
  );
  return data;
};

export const logout = async (): Promise<void> => {
  await axiosClient.post("/api/logout");
};

export const getMe = async (): Promise<MeResponse> => {
  const { data } = await axiosClient.get<MeResponse>("/api/me");
  return data;
};
