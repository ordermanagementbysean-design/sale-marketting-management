export interface RoleOption {
  value: string;
  label: string;
}

export interface UserWithRoles {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  role: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role?: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
  role?: string;
}

export interface UsersPaginatedResponse {
  data: UserWithRoles[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
