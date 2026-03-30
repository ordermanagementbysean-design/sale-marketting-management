import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "",
  headers: {
    "Content-Type": "application/json",
    ...(import.meta.env.VITE_COMPANY_ID
      ? { "X-Company-Id": String(import.meta.env.VITE_COMPANY_ID) }
      : {}),
  },
});

const AUTH_HEADER = "Authorization";

export const AUTH_TOKEN_KEY = "auth_token";

export function setAuthToken(token: string | null): void {
  if (token) {
    axiosClient.defaults.headers.common[AUTH_HEADER] = `Bearer ${token}`;
  } else {
    delete axiosClient.defaults.headers.common[AUTH_HEADER];
  }
}

function clearAuthAndRedirect(): void {
  setAuthToken(null);
  localStorage.removeItem(AUTH_TOKEN_KEY);
  window.location.href = "/login";
}

axiosClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      clearAuthAndRedirect();
    }
    return Promise.reject(err);
  }
);

export default axiosClient;
