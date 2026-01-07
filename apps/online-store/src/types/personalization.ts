export interface UserProfile {
  userId: string;
  visitCount: number;
  firstVisit: string;
  lastVisit: string;
  favoriteCategories: string[];
  viewedItems: string[];
  cartHistory: string[];
  bookingHistory: string[];
  avgSpend: number;
  preferredTimeSlots: string[];
  preferences: {
    communicationChannel?: 'email' | 'sms';
    notificationFrequency?: 'high' | 'medium' | 'low';
    interests?: string[];
  };
}

export interface PersonalizationSession {
  sessionId: string;
  startTime: string;
  currentPage: string;
  interactions: InteractionEvent[];
}

export interface InteractionEvent {
  type: 'view' | 'click' | 'add_to_cart' | 'search' | 'booking';
  itemId?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
