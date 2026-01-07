import { useState, useEffect } from 'react';
import { AIRecommendation } from '@/types/ai';
import { getPersonalizedServices, getPersonalizedProducts } from '@/lib/ai/recommendations';
import { getServices, getProducts } from '@/lib/api/store';

export function useAIRecommendations(type: 'services' | 'products' | 'both', limit: number = 6) {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRecommendations() {
      setIsLoading(true);
      
      try {
        const results: AIRecommendation[] = [];

        if (type === 'services' || type === 'both') {
          const services = await getServices();
          const serviceRecs = getPersonalizedServices(services.map(s => ({
            id: s.id,
            name: s.name,
            description: s.description,
            price: s.price,
            duration: s.durationMin,
            category: s.category || 'General',
            tags: s.tags || [],
            basePrice: s.price,
            showOnline: true,
            addOns: [],
            requiresDeposit: false,
            depositAmount: 0,
            cancellationPolicy: '',
            imageUrl: s.imageUrl,
            bufferTimeBefore: 0,
            bufferTimeAfter: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })), limit);
          results.push(...serviceRecs);
        }

        if (type === 'products' || type === 'both') {
          const products = await getProducts();
          const productRecs = getPersonalizedProducts(products.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            category: p.category || 'General',
            images: p.images || [],
            stock: p.stock,
            sku: '',
            costPrice: p.price * 0.5,
            retailPrice: p.price,
            taxable: true,
            trackInventory: true,
            lowStockThreshold: 10,
            brand: p.brand,
            weight: 0,
            dimensions: { length: 0, width: 0, height: 0 },
            isActive: true,
            isFeatured: false,
            tags: p.tags || [],
            stockQuantity: p.stock,
            allowBackorders: false,
            requiresShipping: true,
            collections: [],
            showOnline: true,
            featured: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })), limit);
          results.push(...productRecs);
        }

        // Sort by score and limit
        const sorted = results.sort((a, b) => b.score - a.score).slice(0, limit);
        setRecommendations(sorted);
      } catch (error) {
        console.error('Failed to load AI recommendations:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadRecommendations();
  }, [type, limit]);

  return { recommendations, isLoading };
}
