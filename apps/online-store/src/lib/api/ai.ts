import { AIRecommendation, AIUpsell, AIReminder } from "@/types/ai";

// Mock AI API with simulated latency
const API_DELAY = 300;

export async function fetchPersonalizedRecommendations(
  userId: string,
  context: 'homepage' | 'cart' | 'checkout' | 'account'
): Promise<AIRecommendation[]> {
  await simulateDelay();
  
  // Return cached recommendations from localStorage
  const cacheKey = `ai_rec_${context}_${userId}`;
  const cached = localStorage.getItem(cacheKey);
  
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    // Cache valid for 1 hour
    if (Date.now() - timestamp < 3600000) {
      return data;
    }
  }

  // Mock new recommendations
  const recommendations: AIRecommendation[] = [];
  
  localStorage.setItem(cacheKey, JSON.stringify({
    data: recommendations,
    timestamp: Date.now(),
  }));

  return recommendations;
}

export async function fetchAIUpsells(cartItems: any[]): Promise<AIUpsell[]> {
  await simulateDelay();
  
  const upsells: AIUpsell[] = [];

  // Example upsell logic
  const hasManicure = cartItems.some(item => 
    item.name?.toLowerCase().includes('manicure')
  );

  if (hasManicure) {
    upsells.push({
      id: 'upsell_topcoat',
      itemId: 'addon_topcoat',
      title: 'Add Long-Lasting Top Coat',
      description: 'Keep your manicure fresh for 2+ weeks',
      price: 8,
      savingsAmount: 2,
      reason: 'Pairs perfectly with gel manicures',
    });
  }

  return upsells;
}

export async function fetchAIReminders(userId: string): Promise<AIReminder[]> {
  await simulateDelay();

  const reminders: AIReminder[] = [];

  // Check last booking (mock)
  const daysSinceLastVisit = 21;
  
  if (daysSinceLastVisit >= 14) {
    reminders.push({
      id: 'reminder_rebooking',
      type: 'rebooking',
      title: 'Time for a refresh?',
      message: "It's been 3 weeks since your last manicure. Book now and keep those nails looking perfect!",
      actionLabel: 'Book Now',
      actionUrl: '/book',
      priority: 'high',
      createdAt: new Date().toISOString(),
    });
  }

  return reminders;
}

function simulateDelay(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, API_DELAY));
}
