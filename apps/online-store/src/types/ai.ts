export interface AIRecommendation {
  id: string;
  type: 'service' | 'product' | 'membership' | 'bundle';
  itemId: string;
  title: string;
  description: string;
  price: number;
  image?: string;
  score: number;
  reason: string;
  category?: string;
}

export interface AISearchSuggestion {
  query: string;
  type: 'service' | 'product' | 'time' | 'category';
  confidence: number;
  result?: Record<string, unknown>;
}

export interface AIUpsell {
  id: string;
  itemId: string;
  title: string;
  description: string;
  price: number;
  savingsAmount?: number;
  image?: string;
  reason: string;
}

export interface AIReminder {
  id: string;
  type: 'rebooking' | 'anniversary' | 'promotion' | 'milestone';
  title: string;
  message: string;
  actionLabel: string;
  actionUrl: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface AIBundleSuggestion {
  id: string;
  title: string;
  items: string[];
  regularPrice: number;
  bundlePrice: number;
  savingsPercent: number;
  reason: string;
}
