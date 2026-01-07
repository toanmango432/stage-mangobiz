import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface ServiceCardProps {
  title: string;
  description: string;
  duration: string;
  price: number;
  imageUrl?: string;
  onSelect: () => void;
}

export const ServiceCard = ({ title, description, duration, price, imageUrl, onSelect }: ServiceCardProps) => {
  return (
    <Card className="overflow-hidden shadow-card hover:shadow-elevated transition-shadow">
      {imageUrl && (
        <div className="relative aspect-video overflow-hidden bg-muted">
          <img 
            src={imageUrl} 
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription className="line-clamp-2">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{duration}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-primary">${price}</span>
          <Button onClick={onSelect}>
            Select
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
