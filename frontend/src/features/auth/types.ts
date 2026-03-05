export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  role?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  token_type: string;
  can_manage_users?: boolean;
  can_edit_products?: boolean;
}

export interface MeResponse {
  user: User;
  can_manage_users?: boolean;
  can_edit_products?: boolean;
}
