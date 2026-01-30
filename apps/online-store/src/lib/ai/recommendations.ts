import { AIRecommendation, AIBundleSuggestion } from "@/types/ai";
import { UserProfile } from "@/types/personalization";
import { Service, Product } from "@/types/catalog";
import type { MembershipPlan } from "@/types/catalog";
import { getUserProfile } from "./personalization";

export function getPersonalizedServices(
  services: Service[],
  limit: number = 6
): AIRecommendation[] {
  const profile = getUserProfile();
  
  return services
    .map(service => ({
      id: `rec_${service.id}`,
      type: 'service' as const,
      itemId: service.id,
      title: service.name,
      description: service.description,
      price: service.basePrice,
      image: service.image,
      score: calculateServiceScore(service, profile),
      reason: getRecommendationReason(service, profile),
      category: service.category,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function getPersonalizedProducts(
  products: Product[],
  limit: number = 6
): AIRecommendation[] {
  const profile = getUserProfile();
  
  return products
    .map(product => ({
      id: `rec_${product.id}`,
      type: 'product' as const,
      itemId: product.id,
      title: product.name,
      description: product.description,
      price: product.retailPrice,
      image: product.images[0],
      score: calculateProductScore(product, profile),
      reason: getProductRecommendationReason(product, profile),
      category: product.category,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function getSimilarItems(itemId: string, items: any[], limit: number = 4): any[] {
  const item = items.find(i => i.id === itemId);
  if (!item) return [];

  return items
    .filter(i => i.id !== itemId)
    .map(i => ({
      ...i,
      similarityScore: calculateSimilarity(item, i),
    }))
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, limit);
}

export function getBestValueMembership(
  memberships: MembershipPlan[]
): string | null {
  const profile = getUserProfile();

  if (profile.avgSpend === 0) return null;

  const monthlySpend = profile.avgSpend;

  // Find membership with best ROI
  const scored = memberships.map(m => {
    const monthlyCost = m.priceMonthly;
    const discountPercent = (m.features.discountPercentage as number) ?? 0;
    const potentialSavings = monthlySpend * (discountPercent / 100);
    const roi = potentialSavings - monthlyCost;

    return { ...m, roi };
  });

  const best = scored.sort((a, b) => b.roi - a.roi)[0];
  return best.roi > 0 ? best.id : null;
}

export function getSmartBundles(cartItems: any[]): AIBundleSuggestion[] {
  const bundles: AIBundleSuggestion[] = [];

  // Manicure + Pedicure bundle
  const hasManicure = cartItems.some(item => 
    item.name?.toLowerCase().includes('manicure')
  );
  const hasPedicure = cartItems.some(item => 
    item.name?.toLowerCase().includes('pedicure')
  );

  if (hasManicure && !hasPedicure) {
    bundles.push({
      id: 'bundle_mani_pedi',
      title: 'Manicure + Pedicure Bundle',
      items: ['manicure', 'pedicure'],
      regularPrice: 100,
      bundlePrice: 85,
      savingsPercent: 15,
      reason: 'Popular combo - save 15%',
    });
  }

  return bundles;
}

function calculateServiceScore(service: Service, profile: UserProfile): number {
  let score = 0;

  // Base popularity score
  score += 30;

  // Category match
  if (profile.favoriteCategories.includes(service.category)) {
    score += 25;
  }

  // Recently viewed
  if (profile.viewedItems.includes(service.id)) {
    score += 15;
  }

  // Price range match
  if (profile.avgSpend > 0) {
    const priceDiff = Math.abs(service.basePrice - profile.avgSpend);
    if (priceDiff < profile.avgSpend * 0.3) {
      score += 20;
    }
  }

  // Featured services
  if (service.showOnline) {
    score += 10;
  }

  return score;
}

function calculateProductScore(product: Product, profile: UserProfile): number {
  let score = 0;

  // Base popularity
  score += 30;

  // Category preference
  if (profile.favoriteCategories.includes(product.category)) {
    score += 25;
  }

  // Recently viewed
  if (profile.viewedItems.includes(product.id)) {
    score += 15;
  }

  // Featured products
  if (product.featured) {
    score += 15;
  }

  // In stock
  if (product.stockQuantity > 0) {
    score += 10;
  }

  return score;
}

function calculateSimilarity(item1: any, item2: any): number {
  let score = 0;

  // Same category
  if (item1.category === item2.category) {
    score += 50;
  }

  // Similar price range
  const price1 = item1.basePrice || item1.retailPrice || 0;
  const price2 = item2.basePrice || item2.retailPrice || 0;
  const priceDiff = Math.abs(price1 - price2);
  if (priceDiff < price1 * 0.3) {
    score += 30;
  }

  // Similar tags
  const tags1 = item1.tags || item1.collections || [];
  const tags2 = item2.tags || item2.collections || [];
  const commonTags = tags1.filter((t: string) => tags2.includes(t));
  score += commonTags.length * 5;

  return score;
}

function getRecommendationReason(service: Service, profile: UserProfile): string {
  if (profile.favoriteCategories.includes(service.category)) {
    return `Popular in ${service.category}`;
  }
  if (profile.viewedItems.includes(service.id)) {
    return 'You viewed this before';
  }
  return 'Trending at Mango';
}

function getProductRecommendationReason(product: Product, profile: UserProfile): string {
  if (profile.favoriteCategories.includes(product.category)) {
    return 'Based on your interests';
  }
  if (product.featured) {
    return 'Staff favorite';
  }
  return 'Popular this week';
}
