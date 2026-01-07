import { ServiceCard } from "@/components/ServiceCard";
import { ProductCard } from "@/components/ProductCard";
import { AIBadge } from "@/components/ui/ai-badge";
import { useAIRecommendations } from "@/hooks/useAIRecommendations";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

interface AIRecommendationsProps {
  type: 'services' | 'products' | 'both';
  limit?: number;
}

export function AIRecommendations({ type, limit = 6 }: AIRecommendationsProps) {
  const { recommendations, isLoading } = useAIRecommendations(type, limit);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Recommended for You</h2>
            <AIBadge variant="chip" />
          </div>
          <p className="text-sm text-muted-foreground">
            Personalized selections based on your preferences
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((rec) => {
          if (rec.type === 'service') {
            return (
              <div key={rec.id} className="relative">
                <ServiceCard
                  title={rec.title}
                  description={rec.description}
                  duration="Varies"
                  price={rec.price}
                  onSelect={() => navigate('/book', {
                    state: {
                      service: {
                        id: rec.itemId,
                        name: rec.title,
                        description: rec.description,
                        duration: 60, // Default duration
                        price: rec.price,
                      }
                    }
                  })}
                />
                <div className="absolute top-3 right-3">
                  <AIBadge variant="chip">{rec.reason}</AIBadge>
                </div>
              </div>
            );
          }

          if (rec.type === 'product') {
            return (
              <div key={rec.id} className="relative">
                <ProductCard
                  product={{
                    id: rec.itemId,
                    name: rec.title,
                    description: rec.description,
                    retailPrice: rec.price,
                    images: rec.image ? [rec.image] : [],
                    category: rec.category || 'Products',
                    stockQuantity: 10,
                  } as any}
                  onClick={() => navigate(`/shop/${rec.itemId}`)}
                />
                <div className="absolute top-3 right-3">
                  <AIBadge variant="chip">{rec.reason}</AIBadge>
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
