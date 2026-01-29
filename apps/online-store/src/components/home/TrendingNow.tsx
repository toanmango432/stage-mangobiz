import { ServiceCard } from "@/components/ServiceCard";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import { getServices } from "@/lib/api/store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StoreService } from "@/types/store";

export function TrendingNow() {
  const router = useRouter();
  const [services, setServices] = useState<StoreService[]>([]);

  useEffect(() => {
    const fetchServices = async () => {
      const data = await getServices();
      setServices(data.slice(0, 3));
    };
    fetchServices();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Trending Now</h2>
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              Popular
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Most booked services this week
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            title={service.name}
            description={service.description}
            duration={`${service.durationMin} min`}
            price={service.price}
            onSelect={() => router.push('/book')}
          />
        ))}
      </div>
    </div>
  );
}
