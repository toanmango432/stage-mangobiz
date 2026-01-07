export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface CheckoutError extends ApiError {
  type: 'slot_conflict' | 'stock_changed' | 'payment_failed' | 'validation_error';
  affectedItems?: string[];
  suggestions?: string[];
}

export interface StockChange {
  itemId: string;
  itemName: string;
  oldPrice: number;
  newPrice: number;
  oldStock?: number;
  newStock?: number;
  available: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}
