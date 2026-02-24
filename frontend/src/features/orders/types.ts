export interface OrderFilters {
  page?: number;
  status?: string;
  source?: "ghtk" | "facebook";
}

export interface Order {
  id: number;
  order_code?: string;
  customer_name: string;
  phone: string;
  amount: number;
  fee?: number;
  status: string;
  source: string;
}

export interface OrderResponse {
  data: Order[];
  total: number;
}
