import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";

const recommendations = [
  {
    id: "1",
    name: "Classic Manicure",
    price: 35,
    image: "/placeholder.svg",
    type: "service"
  },
  {
    id: "2",
    name: "Nail Strengthener",
    price: 24.99,
    image: "/placeholder.svg",
    type: "product"
  },
  {
    id: "3",
    name: "Monthly Membership",
    price: 99,
    image: "/placeholder.svg",
    type: "membership"
  }
];

export const EmptyCartRecommendations = () => {
  const navigate = useNavigate();

  return (
    <div className="text-center py-12">
      <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
      <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
      <p className="text-muted-foreground mb-8">
        Start adding items to your cart to get started
      </p>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Recommended for you</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendations.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-32 object-cover rounded mb-3"
                />
                <h4 className="font-medium mb-1">{item.name}</h4>
                <p className="text-lg font-bold text-primary mb-3">
                  ${item.price.toFixed(2)}
                </p>
                <Button className="w-full" variant="outline">
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex gap-4 justify-center">
        <Button onClick={() => navigate("/shop")} size="lg">
          Shop Products
        </Button>
        <Button onClick={() => navigate("/book")} variant="outline" size="lg">
          Book Service
        </Button>
      </div>
    </div>
  );
};
