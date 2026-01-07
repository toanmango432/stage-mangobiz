// Local API Types
// Type definitions for local mock API implementations

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  sessionId: string;
  message: string;
  cards?: ChatCard[];
  suggestions?: string[];
}

export interface ChatCard {
  type: 'service' | 'availability' | 'navigation';
  id?: string;
  title?: string;
  description?: string;
  price?: number;
  action?: {
    label: string;
    path: string;
  };
  slots?: string[];
  path?: string;
  label?: string;
}

export interface ChatStartResponse {
  sessionId: string;
  greeting: string;
  suggestions: string[];
}

export interface StoreApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface RateLimitInfo {
  count: number;
  resetAt: number;
}

export interface MangoService {
  id: string;
  name: string;
  price: number;
  duration: number;
  category: string;
}

export interface MangoAvailability {
  time: string;
  available: boolean;
}

export interface MangoSalonInfo {
  name: string;
  hours: string;
  address: string;
  phone: string;
  email: string;
}

export interface MangoPolicies {
  cancellation: string;
  lateness: string;
  payment: string;
}

// Tool calling types
export interface ToolCall {
  name: string;
  args: Record<string, any>;
}

export interface AIResponse {
  text: string;
  toolCalls?: ToolCall[];
}
