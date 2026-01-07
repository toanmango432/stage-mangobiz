import { Product } from '@/types/catalog';
import { ProductCard } from '@/components/ProductCard';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

interface RelatedProductsProps {
  products: Product[];
  onProductClick: (productId: string) => void;
}

export const RelatedProducts = ({ products, onProductClick }: RelatedProductsProps) => {
  if (products.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">You May Also Like</h2>
      
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent>
          {products.map((product) => (
            <CarouselItem key={product.id} className="md:basis-1/3 lg:basis-1/4">
              <ProductCard
                product={product}
                onClick={() => onProductClick(product.id)}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
};
