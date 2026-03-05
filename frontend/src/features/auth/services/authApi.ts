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

export interface ChangePasswordPayload {
  old_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export const changePassword = async (
  payload: ChangePasswordPayload
): Promise<{ message: string }> => {
  const { data } = await axiosClient.put<{ message: string }>(
    "/api/me/password",
    {
      old_password: payload.old_password,
      new_password: payload.new_password,
      new_password_confirmation: payload.new_password_confirmation,
    }
  );
  return data;
};
