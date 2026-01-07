import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const recommendations = [
  {
    id: "1",
    name: "Nail Care Kit",
    price: 29.99,
    image: "/placeholder.svg",
    description: "Complete nail care essentials"
  },
  {
    id: "2",
    name: "Cuticle Oil Set",
    price: 19.99,
    image: "/placeholder.svg",
    description: "Nourish and protect your cuticles"
  },
  {
    id: "3",
    name: "Hand Cream Duo",
    price: 24.99,
    image: "/placeholder.svg",
    description: "Luxurious moisturizing treatment"
  }
];

export const UpsellRecommendations = () => {
  return (
    <div className="py-8">
      <h3 className="text-2xl font-bold mb-6">Complete Your Experience</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendations.map((product) => (
          <Card key={product.id}>
            <CardContent className="p-4">
              <img
                src={product.image}
                alt={product.name}
                className="w-full aspect-square object-cover rounded-lg mb-3"
              />
              <h4 className="font-semibold mb-1">{product.name}</h4>
              <p className="text-sm text-muted-foreground mb-2">
                {product.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-primary">
                  ${product.price.toFixed(2)}
                </span>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
