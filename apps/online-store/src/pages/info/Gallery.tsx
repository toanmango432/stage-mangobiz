'use client';

import { useEffect, useState } from "react";
import NextImage from "next/image";
import { SEOHead } from "@/components/SEOHead";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Image } from "lucide-react";
import { collectionPageSchema, injectSchema } from "@/lib/seoSchema";
import { trackEvent } from "@/lib/analytics";

const trackNavClick = (page: string) => trackEvent({ event: 'nav_info_click', page });

const STORE_API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/store`;

interface GalleryItem {
  id: string;
  url: string;
  caption: string;
  tags: string[];
  date: string;
}

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<GalleryItem | null>(null);

  useEffect(() => {
    fetchGallery();
    trackNavClick('Gallery');
  }, [selectedTag]);

  useEffect(() => {
    const cleanup = injectSchema(collectionPageSchema({
      name: 'Gallery — Mango Nail & Beauty Salon',
      url: window.location.href,
      description: 'Browse our portfolio of beautiful nail art, hair styling, and beauty transformations'
    }));
    return cleanup;
  }, []);

  const fetchGallery = async () => {
    try {
      // TODO: Uncomment when store API is deployed and configured
      // const url = selectedTag 
      //   ? `${STORE_API_URL}/gallery?tag=${selectedTag}`
      //   : `${STORE_API_URL}/gallery`;
      // const response = await fetch(url);
      // if (!response.ok) throw new Error('Failed to fetch');
      // const data = await response.json();
      // setItems(data.items || []);
      
      // Using mock data directly for now
      throw new Error('Using mock data');
    } catch (error) {
      console.warn('Using fallback gallery data:', error);
      // Fallback mock data - using existing assets
      const mockGallery = [
        { id: '1', url: '/src/assets/work-balayage.jpg', caption: 'Beautiful balayage hair coloring', tags: ['hair', 'color'], date: '2024-01-15' },
        { id: '2', url: '/src/assets/work-beach-waves.jpg', caption: 'Effortless beach waves styling', tags: ['hair', 'styling'], date: '2024-01-14' },
        { id: '3', url: '/src/assets/work-french-manicure.jpg', caption: 'Classic French manicure', tags: ['nails', 'manicure'], date: '2024-01-13' },
        { id: '4', url: '/src/assets/work-ombre-nails.jpg', caption: 'Stunning ombre nail design', tags: ['nails', 'design'], date: '2024-01-12' },
        { id: '5', url: '/src/assets/work-bridal-makeup.jpg', caption: 'Elegant bridal makeup', tags: ['makeup', 'bridal'], date: '2024-01-11' },
        { id: '6', url: '/src/assets/work-glowing-facial.jpg', caption: 'Radiant facial treatment results', tags: ['facial', 'skincare'], date: '2024-01-10' }
      ];
      setItems(mockGallery);
    } finally {
      setLoading(false);
    }
  };


  const allTags = Array.from(new Set(items.flatMap(item => item.tags)));

  return (
    <>
      <SEOHead 
        title="Gallery — Mango Nail & Beauty Salon"
        description="Browse our portfolio of beautiful nail art, hair styling, makeup, and beauty transformations. See the quality work our expert team delivers."
        canonical="/info/gallery"
      />
      
      <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold">Our Work</h1>
              <p className="text-xl text-muted-foreground">
                Browse our portfolio of beautiful transformations
              </p>
            </div>

            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge 
                  variant={selectedTag === null ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedTag(null)}
                >
                  All
                </Badge>
                {allTags.map(tag => (
                  <Badge 
                    key={tag}
                    variant={selectedTag === tag ? "default" : "outline"}
                    className="cursor-pointer capitalize"
                    onClick={() => setSelectedTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : items.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="p-12 text-center">
                  <Image className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No photos yet</h3>
                  <p className="text-muted-foreground">Check back soon for our latest work!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                  <div 
                    key={item.id}
                    className="group relative aspect-square overflow-hidden rounded-lg bg-muted cursor-pointer"
                    onClick={() => setLightboxImage(item)}
                  >
                    <NextImage
                      src={item.url}
                      alt={item.caption || `Gallery image at Mango Nail & Beauty Salon`}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <p className="text-sm font-medium">{item.caption}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.tags.map(tag => (
                            <span 
                              key={tag}
                              className="text-xs bg-white/20 px-2 py-1 rounded capitalize"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
      </div>

      <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
        <DialogContent className="max-w-4xl p-0">
          {lightboxImage && (
            <div className="relative">
              <NextImage
                src={lightboxImage.url}
                alt={lightboxImage.caption || `Gallery image at Mango Nail & Beauty Salon`}
                width={800}
                height={600}
                unoptimized
                className="w-full h-auto"
                sizes="(max-width: 1024px) 100vw, 800px"
              />
              <div className="p-4 bg-background">
                <p className="font-medium">{lightboxImage.caption}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {lightboxImage.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="capitalize">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
